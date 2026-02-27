import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LangContext';

interface Property {
    id: number;
    titre: string;
    type: 'vente' | 'location';
    prix: number;
    surface: number;
    adresse: string;
    ville: string;
    statut: string;
    agent_id: number | null;
    agent_nom: string | null;
    agent_prenom: string | null;
    image_principale: string | null;
}

interface Agent {
    id: number;
    nom: string;
    prenom: string;
    email: string;
}

interface FormState {
    titre: string;
    description: string;
    type: 'vente' | 'location';
    prix: string;
    surface: string;
    adresse: string;
    ville: string;
    statut: string;
    agent_id: string;
    images: string; // newline-separated URLs
}

const emptyForm: FormState = {
    titre: '', description: '', type: 'vente', prix: '', surface: '',
    adresse: '', ville: '', statut: 'disponible', agent_id: '', images: '',
};

function formatPrice(p: number, type: string, lang: string) {
    const locale = lang === 'ar' ? 'ar-TN' : lang === 'fr' ? 'fr-TN' : 'en-US';
    const formatted = new Intl.NumberFormat(locale, { style: 'decimal', minimumFractionDigits: 0 }).format(p);
    const suffix = type === 'location' ? (lang === 'ar' ? ' د.ت/شهر' : lang === 'fr' ? ' DT/mois' : ' DT/month') : ' DT';
    return `${formatted}${suffix}`;
}

export default function AdminPage() {
    const { user, isAdmin } = useAuth();
    const { t, lang } = useLang();
    const router = useRouter();

    const [properties, setProperties] = useState<Property[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal states
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    // Delete confirm
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Toast
    const [toast, setToast] = useState('');

    // Redirect if not admin
    useEffect(() => {
        if (!user) { router.push('/'); return; }
        if (!isAdmin) { router.push('/'); }
    }, [user, isAdmin, router]);

    function authHeader() {
        return { Authorization: `Bearer ${user?.token}` };
    }

    const fetchData = useCallback(async () => {
        if (!user?.token) return;
        setLoading(true);
        try {
            const [propRes, agentRes] = await Promise.all([
                fetch('/api/admin/properties', { headers: authHeader() }),
                fetch('/api/admin/agents', { headers: authHeader() }),
            ]);
            const propData = await propRes.json();
            const agentData = await agentRes.json();
            setProperties(Array.isArray(propData) ? propData : []);
            setAgents(Array.isArray(agentData) ? agentData : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user?.token]);

    useEffect(() => { fetchData(); }, [fetchData]);

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    }

    // ── Open form for create or edit ──
    async function openCreate() {
        setEditId(null);
        setForm(emptyForm);
        setFormError('');
        setShowForm(true);
    }

    async function openEdit(prop: Property) {
        setEditId(prop.id);
        setFormError('');
        // Fetch images for this property
        try {
            const res = await fetch(`/api/properties/${prop.id}`);
            const data = await res.json();
            const imageUrls = (data.images || []).map((img: { image_url: string }) => img.image_url).join('\n');
            setForm({
                titre: prop.titre || '',
                description: data.description || '',
                type: prop.type,
                prix: String(prop.prix || ''),
                surface: String(prop.surface || ''),
                adresse: prop.adresse || '',
                ville: prop.ville || '',
                statut: prop.statut || 'disponible',
                agent_id: String(prop.agent_id || ''),
                images: imageUrls,
            });
        } catch {
            setForm({
                titre: prop.titre || '', description: '', type: prop.type,
                prix: String(prop.prix), surface: String(prop.surface || ''),
                adresse: prop.adresse || '', ville: prop.ville || '',
                statut: prop.statut || 'disponible', agent_id: String(prop.agent_id || ''), images: '',
            });
        }
        setShowForm(true);
    }

    // ── Submit form ──
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.titre || !form.type || !form.prix) {
            setFormError(lang === 'ar' ? 'العنوان والنوع والسعر مطلوبة.' : lang === 'fr' ? 'Titre, type et prix sont obligatoires.' : 'Title, type and price are required.');
            return;
        }
        setFormLoading(true);
        setFormError('');

        const images = form.images
            .split('\n')
            .map((u) => u.trim())
            .filter(Boolean);

        const body = {
            titre: form.titre,
            description: form.description,
            type: form.type,
            prix: parseFloat(form.prix),
            surface: form.surface ? parseFloat(form.surface) : null,
            adresse: form.adresse,
            ville: form.ville,
            statut: form.statut,
            agent_id: form.agent_id ? parseInt(form.agent_id) : null,
            images,
        };

        try {
            let res;
            if (editId) {
                res = await fetch(`/api/admin/properties/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...authHeader() },
                    body: JSON.stringify(body),
                });
            } else {
                res = await fetch('/api/admin/properties', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeader() },
                    body: JSON.stringify(body),
                });
            }

            if (!res.ok) {
                const d = await res.json();
                setFormError(d.error || t.common.error);
            } else {
                setShowForm(false);
                showToast(editId ? t.admin.successEdit : t.admin.successAdd);
                await fetchData();
            }
        } catch {
            setFormError(t.common.error);
        } finally {
            setFormLoading(false);
        }
    }

    // ── Delete ──
    async function handleDelete() {
        if (!deleteId) return;
        setDeleteLoading(true);
        try {
            await fetch(`/api/admin/properties/${deleteId}`, {
                method: 'DELETE',
                headers: authHeader(),
            });
            setDeleteId(null);
            showToast(t.admin.successDelete);
            await fetchData();
        } catch {
            console.error('Delete failed');
        } finally {
            setDeleteLoading(false);
        }
    }

    // Filtered properties
    const filtered = properties.filter((p) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            p.titre?.toLowerCase().includes(q) ||
            p.ville?.toLowerCase().includes(q) ||
            p.adresse?.toLowerCase().includes(q)
        );
    });

    // Stats
    const stats = {
        total: properties.length,
        vente: properties.filter((p) => p.type === 'vente').length,
        location: properties.filter((p) => p.type === 'location').length,
        dispo: properties.filter((p) => p.statut === 'disponible').length,
    };

    if (!isAdmin) return null;

    const isAr = lang === 'ar';

    return (
        <>
            <Head>
                <title>{t.admin.title} – LuxImmo</title>
            </Head>
            <Navbar />

            <div className="admin-container">
                {/* Header */}
                <div className="admin-page-header">
                    <div>
                        <h1 className="admin-page-title">🏛️ {t.admin.title}</h1>
                        <p className="admin-page-sub">{t.login.welcome} {user?.prenom} {user?.nom}</p>
                    </div>
                    <button className="btn btn-gold admin-add-btn" onClick={openCreate}>
                        {t.admin.addProperty}
                    </button>
                </div>

                {/* Stats */}
                <div className="admin-stats">
                    {[
                        { label: t.admin.totalProperties, value: stats.total, icon: '🏠', color: '#C9A84C' },
                        { label: t.admin.forSale, value: stats.vente, icon: '🏷️', color: '#10B981' },
                        { label: t.admin.forRent, value: stats.location, icon: '🔑', color: '#4A6CF7' },
                        { label: t.admin.disponible, value: stats.dispo, icon: '✓', color: '#E8C96B' },
                    ].map((s) => (
                        <div key={s.label} className="admin-stat-card">
                            <div className="stat-icon-big" style={{ color: s.color }}>{s.icon}</div>
                            <div className="stat-value-big" style={{ color: s.color }}>{s.value}</div>
                            <div className="stat-label-big">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div className="admin-search-bar">
                    <input
                        type="text"
                        placeholder={t.catalog.search}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Table */}
                {loading ? (
                    <div className="admin-loading">⏳ {t.common.loading}</div>
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>{isAr ? 'الصورة' : 'Photo'}</th>
                                    <th>{t.admin.fname.replace(' *', '')}</th>
                                    <th>{t.admin.ftype.replace(' *', '')}</th>
                                    <th>{t.detail.price}</th>
                                    <th>{t.detail.city}</th>
                                    <th>{t.detail.status}</th>
                                    <th>{t.detail.agent}</th>
                                    <th>{isAr ? 'الإجراءات' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>{t.catalog.noResults}</td></tr>
                                ) : filtered.map((p) => (
                                    <tr key={p.id}>
                                        <td className="td-id">#{p.id}</td>
                                        <td>
                                            <div className="table-thumb">
                                                <img
                                                    src={p.image_principale || '/prop_villa.png'}
                                                    alt={p.titre}
                                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/prop_villa.png'; }}
                                                />
                                            </div>
                                        </td>
                                        <td className="td-title">
                                            <Link href={`/properties/${p.id}`} target="_blank" className="table-link">
                                                {p.titre}
                                            </Link>
                                        </td>
                                        <td>
                                            <span className={`table-badge ${p.type === 'vente' ? 'badge-vente' : 'badge-location'}`}>
                                                {p.type === 'vente' ? t.detail.forSale : t.detail.forRent}
                                            </span>
                                        </td>
                                        <td className="td-price">{formatPrice(p.prix, p.type, lang)}</td>
                                        <td>{p.ville || '—'}</td>
                                        <td>
                                            <span className={`table-status-badge ${p.statut === 'disponible' ? 'status-dispo' : 'status-other'}`}>
                                                {p.statut}
                                            </span>
                                        </td>
                                        <td className="td-agent">
                                            {p.agent_nom ? `${p.agent_prenom} ${p.agent_nom}` : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="action-edit" onClick={() => openEdit(p)}>
                                                    ✏️ {t.admin.edit}
                                                </button>
                                                <button className="action-delete" onClick={() => setDeleteId(p.id)}>
                                                    🗑️ {t.admin.delete}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Form Modal ─────────────────────────────── */}
            {showForm && (
                <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>{editId ? t.admin.editProperty : t.admin.newProperty}</h2>
                            <button className="modal-close-x" onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <form className="admin-form" onSubmit={handleSubmit}>
                            <div className="admin-form-grid">
                                {/* Titre */}
                                <div className="admin-form-group full-width">
                                    <label>{t.admin.fname}</label>
                                    <input type="text" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required />
                                </div>

                                {/* Type + Statut */}
                                <div className="admin-form-group">
                                    <label>{t.admin.ftype}</label>
                                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'vente' | 'location' })}>
                                        <option value="vente">{t.detail.forSale}</option>
                                        <option value="location">{t.detail.forRent}</option>
                                    </select>
                                </div>
                                <div className="admin-form-group">
                                    <label>{t.admin.fstatus}</label>
                                    <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                                        <option value="disponible">{lang === 'ar' ? 'متاح' : 'Disponible'}</option>
                                        <option value="vendu">{lang === 'ar' ? 'تم البيع' : 'Vendu'}</option>
                                        <option value="loué">{lang === 'ar' ? 'مؤجر' : 'Loué'}</option>
                                        <option value="réservé">{lang === 'ar' ? 'محجوز' : 'Réservé'}</option>
                                    </select>
                                </div>

                                {/* Prix + Surface */}
                                <div className="admin-form-group">
                                    <label>{t.admin.fprix}</label>
                                    <input type="number" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} min={0} required />
                                </div>
                                <div className="admin-form-group">
                                    <label>{t.admin.fsurface}</label>
                                    <input type="number" value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })} min={0} />
                                </div>

                                {/* Adresse + Ville */}
                                <div className="admin-form-group">
                                    <label>{t.admin.faddress}</label>
                                    <input type="text" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
                                </div>
                                <div className="admin-form-group">
                                    <label>{t.admin.fcity}</label>
                                    <input type="text" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
                                </div>

                                {/* Agent */}
                                <div className="admin-form-group full-width">
                                    <label>{t.admin.fagent}</label>
                                    <select value={form.agent_id} onChange={(e) => setForm({ ...form, agent_id: e.target.value })}>
                                        <option value="">{t.admin.noAgent}</option>
                                        {agents.map((a) => (
                                            <option key={a.id} value={a.id}>{a.prenom} {a.nom} ({a.email})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Description */}
                                <div className="admin-form-group full-width">
                                    <label>{t.admin.fdesc}</label>
                                    <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                </div>

                                {/* Images */}
                                <div className="admin-form-group full-width">
                                    <label>{t.admin.fimages}</label>
                                    <textarea
                                        rows={4}
                                        value={form.images}
                                        onChange={(e) => setForm({ ...form, images: e.target.value })}
                                        placeholder="https://exemple.com/photo1.jpg&#10;https://exemple.com/photo2.jpg"
                                    />
                                    <span className="form-hint">{lang === 'ar' ? 'ستكون الصورة الأولى هي الصورة الرئيسية.' : lang === 'fr' ? 'La première image sera l\'image principale.' : 'The first image will be the main image.'}</span>
                                </div>
                            </div>

                            {formError && <div className="form-error-msg">⚠️ {formError}</div>}

                            <div className="admin-form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                                    {t.admin.cancel}
                                </button>
                                <button type="submit" className="btn btn-gold" disabled={formLoading}>
                                    {formLoading ? '...' : t.admin.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm ─────────────────────────── */}
            {deleteId && (
                <div className="admin-modal-overlay" onClick={() => setDeleteId(null)}>
                    <div className="admin-modal admin-modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="delete-icon">🗑️</div>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{t.admin.confirmDelete}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                            {t.admin.confirmDeleteMsg}
                        </p>
                        <div className="admin-form-actions">
                            <button className="btn btn-outline" onClick={() => setDeleteId(null)}>{t.admin.cancel}</button>
                            <button className="btn-delete-confirm" onClick={handleDelete} disabled={deleteLoading}>
                                {deleteLoading ? '...' : t.admin.delete}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Toast ──────────────────────────────────── */}
            {toast && (
                <div className="toast-notification">
                    {toast}
                </div>
            )}
        </>
    );
}

