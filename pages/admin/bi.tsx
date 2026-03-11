import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LangContext';

interface KPI {
    total_biens: number;
    disponibles: number;
    vendus: number;
    loues: number;
    reserves: number;
    a_vendre: number;
    a_louer: number;
    prix_moyen_vente: number;
    prix_moyen_location: number;
    valeur_vendus: number;
    surface_moyenne: number;
}

interface CityData {
    ville: string;
    count: number;
}

interface MonthlyData {
    month: string;
    count: number;
    vente: number;
    location: number;
}

interface AgentData {
    agent_name: string;
    email: string;
    total: number;
    disponibles: number;
    vendus: number;
    valeur_portefeuille: number;
}

interface DistData {
    bracket: string;
    count: number;
}

interface RequestStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

interface AnalyticsData {
    kpi: KPI;
    byCity: CityData[];
    monthly: MonthlyData[];
    agents: AgentData[];
    priceDist: DistData[];
    requests: RequestStats;
    surfaceDist: DistData[];
}

const COLORS = ['#C9A84C', '#4A6CF7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const GOLD = '#C9A84C';
const BLUE = '#4A6CF7';
const GREEN = '#10B981';
const RED = '#EF4444';

function formatNum(n: number) {
    return new Intl.NumberFormat('fr-TN', { maximumFractionDigits: 0 }).format(n);
}

function formatDT(n: number) {
    return `${new Intl.NumberFormat('fr-TN', { maximumFractionDigits: 0 }).format(n)} DT`;
}

// Mini horizontal bar chart component
function BarChart({ data, labelKey, valueKey, color }: { data: Record<string, unknown>[], labelKey: string, valueKey: string, color?: string }) {
    if (!data || data.length === 0) return <div style={{ color: 'var(--text-muted)', padding: '1rem' }}>Aucune donnée</div>;
    const max = Math.max(...data.map(d => Number(d[valueKey]) || 0));
    return (
        <div className="bi-bar-chart">
            {data.map((d, i) => {
                const val = Number(d[valueKey]) || 0;
                const pct = max > 0 ? (val / max) * 100 : 0;
                return (
                    <div key={i} className="bi-bar-row">
                        <div className="bi-bar-label">{String(d[labelKey] || '—')}</div>
                        <div className="bi-bar-track">
                            <div
                                className="bi-bar-fill"
                                style={{
                                    width: `${pct}%`,
                                    background: color || COLORS[i % COLORS.length],
                                    animationDelay: `${i * 0.08}s`
                                }}
                            />
                        </div>
                        <div className="bi-bar-value">{val}</div>
                    </div>
                );
            })}
        </div>
    );
}

// Donut chart using SVG
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
    const total = segments.reduce((s, d) => s + d.value, 0);
    if (total === 0) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Aucune donnée</div>;
    let cumulative = 0;
    const radius = 60;
    const cx = 80;
    const cy = 80;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className="bi-donut-wrap">
            <svg width="160" height="160" viewBox="0 0 160 160">
                {segments.map((seg, i) => {
                    const pct = seg.value / total;
                    const offset = circumference * (1 - pct);
                    const rotation = cumulative * 360 - 90;
                    cumulative += pct;
                    return (
                        <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={radius}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="28"
                            strokeDasharray={`${circumference * pct} ${circumference * (1 - pct)}`}
                            strokeDashoffset={offset}
                            transform={`rotate(${rotation}, ${cx}, ${cy})`}
                            style={{ transition: 'all 0.6s ease' }}
                        />
                    );
                })}
                <circle cx={cx} cy={cy} r={46} fill="var(--bg-primary)" />
                <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text-primary)" fontSize="20" fontWeight="bold">{total}</text>
                <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-muted)" fontSize="10">total</text>
            </svg>
            <div className="bi-donut-legend">
                {segments.map((seg, i) => (
                    <div key={i} className="bi-legend-item">
                        <span className="bi-legend-dot" style={{ background: seg.color }} />
                        <span className="bi-legend-label">{seg.label}</span>
                        <span className="bi-legend-val">{seg.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Line chart component (SVG)
function LineChart({ data }: { data: MonthlyData[] }) {
    if (!data || data.length === 0) return <div style={{ color: 'var(--text-muted)', padding: '1rem' }}>Aucune donnée</div>;
    const w = 460, h = 160, pad = 40;
    const maxVal = Math.max(...data.map(d => Number(d.count) || 0), 1);

    const xStep = (w - pad * 2) / Math.max(data.length - 1, 1);
    const yScale = (val: number) => h - pad - ((val / maxVal) * (h - pad * 2));
    const xScale = (i: number) => pad + i * xStep;

    const pointsTotal = data.map((d, i) => `${xScale(i)},${yScale(Number(d.count))}`).join(' ');
    const pointsVente = data.map((d, i) => `${xScale(i)},${yScale(Number(d.vente))}`).join(' ');
    const pointsLoc = data.map((d, i) => `${xScale(i)},${yScale(Number(d.location))}`).join(' ');

    return (
        <div className="bi-linechart-wrap">
            <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="160" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                    <line key={i} x1={pad} y1={yScale(maxVal * t)} x2={w - pad} y2={yScale(maxVal * t)}
                        stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                ))}
                {/* Lines */}
                <polyline points={pointsTotal} fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinejoin="round" />
                <polyline points={pointsVente} fill="none" stroke={GREEN} strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="4 3" />
                <polyline points={pointsLoc} fill="none" stroke={BLUE} strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="4 3" />
                {/* Dots */}
                {data.map((d, i) => (
                    <circle key={i} cx={xScale(i)} cy={yScale(Number(d.count))} r="4" fill={GOLD} />
                ))}
                {/* X Labels */}
                {data.map((d, i) => (
                    <text key={i} x={xScale(i)} y={h - 8} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
                        {d.month?.slice(5) || ''}
                    </text>
                ))}
            </svg>
            <div className="bi-line-legend">
                <span><span className="bi-dot" style={{ background: GOLD }} />Total</span>
                <span><span className="bi-dot" style={{ background: GREEN }} />Vente</span>
                <span><span className="bi-dot" style={{ background: BLUE }} />Location</span>
            </div>
        </div>
    );
}

export default function BiDashboard() {
    const { user, isAdmin } = useAuth();
    const { lang } = useLang();
    const router = useRouter();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) { router.push('/'); return; }
        if (!isAdmin) { router.push('/'); }
    }, [user, isAdmin, router]);

    const fetchAnalytics = useCallback(async () => {
        if (!user?.token) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/analytics', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (!res.ok) throw new Error('API error');
            const json = await res.json();
            setData(json);
        } catch {
            setError('Erreur lors du chargement des données analytiques.');
        } finally {
            setLoading(false);
        }
    }, [user?.token]);

    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

    if (!isAdmin) return null;

    const kpi = data?.kpi;

    return (
        <>
            <Head>
                <title>Dashboard BI – LuxImmo Admin</title>
                <meta name="description" content="Tableau de bord analytique pour l'administration de LuxImmo" />
            </Head>
            <Navbar />

            <div className="bi-container">
                {/* === HEADER === */}
                <div className="bi-header">
                    <div>
                        <div className="bi-badge">📊 Business Intelligence</div>
                        <h1 className="bi-title">Tableau de Bord Analytique</h1>
                        <p className="bi-subtitle">Vue d'ensemble de l'activité immobilière en temps réel</p>
                    </div>
                    <div className="bi-header-actions">
                        <Link href="/admin" className="bi-back-btn">
                            ← Retour au Dashboard
                        </Link>
                        <button className="bi-refresh-btn" onClick={fetchAnalytics} title="Actualiser">
                            🔄
                        </button>
                    </div>
                </div>

                {loading && (
                    <div className="bi-loading">
                        <div className="bi-spinner" />
                        <p>Chargement des données analytiques…</p>
                    </div>
                )}

                {error && (
                    <div className="bi-error">⚠️ {error}</div>
                )}

                {!loading && data && (
                    <>
                        {/* === KPI CARDS === */}
                        <section className="bi-section">
                            <h2 className="bi-section-title">📌 Indicateurs Clés (KPIs)</h2>
                            <div className="bi-kpi-grid">

                                <div className="bi-kpi-card bi-kpi-gold">
                                    <div className="bi-kpi-icon">🏠</div>
                                    <div className="bi-kpi-value">{formatNum(Number(kpi?.total_biens ?? 0))}</div>
                                    <div className="bi-kpi-label">Total Propriétés</div>
                                    <div className="bi-kpi-sub">{formatNum(Number(kpi?.a_vendre ?? 0))} vente · {formatNum(Number(kpi?.a_louer ?? 0))} location</div>
                                </div>

                                <div className="bi-kpi-card bi-kpi-green">
                                    <div className="bi-kpi-icon">✅</div>
                                    <div className="bi-kpi-value">{formatNum(Number(kpi?.disponibles ?? 0))}</div>
                                    <div className="bi-kpi-label">Disponibles</div>
                                    <div className="bi-kpi-sub">
                                        {kpi && kpi.total_biens > 0 ? Math.round((Number(kpi.disponibles) / Number(kpi.total_biens)) * 100) : 0}% du portefeuille
                                    </div>
                                </div>

                                <div className="bi-kpi-card bi-kpi-blue">
                                    <div className="bi-kpi-icon">💰</div>
                                    <div className="bi-kpi-value">{formatDT(Math.round(Number(kpi?.prix_moyen_vente ?? 0)))}</div>
                                    <div className="bi-kpi-label">Prix Moyen (Vente)</div>
                                    <div className="bi-kpi-sub">Location: {formatDT(Math.round(Number(kpi?.prix_moyen_location ?? 0)))}/mois</div>
                                </div>

                                <div className="bi-kpi-card bi-kpi-purple">
                                    <div className="bi-kpi-icon">🏆</div>
                                    <div className="bi-kpi-value">{formatDT(Math.round(Number(kpi?.valeur_vendus ?? 0)))}</div>
                                    <div className="bi-kpi-label">Valeur Biens Vendus</div>
                                    <div className="bi-kpi-sub">{formatNum(Number(kpi?.vendus ?? 0))} transactions</div>
                                </div>

                                <div className="bi-kpi-card bi-kpi-orange">
                                    <div className="bi-kpi-icon">📐</div>
                                    <div className="bi-kpi-value">{formatNum(Math.round(Number(kpi?.surface_moyenne ?? 0)))} m²</div>
                                    <div className="bi-kpi-label">Surface Moyenne</div>
                                    <div className="bi-kpi-sub">Par propriété</div>
                                </div>

                                <div className="bi-kpi-card bi-kpi-red">
                                    <div className="bi-kpi-icon">🔔</div>
                                    <div className="bi-kpi-value">{formatNum(Number(data.requests?.pending ?? 0))}</div>
                                    <div className="bi-kpi-label">Demandes en Attente</div>
                                    <div className="bi-kpi-sub">{formatNum(Number(data.requests?.total ?? 0))} demandes totales</div>
                                </div>
                            </div>
                        </section>

                        {/* === CHARTS ROW 1 === */}
                        <section className="bi-section">
                            <div className="bi-charts-row">
                                {/* Statut Distribution Donut */}
                                <div className="bi-chart-card">
                                    <div className="bi-chart-header">
                                        <h3>🔵 Répartition par Statut</h3>
                                    </div>
                                    <DonutChart segments={[
                                        { label: 'Disponible', value: Number(kpi?.disponibles ?? 0), color: GREEN },
                                        { label: 'Vendu', value: Number(kpi?.vendus ?? 0), color: GOLD },
                                        { label: 'Loué', value: Number(kpi?.loues ?? 0), color: BLUE },
                                        { label: 'Réservé', value: Number(kpi?.reserves ?? 0), color: '#F59E0B' },
                                    ].filter(s => s.value > 0)} />
                                </div>

                                {/* Type Distribution Donut */}
                                <div className="bi-chart-card">
                                    <div className="bi-chart-header">
                                        <h3>🏷️ Vente vs Location</h3>
                                    </div>
                                    <DonutChart segments={[
                                        { label: 'À vendre', value: Number(kpi?.a_vendre ?? 0), color: GOLD },
                                        { label: 'À louer', value: Number(kpi?.a_louer ?? 0), color: BLUE },
                                    ].filter(s => s.value > 0)} />
                                </div>

                                {/* Request Stats Donut */}
                                <div className="bi-chart-card">
                                    <div className="bi-chart-header">
                                        <h3>📋 Demandes d'Accès</h3>
                                    </div>
                                    <DonutChart segments={[
                                        { label: 'En attente', value: Number(data.requests?.pending ?? 0), color: '#F59E0B' },
                                        { label: 'Approuvées', value: Number(data.requests?.approved ?? 0), color: GREEN },
                                        { label: 'Rejetées', value: Number(data.requests?.rejected ?? 0), color: RED },
                                    ].filter(s => s.value > 0)} />
                                </div>
                            </div>
                        </section>

                        {/* === MONTHLY TREND === */}
                        <section className="bi-section">
                            <div className="bi-chart-card bi-chart-wide">
                                <div className="bi-chart-header">
                                    <h3>📈 Évolution Mensuelle des Ajouts</h3>
                                    <span className="bi-chart-subtitle">6 derniers mois</span>
                                </div>
                                <LineChart data={data.monthly} />
                            </div>
                        </section>

                        {/* === CHARTS ROW 2 === */}
                        <section className="bi-section">
                            <div className="bi-charts-row bi-charts-row-2">
                                {/* By City */}
                                <div className="bi-chart-card">
                                    <div className="bi-chart-header">
                                        <h3>🗺️ Propriétés par Ville</h3>
                                    </div>
                                    <BarChart
                                        data={data.byCity as unknown as Record<string, unknown>[]}
                                        labelKey="ville"
                                        valueKey="count"
                                    />
                                </div>

                                {/* Price Distribution */}
                                <div className="bi-chart-card">
                                    <div className="bi-chart-header">
                                        <h3>💲 Distribution des Prix (Vente)</h3>
                                    </div>
                                    <BarChart
                                        data={data.priceDist as unknown as Record<string, unknown>[]}
                                        labelKey="bracket"
                                        valueKey="count"
                                        color={GOLD}
                                    />
                                </div>

                                {/* Surface Distribution */}
                                <div className="bi-chart-card">
                                    <div className="bi-chart-header">
                                        <h3>📐 Distribution des Surfaces</h3>
                                    </div>
                                    <BarChart
                                        data={data.surfaceDist as unknown as Record<string, unknown>[]}
                                        labelKey="bracket"
                                        valueKey="count"
                                        color={BLUE}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* === AGENTS PERFORMANCE TABLE === */}
                        <section className="bi-section">
                            <div className="bi-chart-card bi-chart-wide">
                                <div className="bi-chart-header">
                                    <h3>👥 Performance des Agents</h3>
                                </div>
                                <div className="bi-agent-table-wrap">
                                    <table className="bi-agent-table">
                                        <thead>
                                            <tr>
                                                <th>Agent</th>
                                                <th>Email</th>
                                                <th>Portefeuille</th>
                                                <th>Disponibles</th>
                                                <th>Vendus</th>
                                                <th>Valeur Vendus</th>
                                                <th>Taux Succès</th>
                                                <th>Performance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.agents.length === 0 ? (
                                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucun agent</td></tr>
                                            ) : data.agents.map((agent, i) => {
                                                const total = Number(agent.total);
                                                const vendus = Number(agent.vendus);
                                                const successRate = total > 0 ? Math.round((vendus / total) * 100) : 0;
                                                const maxTotal = Math.max(...data.agents.map(a => Number(a.total)));
                                                const perfPct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                                                return (
                                                    <tr key={i}>
                                                        <td>
                                                            <div className="bi-agent-avatar">
                                                                <span className="bi-avatar-circle" style={{ background: COLORS[i % COLORS.length] }}>
                                                                    {agent.agent_name.charAt(0)}
                                                                </span>
                                                                <strong>{agent.agent_name}</strong>
                                                            </div>
                                                        </td>
                                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{agent.email}</td>
                                                        <td><span className="bi-chip bi-chip-gold">{total}</span></td>
                                                        <td><span className="bi-chip bi-chip-green">{agent.disponibles}</span></td>
                                                        <td><span className="bi-chip bi-chip-blue">{vendus}</span></td>
                                                        <td style={{ fontWeight: 600, color: GOLD }}>{formatDT(Math.round(Number(agent.valeur_portefeuille)))}</td>
                                                        <td>
                                                            <div className="bi-rate">
                                                                <span style={{ fontWeight: 700, color: successRate > 50 ? GREEN : RED }}>{successRate}%</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="bi-perf-bar-track">
                                                                <div className="bi-perf-bar-fill" style={{
                                                                    width: `${perfPct}%`,
                                                                    background: COLORS[i % COLORS.length]
                                                                }} />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        {/* === FOOTER INFO === */}
                        <div className="bi-footer-note">
                            Données extraites en temps réel · Actualisé le {new Date().toLocaleString('fr-TN')}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
