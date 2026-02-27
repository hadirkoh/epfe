import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'pfe_luxury_real_estate_secret_2026';

export interface JWTPayload {
    id: number;
    email: string;
    nom: string;
    prenom: string;
    role: 'admin' | 'agent';
}

export function signToken(payload: JWTPayload): string {
    return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, SECRET) as JWTPayload;
    } catch {
        return null;
    }
}

export function getTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
}
