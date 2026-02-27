import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const payload = verifyToken(getTokenFromHeader(req.headers.authorization) || '');
    if (!payload || payload.role !== 'admin') {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    if (req.method === 'GET') {
        try {
            const result = await pool.query(`
                SELECT 
                    d.*, 
                    u.nom, u.prenom, u.email,
                    b.titre as propriete_titre
                FROM demandes_acces d
                JOIN utilisateurs u ON d.utilisateur_id = u.id
                LEFT JOIN biens_immobiliers b ON d.propriete_id = b.id
                ORDER BY d.date_creation DESC
            `);
            return res.status(200).json(result.rows);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    if (req.method === 'PUT') {
        const { id, statut } = req.body;
        if (!id || !statut) return res.status(400).json({ error: 'ID et statut requis' });

        try {
            await pool.query(
                'UPDATE demandes_acces SET statut = $1, date_reponse = CURRENT_TIMESTAMP WHERE id = $2',
                [statut, id]
            );
            return res.status(200).json({ message: 'Statut mis à jour' });
        } catch (err) {
            return res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
}
