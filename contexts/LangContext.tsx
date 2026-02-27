import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import T, { Lang } from '@/lib/translations';

interface LangContextType {
    lang: Lang;
    setLang: (l: Lang) => void;
    t: typeof T['fr'];
    isRTL: boolean;
}

const LangContext = createContext<LangContextType>({
    lang: 'fr',
    setLang: () => { },
    t: T['fr'],
    isRTL: false,
});

export function LangProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Lang>('fr');

    // Restore from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('luximmo_lang') as Lang | null;
        if (stored && (stored === 'fr' || stored === 'en' || stored === 'ar')) {
            setLangState(stored);
        }
    }, []);

    // Apply RTL/LTR to document
    useEffect(() => {
        const dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.dir = dir;
        document.documentElement.lang = lang;
    }, [lang]);

    function setLang(l: Lang) {
        setLangState(l);
        localStorage.setItem('luximmo_lang', l);
    }

    return (
        <LangContext.Provider value={{ lang, setLang, t: T[lang], isRTL: lang === 'ar' }}>
            {children}
        </LangContext.Provider>
    );
}

export function useLang() {
    return useContext(LangContext);
}
