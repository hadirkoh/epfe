import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { type, ville, prix_min, prix_max, surface_min, surface_max, search } = req.query;

    let query = `
    SELECT 
      b.id, b.titre, b.description, b.type, b.prix, b.surface,
      b.adresse, b.ville, b.statut, b.date_creation,
      u.nom AS agent_nom, u.prenom AS agent_prenom,
      (SELECT image_url FROM images_biens WHERE bien_id = b.id AND est_principale = true LIMIT 1) AS image_principale
    FROM biens_immobiliers b
    LEFT JOIN utilisateurs u ON b.agent_id = u.id
    WHERE b.statut = 'disponible'
  `;

    const params: (string | number)[] = [];
    let paramCount = 1;

    if (type && type !== 'all') {
        query += ` AND b.type = $${paramCount++}`;
        params.push(type as string);
    }
    if (ville) {
        query += ` AND LOWER(b.ville) LIKE $${paramCount++}`;
        params.push(`%${(ville as string).toLowerCase()}%`);
    }
    if (prix_min) {
        query += ` AND b.prix >= $${paramCount++}`;
        params.push(Number(prix_min));
    }
    if (prix_max) {
        query += ` AND b.prix <= $${paramCount++}`;
        params.push(Number(prix_max));
    }
    if (surface_min) {
        query += ` AND b.surface >= $${paramCount++}`;
        params.push(Number(surface_min));
    }
    if (surface_max) {
        query += ` AND b.surface <= $${paramCount++}`;
        params.push(Number(surface_max));
    }
    if (search) {
        query += ` AND (LOWER(b.titre) LIKE $${paramCount} OR LOWER(b.adresse) LIKE $${paramCount} OR LOWER(b.ville) LIKE $${paramCount})`;
        params.push(`%${(search as string).toLowerCase()}%`);
        paramCount++;
    }

    query += ` ORDER BY b.date_creation DESC`;

    try {
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('DB error:', error);
        res.status(500).json({ error: 'Database error' });
    }
}
