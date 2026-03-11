const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

export async function sendMessage(chatId: string | number, text: string, options: any = {}) {
    if (!TELEGRAM_TOKEN) {
        console.error('TELEGRAM_BOT_TOKEN is not defined');
        return null;
    }

    try {
        const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
                ...options,
            }),
        });

        return await response.json();
    } catch (error) {
        console.error('Error sending Telegram message:', error);
        return null;
    }
}

export async function setWebhook(url: string) {
    if (!TELEGRAM_TOKEN) return null;

    try {
        const response = await fetch(`${TELEGRAM_API}/setWebhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });

        return await response.json();
    } catch (error) {
        console.error('Error setting Telegram webhook:', error);
        return null;
    }
}
