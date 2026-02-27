import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { id } = req.query;

    try {
        // Fetch property details
        const propResult = await pool.query(
            `SELECT 
        b.*,
        u.nom AS agent_nom, u.prenom AS agent_prenom
       FROM biens_immobiliers b
       LEFT JOIN utilisateurs u ON b.agent_id = u.id
       WHERE b.id = $1`,
            [id]
        );

        if (propResult.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Fetch images
        const imgResult = await pool.query(
            `SELECT id, image_url, est_principale, ordre 
       FROM images_biens 
       WHERE bien_id = $1 
       ORDER BY est_principale DESC, ordre ASC`,
            [id]
        );

        const property = {
            ...propResult.rows[0],
            images: imgResult.rows,
        };

        res.status(200).json(property);
    } catch (error) {
        console.error('DB error:', error);
        res.status(500).json({ error: 'Database error' });
    }
}
