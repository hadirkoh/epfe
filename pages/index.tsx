import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PropertyCard from '@/components/PropertyCard';
import TelegramIcon from '@/components/TelegramIcon';
import { useLang } from '@/contexts/LangContext';

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
  image_principale: string | null;
}

const FALLBACK_IMAGES: Record<string, string> = {
  vente: '/prop_villa.png',
  location: '/prop_apartment.png',
  default: '/prop_studio.png',
};

function getFallback(type: string) {
  return FALLBACK_IMAGES[type] || FALLBACK_IMAGES.default;
}

export default function Home() {
  const { t, lang } = useLang();
  const [vente, setVente] = useState<Property[]>([]);
  const [location, setLocation] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [venteRes, locationRes] = await Promise.all([
          fetch('/api/properties?type=vente'),
          fetch('/api/properties?type=location'),
        ]);
        const venteData = await venteRes.json();
        const locationData = await locationRes.json();
        setVente(Array.isArray(venteData) ? venteData.slice(0, 3) : []);
        setLocation(Array.isArray(locationData) ? locationData.slice(0, 3) : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const telegramBot = process.env.NEXT_PUBLIC_TELEGRAM_BOT || 'ImmobilierBot';
  const isAr = lang === 'ar';

  return (
    <>
      <Head>
        <title>LuxImmo – {t.common.premiumPlatform}</title>
      </Head>

      <Navbar />

      {/* ── Hero ───────────────────────────────────── */}
      <section className="hero">
        <div
          className="hero-bg"
          style={{ backgroundImage: 'url(/hero_bg.png)' }}
        />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-badge">
            ✦ {t.hero.badge}
          </div>
          <h1>
            {t.hero.title1} <span className="highlight">{t.hero.title2}</span>,<br />
            {t.hero.title3}
          </h1>
          <p className="hero-subtitle">
            {t.hero.subtitle}
          </p>
          <div className="hero-buttons">
            <Link href="/properties" className="btn btn-gold">
              🏠 {t.hero.explore}
            </Link>
            <a
              href={`https://t.me/${telegramBot}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-telegram pulse"
            >
              <TelegramIcon />
              {t.hero.contact}
            </a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="number">50+</div>
              <div className="label">{t.hero.statBiens}</div>
            </div>
            <div className="hero-stat">
              <div className="number">24h</div>
              <div className="label">{t.hero.statReponse}</div>
            </div>
            <div className="hero-stat">
              <div className="number">100%</div>
              <div className="label">{t.hero.statVerifies}</div>
            </div>
          </div>
        </div>
        <div className="hero-scroll">
          <span>{t.hero.discover}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Features Strip ─────────────────────────── */}
      <section style={{ padding: '5rem 2rem', background: 'var(--dark-2)', borderBottom: '1px solid var(--glass-border)' }}>
        <div className="section-header">
          <div className="section-badge">{t.features.badge}</div>
          <h2 className="section-title">{t.features.title}</h2>
          <p className="section-subtitle">{t.features.subtitle}</p>
        </div>
        <div className="features-grid" style={{ maxWidth: 1200, margin: '0 auto' }}>
          {[
            { icon: '🤖', title: t.features.f1_title, desc: t.features.f1_desc },
            { icon: '🏡', title: t.features.f2_title, desc: t.features.f2_desc },
            { icon: '📍', title: t.features.f3_title, desc: t.features.f3_desc },
            { icon: '⚡', title: t.features.f4_title, desc: t.features.f4_desc },
          ].map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Vente Section ──────────────────────────── */}
      <section className="section">
        <div className="section-header">
          <div className="section-badge">{t.nav.forSale}</div>
          <h2 className="section-title">{t.catalog.vente}</h2>
          <p className="section-subtitle">{t.common.emptyWait}</p>
        </div>
        {loading ? (
          <SkeletonGrid />
        ) : vente.length === 0 ? (
          <EmptyState type="vente" />
        ) : (
          <div className="properties-grid">
            {vente.map((p) => (
              <PropertyCard key={p.id} property={p} fallback={getFallback(p.type)} />
            ))}
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link href="/properties?type=vente" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {t.common.seeAllVente}
          </Link>
        </div>
      </section>

      {/* ── Location Section ───────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-header">
          <div className="section-badge">{t.nav.forRent}</div>
          <h2 className="section-title">{t.catalog.location}</h2>
          <p className="section-subtitle">{t.common.emptyWait}</p>
        </div>
        {loading ? (
          <SkeletonGrid />
        ) : location.length === 0 ? (
          <EmptyState type="location" />
        ) : (
          <div className="properties-grid">
            {location.map((p) => (
              <PropertyCard key={p.id} property={p} fallback={getFallback(p.type)} />
            ))}
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link href="/properties?type=location" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {t.common.seeAllLocation}
          </Link>
        </div>
      </section>

      {/* ── Telegram CTA Banner ─────────────────────── */}
      <section className="telegram-cta-banner">
        <div className="cta-shapes">
          <div className="shape shape-1" />
          <div className="shape shape-2" />
        </div>
        <div className="cta-content">
          <div className="cta-icon-large">📲</div>
          <h2 className="cta-title">
            {t.common.ctaTitle}
          </h2>
          <p className="cta-desc">
            {t.common.ctaDesc}
          </p>
          <a
            href={`https://t.me/${telegramBot}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-telegram"
          >
            <TelegramIcon />
            {t.common.ctaBtn}
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}

function SkeletonGrid() {
  return (
    <div className="loading-grid">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton">
          <div className="skeleton-img" />
          <div className="skeleton-body">
            <div className="skeleton-line medium" />
            <div className="skeleton-line short" />
            <div className="skeleton-line medium" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ type }: { type: 'vente' | 'location' }) {
  const { t } = useLang();
  return (
    <div className="empty-state">
      <div className="icon">🏚️</div>
      <h3>{type === 'vente' ? t.common.emptyVente : t.common.emptyLocation}</h3>
      <p>{t.common.emptyWait}</p>
    </div>
  );
}


