import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PropertyCard from '@/components/PropertyCard';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LangContext';
import Link from 'next/link';

interface Property {
    id: number;
    titre: string;
    description: string;
    type: 'vente' | 'location';
    prix: number;
    surface: number;
    adresse: string;
    ville: string;
    statut: string;
    agent_id: number;
    image_principale: string | null;
}

interface RequestStatus {
    id: number;
    statut: 'en_attente' | 'approuve' | 'rejete';
    explication: string;
    type_action: 'add' | 'edit' | 'delete';
    propriete_id: number | null;
    propriete_titre: string | null;
    date_creation: string;
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
    images: string;
}

const emptyForm: FormState = {
    titre: '', description: '', type: 'vente', prix: '', surface: '',
    adresse: '', ville: '', statut: 'disponible', images: '',
};

function formatPrice(p: number, type: string, lang: string) {
    const locale = lang === 'ar' ? 'ar-TN' : lang === 'fr' ? 'fr-TN' : 'en-US';
    const formatted = new Intl.NumberFormat(locale, { style: 'decimal', minimumFractionDigits: 0 }).format(p);
    const suffix = type === 'location' ? (lang === 'ar' ? ' د.ت/شهر' : lang === 'fr' ? ' DT/mois' : ' DT/month') : ' DT';
    return `${formatted}${suffix}`;
}

export default function AgentPage() {
    const { user, isAgent } = useAuth();
    const { t, lang } = useLang();
    const router = useRouter();

    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<RequestStatus[]>([]);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [explanation, setExplanation] = useState('');
    const [actionType, setActionType] = useState('add');
    const [targetPropId, setTargetPropId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // CRUD states
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [toast, setToast] = useState('');

    useEffect(() => {
        if (!user) { router.push('/'); return; }
        if (!isAgent) { router.push('/'); return; }
    }, [user, isAgent, router]);

    const fetchData = useCallback(async () => {
        if (!user?.token) return;
        setLoading(true);
        try {
            const [propRes, reqRes] = await Promise.all([
                fetch('/api/agent/my-properties', { headers: { Authorization: `Bearer ${user.token}` } }),
                fetch('/api/agent/request-access', { headers: { Authorization: `Bearer ${user.token}` } })
            ]);

            const propData = await propRes.json();
            const reqData = await reqRes.json();

            setProperties(Array.isArray(propData) ? propData : []);
            setRequests(Array.isArray(reqData) ? reqData : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user?.token]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleRequestAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/agent/request-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`
                },
                body: JSON.stringify({
                    explication: explanation,
                    type_action: actionType,
                    propriete_id: actionType === 'add' ? null : parseInt(targetPropId) || null
                })
            });
            if (res.ok) {
                fetchData();
                setExplanation('');
                setActionType('add');
                setTargetPropId('');
                setShowRequestForm(false);
                showToast(isAr ? 'تم إرسال الطلب بنجاح' : 'Demande envoyée avec succès');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const openCreate = () => {
        setEditId(null);
        setForm(emptyForm);
        setFormError('');
        setShowForm(true);
    };

    const openEdit = async (prop: Property) => {
        setEditId(prop.id);
        setFormError('');
        try {
            const res = await fetch(`/api/properties/${prop.id}`);
            const data = await res.json();
            const imageUrls = (data.images || []).map((img: { image_url: string }) => img.image_url).join('\n');
            setForm({
                titre: prop.titre,
                description: data.description || '',
                type: prop.type,
                prix: String(prop.prix),
                surface: String(prop.surface || ''),
                adresse: prop.adresse || '',
                ville: prop.ville || '',
                statut: prop.statut || 'disponible',
                images: imageUrls,
            });
        } catch {
            setForm({
                titre: prop.titre, description: '', type: prop.type,
                prix: String(prop.prix), surface: String(prop.surface || ''),
                adresse: prop.adresse || '', ville: prop.ville || '',
                statut: prop.statut || 'disponible', images: '',
            });
        }
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');

        const images = form.images.split('\n').map(u => u.trim()).filter(Boolean);
        const body = {
            ...form,
            prix: parseFloat(form.prix),
            surface: form.surface ? parseFloat(form.surface) : null,
            agent_id: user?.id,
            images
        };

        try {
            const url = editId ? `/api/admin/properties/${editId}` : '/api/admin/properties';
            const method = editId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const d = await res.json();
                setFormError(d.error || 'Erreur');
            } else {
                setShowForm(false);
                showToast(editId ? t.admin.successEdit : t.admin.successAdd);
                fetchData();
            }
        } catch {
            setFormError('Erreur de connexion');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t.admin.confirmDeleteMsg)) return;
        try {
            const res = await fetch(`/api/admin/properties/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            if (res.ok) {
                showToast(t.admin.successDelete);
                fetchData();
            } else {
                const d = await res.json();
                showToast(d.error || 'Erreur');
            }
        } catch {
            showToast('Erreur de connexion');
        }
    };

    if (!isAgent) return null;
    const isAr = lang === 'ar';

    const hasPermission = (action: 'add' | 'edit' | 'delete', propId?: number) => {
        return requests.some(r =>
            r.statut === 'approuve' &&
            r.type_action === action &&
            (r.propriete_id === null || r.propriete_id === propId)
        );
    };

    const hasAnyPending = requests.some(r => r.statut === 'en_attente');

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

            <div className="section" style={{ paddingTop: '1.5rem' }}>
                {/* Requests Management Section */}
                <div className="request-status-card" style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    marginBottom: '2rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: requests.length > 0 ? '1rem' : 0 }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{t.agent.status}</h3>
                        <button
                            className="btn btn-gold btn-telegram-sm"
                            onClick={() => setShowRequestForm(!showRequestForm)}
                        >
                            {showRequestForm ? t.admin.cancel : t.agent.requestAccess}
                        </button>
                    </div>

                    {showRequestForm && (
                        <form onSubmit={handleRequestAccess} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div className="admin-form-group">
                                    <label>{t.agent.fAction}</label>
                                    <select
                                        value={actionType}
                                        onChange={(e) => setActionType(e.target.value)}
                                        className="filter-group select"
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="add">{t.agent.actionAdd}</option>
                                        <option value="edit">{t.agent.actionEdit}</option>
                                        <option value="delete">{t.agent.actionDelete}</option>
                                    </select>
                                </div>
                                <div className="admin-form-group">
                                    <label>{t.agent.fProperty}</label>
                                    <select
                                        value={targetPropId}
                                        onChange={(e) => setTargetPropId(e.target.value)}
                                        disabled={actionType === 'add'}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', opacity: actionType === 'add' ? 0.5 : 1 }}
                                    >
                                        <option value="">{actionType === 'add' ? '—' : t.agent.allProperties}</option>
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.titre} (#{p.id})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="admin-form-group">
                                <label>{t.agent.requestExplanation}</label>
                                <textarea
                                    value={explanation}
                                    onChange={(e) => setExplanation(e.target.value)}
                                    placeholder="..."
                                    style={{
                                        width: '100%', padding: '1rem', borderRadius: '8px',
                                        background: 'var(--bg-app)', border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)', resize: 'vertical'
                                    }}
                                    rows={3}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-gold" disabled={submitting} style={{ alignSelf: 'flex-start' }}>
                                {submitting ? '...' : t.agent.sendRequest}
                            </button>
                        </form>
                    )}

                    {requests.length > 0 && !showRequestForm && (
                        <div className="requests-history" style={{ marginTop: '1rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <tbody>
                                    {requests.slice(0, 5).map(r => (
                                        <tr key={r.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '0.75rem 0' }}>
                                                <div className="table-status-badge">
                                                    {r.type_action === 'add' ? 'ADD' : r.type_action === 'edit' ? 'EDIT' : 'DEL'}
                                                </div>
                                                <span style={{ marginLeft: '10px' }}>{r.propriete_titre || (isAr ? 'عام' : 'Global')}</span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span className={`status-tag status-${r.statut}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                                                    {r.statut === 'en_attente' ? (isAr ? 'في الانتظار' : 'Pending') :
                                                        r.statut === 'approuve' ? (isAr ? 'مقبول' : 'Approved') : (isAr ? 'مرفوض' : 'Rejected')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Actions for Approved Agents */}
                <div className="results-meta" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p className="results-count">
                        <strong>{properties.length}</strong> {t.catalog.results}
                    </p>
                    {hasPermission('add') && (
                        <button className="btn btn-gold" onClick={openCreate}>
                            {t.admin.addProperty}
                        </button>
                    )}
                </div>

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
                    <div className="properties-grid">
                        {properties.map((p) => (
                            <div key={p.id} style={{ position: 'relative' }}>
                                <PropertyCard
                                    property={p as any}
                                    fallback={'/prop_villa.png'}
                                />
                                <div style={{
                                    position: 'absolute', top: '10px', right: '10px',
                                    display: 'flex', gap: '8px', zIndex: 10
                                }}>
                                    {hasPermission('edit', p.id) && (
                                        <button
                                            onClick={() => openEdit(p)}
                                            style={{
                                                background: 'rgba(255,255,255,0.9)', border: 'none',
                                                borderRadius: '50%', width: '36px', height: '36px',
                                                cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            title={t.admin.edit}
                                        >
                                            ✏️
                                        </button>
                                    )}
                                    {hasPermission('delete', p.id) && (
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            style={{
                                                background: 'rgba(255,255,255,0.9)', border: 'none',
                                                borderRadius: '50%', width: '36px', height: '36px',
                                                cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            title={t.admin.delete}
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Form Modal (Reuse part of Admin CSS) */}
            {showForm && (
                <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>{editId ? t.admin.editProperty : t.admin.newProperty}</h2>
                            <button className="modal-close-x" onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <form className="admin-form" onSubmit={handleSubmit}>
                            <div className="admin-form-grid">
                                <div className="admin-form-group full-width">
                                    <label>{t.admin.fname}</label>
                                    <input type="text" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required />
                                </div>
                                <div className="admin-form-group">
                                    <label>{t.admin.ftype}</label>
                                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                                        <option value="vente">{t.detail.forSale}</option>
                                        <option value="location">{t.detail.forRent}</option>
                                    </select>
                                </div>
                                <div className="admin-form-group">
                                    <label>{t.admin.fstatus}</label>
                                    <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                                        <option value="disponible">{isAr ? 'متاح' : 'Disponible'}</option>
                                        <option value="vendu">{isAr ? 'تم البيع' : 'Vendu'}</option>
                                        <option value="loué">{isAr ? 'مؤجر' : 'Loué'}</option>
                                    </select>
                                </div>
                                <div className="admin-form-group">
                                    <label>{t.admin.fprix}</label>
                                    <input type="number" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} required />
                                </div>
                                <div className="admin-form-group">
                                    <label>{t.admin.fsurface}</label>
                                    <input type="number" value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })} />
                                </div>
                                <div className="admin-form-group">
                                    <label>{t.admin.faddress}</label>
                                    <input type="text" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
                                </div>
                                <div className="admin-form-group">
                                    <label>{t.admin.fcity}</label>
                                    <input type="text" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
                                </div>
                                <div className="admin-form-group full-width">
                                    <label>{t.admin.fdesc}</label>
                                    <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                </div>
                                <div className="admin-form-group full-width">
                                    <label>{t.admin.fimages}</label>
                                    <textarea rows={3} value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} />
                                </div>
                            </div>
                            {formError && <div className="form-error-msg">⚠️ {formError}</div>}
                            <div className="admin-form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>{t.admin.cancel}</button>
                                <button type="submit" className="btn btn-gold" disabled={formLoading}>{t.admin.save}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <div className="toast-notification">{toast}</div>}

            <Footer />

            <style jsx>{`
                .status-tag {
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 700;
                }
                .status-aucun { background: #eee; color: #666; }
                .status-en_attente { background: #fff8e1; color: #f57c00; }
                .status-approuve { background: #e8f5e9; color: #2e7d32; }
                .status-rejete { background: #ffebee; color: #c62828; }
            `}</style>
        </>
    );
}
