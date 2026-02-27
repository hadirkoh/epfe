import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
    id: number;
    email: string;
    nom: string;
    prenom: string;
    role: 'admin' | 'agent';
    token: string;
}

interface AuthContextType {
    user: AuthUser | null;
    login: (token: string, user: Omit<AuthUser, 'token'>) => void;
    logout: () => void;
    isAdmin: boolean;
    isAgent: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => { },
    logout: () => { },
    isAdmin: false,
    isAgent: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);

    // Restore from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem('luximmo_user');
            if (stored) {
                const parsed = JSON.parse(stored);
                setUser(parsed);
            }
        } catch {
            localStorage.removeItem('luximmo_user');
        }
    }, []);

    function login(token: string, userData: Omit<AuthUser, 'token'>) {
        const full: AuthUser = { ...userData, token };
        setUser(full);
        localStorage.setItem('luximmo_user', JSON.stringify(full));
    }

    function logout() {
        setUser(null);
        localStorage.removeItem('luximmo_user');
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                isAdmin: user?.role === 'admin',
                isAgent: user?.role === 'agent',
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
