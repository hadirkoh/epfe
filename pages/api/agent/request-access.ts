import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const payload = verifyToken(getTokenFromHeader(req.headers.authorization) || '');
    if (!payload || payload.role !== 'agent') {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    if (req.method === 'GET') {
        try {
            const result = await pool.query(
                `SELECT d.*, b.titre as propriete_titre 
                 FROM demandes_acces d
                 LEFT JOIN biens_immobiliers b ON d.propriete_id = b.id
                 WHERE d.utilisateur_id = $1 
                 ORDER BY d.date_creation DESC`,
                [payload.id]
            );
            return res.status(200).json(result.rows);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    if (req.method === 'POST') {
        const { explication, type_action, propriete_id } = req.body;
        if (!explication || !type_action) {
            return res.status(400).json({ error: 'Explication et type d\'action requis' });
        }

        try {
            // Check if there is already a pending request for this specific action/property
            const check = await pool.query(
                `SELECT id FROM demandes_acces 
                 WHERE utilisateur_id = $1 AND statut = 'en_attente' AND type_action = $2 
                 AND (propriete_id = $3 OR (propriete_id IS NULL AND $3 IS NULL))`,
                [payload.id, type_action, propriete_id || null]
            );
            if (check.rows.length > 0) {
                return res.status(400).json({ error: 'Vous avez déjà une demande similaire en attente' });
            }

            await pool.query(
                'INSERT INTO demandes_acces (utilisateur_id, explication, type_action, propriete_id) VALUES ($1, $2, $3, $4)',
                [payload.id, explication, type_action, propriete_id || null]
            );
            return res.status(201).json({ message: 'Demande envoyée avec succès' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
}
