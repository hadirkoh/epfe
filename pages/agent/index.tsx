import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PropertyCard from '@/components/PropertyCard';
import { useAuth } from '@/contexts/AuthContext';
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

export default function AgentPage() {
    const { user, isAgent } = useAuth();
    const { t, lang } = useLang();
    const router = useRouter();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { router.push('/'); return; }
        if (!isAgent) { router.push('/'); return; }
    }, [user, isAgent, router]);

    useEffect(() => {
        if (!user?.token) return;
        fetch('/api/agent/my-properties', {
            headers: { Authorization: `Bearer ${user.token}` },
        })
            .then((r) => r.json())
            .then((data) => setProperties(Array.isArray(data) ? data : []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user?.token]);

    if (!isAgent) return null;

    const isAr = lang === 'ar';

    return (
        <>
            <Head>
                <title>{t.agent.title} – LuxImmo</title>
            </Head>
            <Navbar />

            <div className="page-header">
                <div className="section-badge">🏠 {isAr ? 'وكيل' : 'Agent'}</div>
                <h1 className="page-header-title">{t.agent.title}</h1>
                <p className="page-header-sub">
                    {t.agent.subtitle} — {user?.prenom} {user?.nom}
                </p>
            </div>

            <div className="section" style={{ paddingTop: '2.5rem' }}>
                {loading ? (
                    <div className="loading-grid">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="skeleton">
                                <div className="skeleton-img" />
                                <div className="skeleton-body">
                                    <div className="skeleton-line medium" />
                                    <div className="skeleton-line short" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : properties.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">🏚️</div>
                        <h3>{t.agent.noProperties}</h3>
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
                                <PropertyCard
                                    key={p.id}
                                    property={p}
                                    fallback={FALLBACKS[p.type] || FALLBACKS.default}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <Footer />
        </>
    );
}

