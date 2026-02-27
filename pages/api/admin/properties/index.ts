import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

function isAdmin(req: NextApiRequest): boolean {
    const payload = verifyToken(getTokenFromHeader(req.headers.authorization) || '');
    return payload?.role === 'admin';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Accès non autorisé' });

    // ── GET: list all properties ──
    if (req.method === 'GET') {
        try {
            const result = await pool.query(`
        SELECT 
          b.id, b.titre, b.type, b.prix, b.surface, b.adresse, b.ville, b.statut,
          b.date_creation, b.agent_id,
          u.nom AS agent_nom, u.prenom AS agent_prenom,
          (SELECT image_url FROM images_biens WHERE bien_id = b.id AND est_principale = true LIMIT 1) AS image_principale
        FROM biens_immobiliers b
        LEFT JOIN utilisateurs u ON b.agent_id = u.id
        ORDER BY b.date_creation DESC
      `);
            return res.status(200).json(result.rows);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur base de données' });
        }
    }

    // ── POST: create property ──
    if (req.method === 'POST') {
        const { titre, description, type, prix, surface, adresse, ville, statut, agent_id, images } = req.body;
        if (!titre || !type || !prix) {
            return res.status(400).json({ error: 'Titre, type et prix sont requis' });
        }
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(
                `INSERT INTO biens_immobiliers (titre, description, type, prix, surface, adresse, ville, statut, agent_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
                [titre, description || null, type, prix, surface || null, adresse || null, ville || null, statut || 'disponible', agent_id || null]
            );
            const newId = result.rows[0].id;

            // Insert images
            if (Array.isArray(images) && images.length > 0) {
                for (let i = 0; i < images.length; i++) {
                    const url = images[i]?.trim();
                    if (url) {
                        await client.query(
                            'INSERT INTO images_biens (bien_id, image_url, est_principale, ordre) VALUES ($1,$2,$3,$4)',
                            [newId, url, i === 0, i + 1]
                        );
                    }
                }
            }

            await client.query('COMMIT');
            return res.status(201).json({ id: newId });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error(err);
            return res.status(500).json({ error: 'Erreur lors de la création' });
        } finally {
            client.release();
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
