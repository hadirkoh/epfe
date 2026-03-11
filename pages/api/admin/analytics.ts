import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const payload = verifyToken(getTokenFromHeader(req.headers.authorization) || '');
    if (!payload || payload.role !== 'admin') return res.status(403).json({ error: 'Accès non autorisé' });

    try {
        // 1. Overall KPIs
        const kpiRes = await pool.query(`
            SELECT
                COUNT(*) AS total_biens,
                COUNT(*) FILTER (WHERE statut = 'disponible') AS disponibles,
                COUNT(*) FILTER (WHERE statut = 'vendu') AS vendus,
                COUNT(*) FILTER (WHERE statut = 'loué') AS loues,
                COUNT(*) FILTER (WHERE statut = 'réservé') AS reserves,
                COUNT(*) FILTER (WHERE type = 'vente') AS a_vendre,
                COUNT(*) FILTER (WHERE type = 'location') AS a_louer,
                COALESCE(AVG(prix) FILTER (WHERE type = 'vente'), 0) AS prix_moyen_vente,
                COALESCE(AVG(prix) FILTER (WHERE type = 'location'), 0) AS prix_moyen_location,
                COALESCE(SUM(prix) FILTER (WHERE statut = 'vendu'), 0) AS valeur_vendus,
                COALESCE(AVG(surface), 0) AS surface_moyenne
            FROM biens_immobiliers
        `);

        // 2. Properties by city (top 6)
        const cityRes = await pool.query(`
            SELECT ville, COUNT(*) AS count
            FROM biens_immobiliers
            WHERE ville IS NOT NULL AND ville != ''
            GROUP BY ville
            ORDER BY count DESC
            LIMIT 6
        `);

        // 3. Properties added per month (last 6 months)
        const monthlyRes = await pool.query(`
            SELECT
                TO_CHAR(date_creation, 'YYYY-MM') AS month,
                COUNT(*) AS count,
                COUNT(*) FILTER (WHERE type = 'vente') AS vente,
                COUNT(*) FILTER (WHERE type = 'location') AS location
            FROM biens_immobiliers
            WHERE date_creation >= NOW() - INTERVAL '6 months'
            GROUP BY month
            ORDER BY month ASC
        `);

        // 4. Agents performance (properties per agent)
        const agentRes = await pool.query(`
            SELECT
                u.nom || ' ' || u.prenom AS agent_name,
                u.email,
                COUNT(b.id) AS total,
                COUNT(b.id) FILTER (WHERE b.statut = 'disponible') AS disponibles,
                COUNT(b.id) FILTER (WHERE b.statut = 'vendu') AS vendus,
                COALESCE(SUM(b.prix) FILTER (WHERE b.statut = 'vendu'), 0) AS valeur_portefeuille
            FROM utilisateurs u
            LEFT JOIN biens_immobiliers b ON b.agent_id = u.id
            WHERE u.role = 'agent'
            GROUP BY u.id, u.nom, u.prenom, u.email
            ORDER BY total DESC
        `);

        // 5. Price distribution brackets (vente)
        const priceDistRes = await pool.query(`
            SELECT
                CASE
                    WHEN prix < 100000 THEN '< 100K'
                    WHEN prix < 250000 THEN '100K–250K'
                    WHEN prix < 500000 THEN '250K–500K'
                    WHEN prix < 1000000 THEN '500K–1M'
                    ELSE '> 1M'
                END AS bracket,
                COUNT(*) AS count
            FROM biens_immobiliers
            WHERE type = 'vente'
            GROUP BY bracket
            ORDER BY MIN(prix)
        `);

        // 6. Pending requests count
        const reqRes = await pool.query(`
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE statut = 'en_attente') AS pending,
                COUNT(*) FILTER (WHERE statut = 'approuve') AS approved,
                COUNT(*) FILTER (WHERE statut = 'rejete') AS rejected
            FROM demandes_acces
        `);

        // 7. Surface distribution
        const surfaceDistRes = await pool.query(`
            SELECT
                CASE
                    WHEN surface < 50 THEN '< 50m²'
                    WHEN surface < 100 THEN '50–100m²'
                    WHEN surface < 200 THEN '100–200m²'
                    WHEN surface < 500 THEN '200–500m²'
                    ELSE '> 500m²'
                END AS bracket,
                COUNT(*) AS count
            FROM biens_immobiliers
            WHERE surface IS NOT NULL
            GROUP BY bracket
            ORDER BY MIN(surface)
        `);

        return res.status(200).json({
            kpi: kpiRes.rows[0],
            byCity: cityRes.rows,
            monthly: monthlyRes.rows,
            agents: agentRes.rows,
            priceDist: priceDistRes.rows,
            requests: reqRes.rows[0],
            surfaceDist: surfaceDistRes.rows,
        });
    } catch (err) {
        console.error('Analytics error:', err);
        return res.status(500).json({ error: 'Erreur base de données' });
    }
}
