import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLang } from '@/contexts/LangContext';

interface PropertyImage {
    id: number;
    image_url: string;
    est_principale: boolean;
    ordre: number;
}

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
    agent_nom: string;
    agent_prenom: string;
    date_creation: string;
    images: PropertyImage[];
}

const FALLBACKS: Record<string, string> = {
    vente: '/prop_villa.png',
    location: '/prop_apartment.png',
    default: '/prop_studio.png',
};

function getFallback(type: string) {
    return FALLBACKS[type] || FALLBACKS.default;
}

function formatPrice(prix: number, type: string, lang: string) {
    const locale = lang === 'ar' ? 'ar-TN' : lang === 'fr' ? 'fr-TN' : 'en-US';
    const formatted = new Intl.NumberFormat(locale, { style: 'decimal', minimumFractionDigits: 0 }).format(prix);
    const suffix = type === 'location' ? (lang === 'ar' ? ' د.ت/شهر' : lang === 'fr' ? ' DT/mois' : ' DT/month') : ' DT';
    return `${formatted}${suffix}`;
}

function TelegramIcon({ size = 22 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
    );
}

export default function PropertyDetail() {
    const { t, lang } = useLang();
    const router = useRouter();
    const { id } = router.query;

    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Gallery state
    const [activeImg, setActiveImg] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalIdx, setModalIdx] = useState(0);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetch(`/api/properties/${id}`)
            .then((r) => {
                if (!r.ok) throw new Error('Not found');
                return r.json();
            })
            .then((data) => {
                setProperty(data);
                setLoading(false);
            })
            .catch(() => {
                setError(t.common.error);
                setLoading(false);
            });
    }, [id, t]);

    if (loading) return <LoadingDetail />;
    if (error || !property) return <ErrorDetail error={error} />;

    // Build image list: use DB images or fall back to generated placeholder
    const fallbackImg = getFallback(property.type);
    const allImages = property.images.length > 0
        ? property.images.map((img) => img.image_url)
        : [fallbackImg, '/prop_apartment.png', '/prop_office.png', '/prop_studio.png'];

    const telegramBot = process.env.NEXT_PUBLIC_TELEGRAM_BOT || 'ImmobilierBot';
    // Deep link encodes property id and title for the bot
    const telegramDeepLink = `https://t.me/${telegramBot}?start=bien_${property.id}_${encodeURIComponent(property.titre.slice(0, 30))}`;

    const agentInitials = property.agent_nom
        ? `${property.agent_prenom?.[0] || ''}${property.agent_nom?.[0] || ''}`.toUpperCase()
        : 'AG';

    const handlePrev = () => setModalIdx((i) => (i - 1 + allImages.length) % allImages.length);
    const handleNext = () => setModalIdx((i) => (i + 1) % allImages.length);

    const isAr = lang === 'ar';

    return (
        <>
            <Head>
                <title>{property.titre} – LuxImmo</title>
                <meta name="description" content={property.description?.slice(0, 160) || property.titre} />
            </Head>

            <Navbar />

            <div className="detail-hero">
                {/* Photo Gallery */}
                <div className="gallery-wrapper" style={{ maxHeight: 480, borderRadius: 0 }}>
                    {/* Main image */}
                    <div className="gallery-main" onClick={() => { setModalOpen(true); setModalIdx(activeImg); }} style={{ cursor: 'zoom-in' }}>
                        <img
                            src={allImages[activeImg]}
                            alt={property.titre}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImg; }}
                        />
                        <div style={{
                            position: 'absolute', bottom: 16, [isAr ? 'right' : 'left']: 16,
                            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                            padding: '4px 12px', borderRadius: 6, fontSize: '0.78rem', color: '#fff',
                        }}>
                            🔍 {t.detail.clickZoom}
                        </div>
                    </div>

                    {/* Thumbnails */}
                    {allImages.length > 1 && (
                        <div className="gallery-thumbs">
                            {allImages.slice(1, 3).map((url, idx) => (
                                <div
                                    key={idx}
                                    className="gallery-thumb"
                                    onClick={() => setActiveImg(idx + 1)}
                                    style={{ outline: activeImg === idx + 1 ? '2px solid var(--gold)' : 'none' }}
                                >
                                    <img
                                        src={url}
                                        alt={`Photo ${idx + 2}`}
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImg; }}
                                    />
                                    {idx === 1 && allImages.length > 3 && (
                                        <div className="gallery-overlay-count" onClick={() => { setModalOpen(true); setModalIdx(2); }}>
                                            +{allImages.length - 3}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Thumbnail strip */}
                {allImages.length > 3 && (
                    <div style={{
                        display: 'flex', gap: 8, padding: '10px 2rem',
                        background: 'var(--dark-2)', borderBottom: '1px solid var(--glass-border)',
                        overflowX: 'auto',
                    }}>
                        {allImages.map((url, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImg(idx)}
                                style={{
                                    width: 64, height: 48, borderRadius: 6, overflow: 'hidden',
                                    border: activeImg === idx ? '2px solid var(--gold)' : '2px solid transparent',
                                    padding: 0, cursor: 'pointer', flexShrink: 0,
                                }}
                            >
                                <img
                                    src={url}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImg; }}
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Layout */}
            <div className="detail-layout">
                {/* Left: Main details */}
                <div className="detail-main">
                    {/* Breadcrumb */}
                    <div className="breadcrumb">
                        <Link href="/">{t.nav.home}</Link>
                        <span className="sep">{isAr ? '‹' : '›'}</span>
                        <Link href="/properties">{t.nav.properties}</Link>
                        <span className="sep">{isAr ? '‹' : '›'}</span>
                        <span className="current">{property.titre}</span>
                    </div>

                    {/* Header */}
                    <div className="detail-header">
                        <div className="detail-badges">
                            <span className={`detail-type-badge ${property.type === 'vente' ? 'badge-vente' : 'badge-location'}`}>
                                {property.type === 'vente' ? `🏷️ ${t.detail.forSale}` : `🔑 ${t.detail.forRent}`}
                            </span>
                            <span className="detail-status-badge">✓ {t.detail.available}</span>
                        </div>
                        <h1 className="detail-title">{property.titre}</h1>
                        {(property.adresse || property.ville) && (
                            <div className="detail-location">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                                {[property.adresse, property.ville].filter(Boolean).join(', ')}
                            </div>
                        )}
                    </div>

                    {/* Price */}
                    <div className="detail-price-block">
                        <div>
                            <div className="detail-price">{formatPrice(property.prix, property.type, lang)}</div>
                            <div className="detail-price-note">
                                {property.type === 'location' ? t.detail.ref : t.detail.price}
                            </div>
                        </div>
                        <a
                            href={telegramDeepLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-telegram"
                        >
                            <TelegramIcon />
                            {t.detail.visitTelegram}
                        </a>
                    </div>

                    {/* Specs */}
                    <div className="detail-specs">
                        {property.surface && (
                            <div className="spec-card">
                                <div className="spec-icon">📐</div>
                                <div className="spec-value">{property.surface} m²</div>
                                <div className="spec-label">{t.detail.surface}</div>
                            </div>
                        )}
                        {property.ville && (
                            <div className="spec-card">
                                <div className="spec-icon">🌆</div>
                                <div className="spec-value">{property.ville}</div>
                                <div className="spec-label">{t.detail.city}</div>
                            </div>
                        )}
                        <div className="spec-card">
                            <div className="spec-icon">{property.type === 'vente' ? '🏷️' : '🔑'}</div>
                            <div className="spec-value" style={{ textTransform: 'capitalize' }}>
                                {property.type === 'vente' ? t.detail.forSale : t.detail.forRent}
                            </div>
                            <div className="spec-label">{t.detail.type}</div>
                        </div>
                    </div>

                    {/* Description */}
                    {property.description && (
                        <div className="detail-section">
                            <h3>{t.detail.description}</h3>
                            <p className="detail-description">{property.description}</p>
                        </div>
                    )}

                    {/* Characteristics */}
                    <div className="detail-section">
                        <h3>{t.detail.specs}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
                            {[
                                { label: t.detail.ref, value: `#${property.id}` },
                                { label: t.detail.type, value: property.type === 'vente' ? t.detail.forSale : t.detail.forRent },
                                { label: t.detail.surface, value: property.surface ? `${property.surface} m²` : '—' },
                                { label: t.detail.city, value: property.ville || '—' },
                                { label: t.detail.location, value: property.adresse || '—' },
                                { label: t.detail.status, value: t.detail.available },
                                { label: t.detail.date, value: property.date_creation ? new Date(property.date_creation).toLocaleDateString(isAr ? 'ar-TN' : 'fr-FR') : '—' },
                                { label: t.detail.agent, value: property.agent_nom ? `${property.agent_prenom} ${property.agent_nom}` : '—' },
                            ].map((item) => (
                                <div key={item.label} style={{
                                    background: 'var(--dark-2)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: 10,
                                    padding: '0.85rem 1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                }}>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
                                        {item.label}
                                    </span>
                                    <span style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Map */}
                    <div className="detail-section">
                        <h3>{t.detail.location}</h3>
                        <div className="map-placeholder">
                            {property.ville ? (
                                <iframe
                                    title="Localisation du bien"
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent((property.adresse ? property.adresse + ', ' : '') + (property.ville || ''))}&output=embed`}
                                    allowFullScreen
                                />
                            ) : (
                                <>
                                    <span style={{ fontSize: '2rem' }}>🗺️</span>
                                    <span>{t.detail.location}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Sidebar */}
                <div className="detail-sidebar">
                    {/* Telegram CTA */}
                    <div className="sidebar-telegram-cta">
                        <h3>📲 {t.detail.visitTelegram}</h3>
                        <p>{t.common.ctaDesc}</p>
                        <a
                            href={telegramDeepLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-telegram"
                            style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: '1rem' }}
                        >
                            <TelegramIcon size={20} />
                            {t.detail.requestVisit}
                        </a>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.8rem', textAlign: 'center' }}>
                            {t.features.f4_desc}
                        </p>
                    </div>

                    {/* Agent Card */}
                    {property.agent_nom && (
                        <div className="sidebar-card">
                            <h3>{t.detail.yourAgent}</h3>
                            <div className="agent-info">
                                <div className="agent-avatar">{agentInitials}</div>
                                <div>
                                    <div className="agent-name">{property.agent_prenom} {property.agent_nom}</div>
                                    <div className="agent-role">Agent Immobilier · LuxImmo</div>
                                </div>
                            </div>
                            <a
                                href={telegramDeepLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-telegram"
                                style={{ width: '100%', justifyContent: 'center', fontSize: '0.88rem', padding: '10px 16px' }}
                            >
                                <TelegramIcon size={16} />
                                {t.detail.agentContact}
                            </a>
                        </div>
                    )}

                    {/* Property summary card */}
                    <div className="sidebar-card">
                        <h3>{t.detail.summary}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                            {[
                                { icon: '💰', label: t.detail.price, val: formatPrice(property.prix, property.type, lang) },
                                { icon: '📐', label: t.detail.surface, val: property.surface ? `${property.surface} m²` : '—' },
                                { icon: '📍', label: t.detail.city, val: property.ville || '—' },
                                { icon: '🏷️', label: t.detail.type, val: property.type === 'vente' ? t.detail.forSale : t.detail.forRent },
                            ].map((row) => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{row.icon} {row.label}</span>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{row.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Gallery Modal */}
            {modalOpen && (
                <div className="gallery-modal" onClick={() => setModalOpen(false)}>
                    <div className="gallery-modal-inner" onClick={(e) => e.stopPropagation()}>
                        <button className="gallery-modal-close" onClick={() => setModalOpen(false)}>✕</button>
                        <img
                            className="gallery-modal-img"
                            src={allImages[modalIdx]}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImg; }}
                        />
                        {allImages.length > 1 && (
                            <>
                                <button className="gallery-modal-nav prev" onClick={handlePrev}>{isAr ? '›' : '‹'}</button>
                                <button className="gallery-modal-nav next" onClick={handleNext}>{isAr ? '‹' : '›'}</button>
                            </>
                        )}
                        <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {modalIdx + 1} / {allImages.length}
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
}

function LoadingDetail() {
    const { t } = useLang();
    return (
        <>
            <Navbar />
            <div style={{ paddingTop: 72, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'bounce 1s infinite' }}>🏠</div>
                    <p>{t.common.loading}</p>
                </div>
            </div>
        </>
    );
}

function ErrorDetail({ error }: { error: string }) {
    const { t } = useLang();
    return (
        <>
            <Navbar />
            <div style={{ paddingTop: 72, minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="empty-state">
                    <div className="icon">😕</div>
                    <h3>{t.common.error}</h3>
                    <p>{error || t.catalog.noResultsHint}</p>
                    <Link href="/properties" className="btn btn-gold" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
                        {t.common.back}
                    </Link>
                </div>
            </div>
        </>
    );
}

