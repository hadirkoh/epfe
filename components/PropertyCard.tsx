import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

interface Property {
    id: number;
    titre: string;
    description: string;
    type: string;
    prix: number;
    surface: number;
    adresse: string;
    ville: string;
    statut: string;
    agent_nom?: string;
    agent_prenom?: string;
    image_principale: string | null;
}

interface Props {
    property: Property;
    fallback: string;
}

function formatPrice(prix: number, type: string) {
    const formatted = new Intl.NumberFormat('fr-TN', {
        style: 'decimal',
        minimumFractionDigits: 0,
    }).format(prix);
    return type === 'location' ? `${formatted} DT/mois` : `${formatted} DT`;
}

function TelegramIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
    );
}

export default function PropertyCard({ property, fallback }: Props) {
    const [imgSrc, setImgSrc] = useState(property.image_principale || fallback);
    const telegramBot = process.env.NEXT_PUBLIC_TELEGRAM_BOT || 'ImmobilierBot';

    // Telegram deep link: passes property id and title to the bot
    const telegramLink = `https://t.me/${telegramBot}?start=bien_${property.id}`;

    return (
        <article className="property-card">
            <Link href={`/properties/${property.id}`}>
                <div className="card-image">
                    <img
                        src={imgSrc}
                        alt={property.titre}
                        onError={() => setImgSrc(fallback)}
                        loading="lazy"
                    />
                    <span className={`card-badge ${property.type === 'vente' ? 'badge-vente' : 'badge-location'}`}>
                        {property.type === 'vente' ? 'Vente' : 'Location'}
                    </span>
                    <span className="card-status" title="Disponible" />
                </div>
            </Link>

            <div className="card-content">
                <div className="card-price">
                    {formatPrice(property.prix, property.type)}
                </div>
                <Link href={`/properties/${property.id}`}>
                    <h3 className="card-title">{property.titre}</h3>
                </Link>
                <div className="card-location">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                    {property.adresse ? `${property.adresse}, ` : ''}{property.ville || '—'}
                </div>

                <div className="card-features">
                    {property.surface && (
                        <div className="card-feature">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <path d="M3 9h18M9 21V9" />
                            </svg>
                            {property.surface} m²
                        </div>
                    )}
                    {property.ville && (
                        <div className="card-feature">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            {property.ville}
                        </div>
                    )}
                </div>

                <div className="card-actions">
                    <Link href={`/properties/${property.id}`} className="btn-details">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                        Voir détails
                    </Link>
                    <a
                        href={telegramLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-telegram btn-telegram-sm"
                        title="Demander une visite via Telegram"
                    >
                        <TelegramIcon />
                        Visite
                    </a>
                </div>
            </div>
        </article>
    );
}
