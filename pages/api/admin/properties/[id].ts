import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

function isAdmin(req: NextApiRequest): boolean {
    const payload = verifyToken(getTokenFromHeader(req.headers.authorization) || '');
    return payload?.role === 'admin';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Accès non autorisé' });

    const { id } = req.query;

    // ── PUT: update property ──
    if (req.method === 'PUT') {
        const { titre, description, type, prix, surface, adresse, ville, statut, agent_id, images } = req.body;
        if (!titre || !type || !prix) {
            return res.status(400).json({ error: 'Titre, type et prix sont requis' });
        }
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                `UPDATE biens_immobiliers SET titre=$1, description=$2, type=$3, prix=$4,
         surface=$5, adresse=$6, ville=$7, statut=$8, agent_id=$9
         WHERE id=$10`,
                [titre, description || null, type, prix, surface || null, adresse || null, ville || null, statut || 'disponible', agent_id || null, id]
            );

            // Replace all images
            await client.query('DELETE FROM images_biens WHERE bien_id=$1', [id]);
            if (Array.isArray(images) && images.length > 0) {
                for (let i = 0; i < images.length; i++) {
                    const url = images[i]?.trim();
                    if (url) {
                        await client.query(
                            'INSERT INTO images_biens (bien_id, image_url, est_principale, ordre) VALUES ($1,$2,$3,$4)',
                            [id, url, i === 0, i + 1]
                        );
                    }
                }
            }

            await client.query('COMMIT');
            return res.status(200).json({ success: true });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error(err);
            return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
        } finally {
            client.release();
        }
    }

    // ── DELETE: delete property ──
    if (req.method === 'DELETE') {
        try {
            await pool.query('DELETE FROM biens_immobiliers WHERE id=$1', [id]);
            return res.status(200).json({ success: true });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur lors de la suppression' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
