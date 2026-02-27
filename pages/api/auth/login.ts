import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email, mot_de_passe } = req.body;
    if (!email || !mot_de_passe) {
        return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM utilisateurs WHERE email = $1 AND actif = true',
            [email.trim().toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }

        const user = result.rows[0];

        // Try bcrypt compare, fallback to plain text for dev environments
        let match = false;
        try {
            match = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
        } catch {
            match = false;
        }
        if (!match) {
            // Plain text fallback
            match = mot_de_passe === user.mot_de_passe;
        }

        if (!match) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }

        const token = signToken({
            id: user.id,
            email: user.email,
            nom: user.nom,
            prenom: user.prenom,
            role: user.role,
        });

        return res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                nom: user.nom,
                prenom: user.prenom,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}
