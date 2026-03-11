import type { NextApiRequest, NextApiResponse } from 'next';
import { sendMessage } from '@/lib/telegram';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const update = req.body;

    // Basic message handling
    if (update.message) {
        const { chat, text, from } = update.message;

        if (text === '/start') {
            await sendMessage(
                chat.id,
                `Bonjour <b>${from.first_name}</b> ! 👋\n\nBienvenue sur le bot de gestion immobilière LuxImmo. Je suis maintenant lié à votre application.`
            );
        } else if (text.startsWith('/start bien_')) {
            const propertyId = text.split('_')[1];
            await sendMessage(
                chat.id,
                `Vous êtes intéressé par le bien #${propertyId}. Un agent vous contactera sous peu.`
            );
        } else {
            await sendMessage(
                chat.id,
                `Vous avez envoyé : "${text}". Comment puis-je vous aider ?`
            );
        }
    }

    return res.status(200).json({ ok: true });
}
