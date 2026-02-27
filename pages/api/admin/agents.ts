import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

function isAdmin(req: NextApiRequest): boolean {
    const payload = verifyToken(getTokenFromHeader(req.headers.authorization) || '');
    return payload?.role === 'admin';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (!isAdmin(req)) return res.status(403).json({ error: 'Accès non autorisé' });

    try {
        const result = await pool.query(
            `SELECT id, nom, prenom, email FROM utilisateurs WHERE role = 'agent' AND actif = true ORDER BY nom`
        );
        return res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erreur base de données' });
    }
}
