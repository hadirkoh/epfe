import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PropertyCard from '@/components/PropertyCard';
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

const FALLBACKS: Record<string, string> = {
    vente: '/prop_villa.png',
    location: '/prop_apartment.png',
    default: '/prop_studio.png',
};

function getFallback(type: string) {
    return FALLBACKS[type] || FALLBACKS.default;
}

export default function PropertiesPage() {
    const { t } = useLang();
    const router = useRouter();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter state
    const [search, setSearch] = useState('');
    const [type, setType] = useState('all');
    const [ville, setVille] = useState('');
    const [prixMin, setPrixMin] = useState('');
    const [prixMax, setPrixMax] = useState('');
    const [surfaceMin, setSurfaceMin] = useState('');
    const [surfaceMax, setSurfaceMax] = useState('');

    // Sync filter type from URL query
    useEffect(() => {
        if (router.isReady) {
            const { type: qType } = router.query;
            if (qType && typeof qType === 'string') setType(qType);
        }
    }, [router.isReady, router.query]);

    const fetchProperties = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (type && type !== 'all') params.set('type', type);
            if (ville) params.set('ville', ville);
            if (prixMin) params.set('prix_min', prixMin);
            if (prixMax) params.set('prix_max', prixMax);
            if (surfaceMin) params.set('surface_min', surfaceMin);
            if (surfaceMax) params.set('surface_max', surfaceMax);
            if (search) params.set('search', search);

            const res = await fetch(`/api/properties?${params.toString()}`);
            if (!res.ok) throw new Error(t.common.error);
            const data = await res.json();
            setProperties(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setError(t.catalog.noResults);
        } finally {
            setLoading(false);
        }
    }, [type, ville, prixMin, prixMax, surfaceMin, surfaceMax, search, t]);

    // Debounce fetch
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProperties();
        }, 400);
        return () => clearTimeout(timer);
    }, [fetchProperties]);

    const handleReset = () => {
        setSearch('');
        setType('all');
        setVille('');
        setPrixMin('');
        setPrixMax('');
        setSurfaceMin('');
        setSurfaceMax('');
    };

    return (
        <>
            <Head>
                <title>{t.catalog.title} – LuxImmo</title>
                <meta name="description" content={t.footer.desc} />
            </Head>

            <Navbar />

            {/* Page Header */}
            <div className="page-header">
                <div className="section-badge">{t.catalog.ourCatalog}</div>
                <h1 className="page-header-title">{t.catalog.title}</h1>
                <p className="page-header-sub">
                    {loading ? t.common.loading : `${properties.length} ${t.catalog.results}`}
                </p>
            </div>

            <div className="section" style={{ paddingTop: '2.5rem' }}>
                {/* Filter Bar */}
                <div className="filter-wrapper">
                    <div className="filter-search-bar">
                        <input
                            id="search-input"
                            type="text"
                            placeholder={t.catalog.search}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button className="btn btn-gold" onClick={fetchProperties} style={{ whiteSpace: 'nowrap' }}>
                            {t.catalog.search_btn}
                        </button>
                        <button className="btn btn-outline" onClick={handleReset} style={{ whiteSpace: 'nowrap' }}>
                            {t.catalog.reset}
                        </button>
                    </div>

                    <div className="filter-row">
                        <div className="filter-group">
                            <label htmlFor="filter-type">{t.detail.type}</label>
                            <select id="filter-type" value={type} onChange={(e) => setType(e.target.value)}>
                                <option value="all">{t.catalog.allTypes}</option>
                                <option value="vente">{t.catalog.vente}</option>
                                <option value="location">{t.catalog.location}</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="filter-ville">{t.catalog.city}</label>
                            <input
                                id="filter-ville"
                                type="text"
                                placeholder="Tunis..."
                                value={ville}
                                onChange={(e) => setVille(e.target.value)}
                            />
                        </div>

                        <div className="filter-group">
                            <label htmlFor="filter-prix-min">{t.catalog.priceMin}</label>
                            <input
                                id="filter-prix-min"
                                type="number"
                                placeholder="0"
                                value={prixMin}
                                onChange={(e) => setPrixMin(e.target.value)}
                                min={0}
                            />
                        </div>

                        <div className="filter-group">
                            <label htmlFor="filter-prix-max">{t.catalog.priceMax}</label>
                            <input
                                id="filter-prix-max"
                                type="number"
                                placeholder="∞"
                                value={prixMax}
                                onChange={(e) => setPrixMax(e.target.value)}
                                min={0}
                            />
                        </div>

                        <div className="filter-group">
                            <label htmlFor="filter-surface-min">{t.catalog.surfaceMin}</label>
                            <input
                                id="filter-surface-min"
                                type="number"
                                placeholder="0"
                                value={surfaceMin}
                                onChange={(e) => setSurfaceMin(e.target.value)}
                                min={0}
                            />
                        </div>

                        <div className="filter-group">
                            <label htmlFor="filter-surface-max">{t.catalog.surfaceMax}</label>
                            <input
                                id="filter-surface-max"
                                type="number"
                                placeholder="∞"
                                value={surfaceMax}
                                onChange={(e) => setSurfaceMax(e.target.value)}
                                min={0}
                            />
                        </div>
                    </div>
                </div>

                {/* Active filters pills */}
                {(type !== 'all' || ville || prixMin || prixMax || surfaceMin || surfaceMax || search) && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        {type !== 'all' && <FilterPill label={type === 'vente' ? t.catalog.vente : t.catalog.location} onRemove={() => setType('all')} />}
                        {ville && <FilterPill label={`${t.catalog.city}: ${ville}`} onRemove={() => setVille('')} />}
                        {prixMin && <FilterPill label={`Prix ≥ ${prixMin}`} onRemove={() => setPrixMin('')} />}
                        {prixMax && <FilterPill label={`Prix ≤ ${prixMax}`} onRemove={() => setPrixMax('')} />}
                        {surfaceMin && <FilterPill label={`Surface ≥ ${surfaceMin}`} onRemove={() => setSurfaceMin('')} />}
                        {surfaceMax && <FilterPill label={`Surface ≤ ${surfaceMax}`} onRemove={() => setSurfaceMax('')} />}
                        {search && <FilterPill label={`"${search}"`} onRemove={() => setSearch('')} />}
                    </div>
                )}

                {/* Results */}
                {error && (
                    <div style={{
                        padding: '1.5rem',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 12,
                        color: '#f87171',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {loading ? (
                    <SkeletonGrid />
                ) : properties.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">🔍</div>
                        <h3>{t.catalog.noResults}</h3>
                        <p>{t.catalog.noResultsHint}</p>
                        <button className="btn btn-outline" onClick={handleReset} style={{ marginTop: '1.5rem' }}>
                            {t.catalog.reset}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="results-meta">
                            <p className="results-count">
                                <strong>{properties.length}</strong> {t.catalog.results}
                            </p>
                        </div>
                        <div className="properties-grid">
                            {properties.map((p) => (
                                <PropertyCard key={p.id} property={p} fallback={getFallback(p.type)} />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <Footer />
        </>
    );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 50,
            fontSize: '0.78rem',
            color: 'var(--gold)',
            fontWeight: 500,
        }}>
            {label}
            <button
                onClick={onRemove}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', lineHeight: 1, padding: 0, fontSize: '0.9rem' }}
            >
                ×
            </button>
        </span>
    );
}

function SkeletonGrid() {
    return (
        <div className="loading-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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

