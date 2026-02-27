import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useLang, LangProvider } from '@/contexts/LangContext';
import type { Lang } from '@/lib/translations';

// ─── Language Switcher ──────────────────────────────────────────
function LanguageSwitcher() {
    const { lang, setLang } = useLang();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const langs: { code: Lang; label: string; flag: string }[] = [
        { code: 'fr', label: 'Français', flag: '🇫🇷' },
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'ar', label: 'العربية', flag: '🇹🇳' },
    ];

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const current = langs.find((l) => l.code === lang) || langs[0];

    return (
        <div className="lang-switcher" ref={ref}>
            <button
                className="lang-btn"
                onClick={() => setOpen(!open)}
                aria-label={lang === 'ar' ? 'تغيير اللغة' : lang === 'fr' ? 'Changer la langue' : 'Change language'}
            >
                <span>{current.flag}</span>
                <span>{current.code.toUpperCase()}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }}>
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>
            {open && (
                <div className="lang-dropdown">
                    {langs.map((l) => (
                        <button
                            key={l.code}
                            className={`lang-option ${lang === l.code ? 'active' : ''}`}
                            onClick={() => { setLang(l.code); setOpen(false); }}
                        >
                            <span>{l.flag}</span>
                            <span>{l.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Login Modal ────────────────────────────────────────────────
function LoginModal({ onClose }: { onClose: () => void }) {
    const { login } = useAuth();
    const { t, lang } = useLang();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), mot_de_passe: password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || t.login.error);
                setLoading(false);
                return;
            }
            login(data.token, data.user);
            onClose();
            if (data.user.role === 'admin') {
                router.push('/admin');
            } else if (data.user.role === 'agent') {
                router.push('/agent');
            }
        } catch {
            setError(lang === 'ar' ? 'خطأ في الاتصال بالخادم.' : lang === 'fr' ? 'Erreur de connexion au serveur.' : 'Server connection error.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-overlay" onClick={onClose}>
            <div className="login-modal" onClick={(e) => e.stopPropagation()}>
                <button className="login-close" onClick={onClose}>✕</button>

                <div className="login-header">
                    <div className="login-icon">🏛️</div>
                    <h2>{t.login.title}</h2>
                    <p>{t.login.subtitle}</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit} noValidate>
                    <div className="lform-group">
                        <label htmlFor="login-email">{t.login.email}</label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@exemple.com"
                            required
                            autoFocus
                        />
                    </div>
                    <div className="lform-group">
                        <label htmlFor="login-password">{t.login.password}</label>
                        <input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="login-error">
                            ⚠️ {error}
                        </div>
                    )}

                    <button type="submit" className="login-submit" disabled={loading}>
                        {loading ? '...' : t.login.submit}
                    </button>

                    <button type="button" className="login-cancel-btn" onClick={onClose}>
                        {t.login.cancel}
                    </button>
                </form>

                <div className="login-roles-hint">
                    <div className="role-hint"><span className="role-badge-admin">{t.login.adminBadge}</span> — {lang === 'ar' ? 'صلاحيات كاملة على كل العقارات' : lang === 'fr' ? 'CRUD complet sur tous les biens' : 'Full CRUD access on all properties'}</div>
                    <div className="role-hint"><span className="role-badge-agent">{t.login.agentBadge}</span> — {lang === 'ar' ? 'الوصول إلى العقارات المسندة إليك' : lang === 'fr' ? 'Accès à vos biens assignés' : 'Access to your assigned properties'}</div>
                </div>
            </div>
        </div>
    );
}

// ─── User Badge ─────────────────────────────────────────────────
function UserBadge() {
    const { user, logout, isAdmin, isAgent } = useAuth();
    const { t, lang } = useLang();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    if (!user) return null;

    const initials = `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase();

    return (
        <div className="user-badge-wrapper" ref={ref}>
            <button className="user-badge-btn" onClick={() => setOpen(!open)}>
                <div className="user-avatar">{initials}</div>
                <div className="user-info-compact">
                    <span className="user-name-compact">{user.prenom} {user.nom}</span>
                    <span className={`user-role-badge ${isAdmin ? 'badge-admin-role' : 'badge-agent-role'}`}>
                        {isAdmin ? t.login.adminBadge : t.login.agentBadge}
                    </span>
                </div>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }}>
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>
            {open && (
                <div className="user-dropdown">
                    {isAdmin && (
                        <Link href="/admin" className="user-drop-item" onClick={() => setOpen(false)}>
                            🏛️ {t.nav.admin}
                        </Link>
                    )}
                    {isAgent && (
                        <Link href="/agent" className="user-drop-item" onClick={() => setOpen(false)}>
                            🏠 {t.nav.myProperties}
                        </Link>
                    )}
                    <button
                        className="user-drop-item user-drop-logout"
                        onClick={() => { logout(); setOpen(false); router.push('/'); }}
                    >
                        🚪 {t.nav.logout}
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Navbar ─────────────────────────────────────────────────────
export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useLang();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const isActive = (path: string) => router.pathname === path || router.pathname.startsWith(path + '/');
    const telegramBot = process.env.NEXT_PUBLIC_TELEGRAM_BOT || 'ImmobilierBot';

    return (
        <>
            <nav className="navbar" style={scrolled ? { background: 'rgba(10,10,15,0.98)' } : {}}>
                <Link href="/" className="navbar-logo">
                    <div className="logo-icon">🏛️</div>
                    Lux<span>Immo</span>
                </Link>

                <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                    <li>
                        <Link href="/" className={router.pathname === '/' ? 'active' : ''} onClick={() => setMenuOpen(false)}>
                            {t.nav.home}
                        </Link>
                    </li>
                    <li>
                        <Link href="/properties" className={isActive('/properties') ? 'active' : ''} onClick={() => setMenuOpen(false)}>
                            {t.nav.properties}
                        </Link>
                    </li>
                    <li>
                        <Link href="/properties?type=vente" onClick={() => setMenuOpen(false)}>
                            {t.nav.forSale}
                        </Link>
                    </li>
                    <li>
                        <Link href="/properties?type=location" onClick={() => setMenuOpen(false)}>
                            {t.nav.forRent}
                        </Link>
                    </li>
                    <li>
                        <a
                            href={`https://t.me/${telegramBot}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="navbar-cta"
                        >
                            📲 Telegram
                        </a>
                    </li>
                </ul>

                <div className="navbar-right">
                    <LanguageSwitcher />
                    {user ? (
                        <UserBadge />
                    ) : (
                        <button className="btn-login-nav" onClick={() => setShowLogin(true)}>
                            🔐 {t.nav.login}
                        </button>
                    )}
                    <button
                        className="navbar-mobile-toggle"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? '✕' : '☰'}
                    </button>
                </div>
            </nav>

            {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        </>
    );
}
