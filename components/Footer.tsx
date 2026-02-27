import Link from 'next/link';
import { useLang } from '@/contexts/LangContext';

export default function Footer() {
    const { t } = useLang();
    const telegramBot = process.env.NEXT_PUBLIC_TELEGRAM_BOT || 'ImmobilierBot';

    return (
        <footer className="footer">
            <div className="footer-grid">
                <div className="footer-brand">
                    <div className="logo">Lux<span>Immo</span></div>
                    <p>{t.footer.desc}</p>
                </div>
                <div className="footer-col">
                    <h4>{t.footer.navTitle}</h4>
                    <ul>
                        <li><Link href="/">{t.nav.home}</Link></li>
                        <li><Link href="/properties">{t.nav.properties}</Link></li>
                        <li><Link href="/properties?type=vente">{t.nav.forSale}</Link></li>
                        <li><Link href="/properties?type=location">{t.nav.forRent}</Link></li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>{t.footer.servicesTitle}</h4>
                    <ul>
                        <li><a href="#">{t.footer.estimate}</a></li>
                        <li><a href="#">{t.footer.management}</a></li>
                        <li><a href="#">{t.footer.advice}</a></li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>{t.footer.contactTitle}</h4>
                    <ul>
                        <li>
                            <a href={`https://t.me/${telegramBot}`} target="_blank" rel="noopener noreferrer">
                                📲 Telegram Bot
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                <span>© 2026 LuxImmo. {t.footer.rights}</span>
                <span>{t.footer.platform}</span>
            </div>
        </footer>
    );
}
