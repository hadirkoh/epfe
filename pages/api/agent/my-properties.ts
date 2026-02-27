import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const payload = verifyToken(getTokenFromHeader(req.headers.authorization) || '');
    if (!payload || payload.role !== 'agent') {
        return res.status(403).json({ error: 'Accès non autorisé' });
    }

    try {
        const result = await pool.query(`
      SELECT 
        b.id, b.titre, b.type, b.prix, b.surface, b.adresse, b.ville, b.statut, b.date_creation,
        (SELECT image_url FROM images_biens WHERE bien_id = b.id AND est_principale = true LIMIT 1) AS image_principale
      FROM biens_immobiliers b
      WHERE b.agent_id = $1
      ORDER BY b.date_creation DESC
    `, [payload.id]);
        return res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erreur base de données' });
    }
}
