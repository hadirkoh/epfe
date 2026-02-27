import pool from './db';
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'logs', 'audit.log');

// Ensure logs directory exists
if (!fs.existsSync(path.join(process.cwd(), 'logs'))) {
    fs.mkdirSync(path.join(process.cwd(), 'logs'));
}

export async function logAction(userId: number, action: string, entite: string, entiteId?: number, details?: any) {
    try {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] User ${userId} performed ${action} on ${entite} (ID: ${entiteId || 'N/A'}) - Details: ${JSON.stringify(details)}\n`;

        // Log to database
        await pool.query(
            'INSERT INTO journaux_actions (utilisateur_id, action, entite, entite_id, details) VALUES ($1, $2, $3, $4, $5)',
            [userId, action, entite, entiteId || null, JSON.stringify(details) || null]
        );

        // Log to file
        fs.appendFileSync(LOG_FILE, logEntry);
    } catch (err) {
        console.error('Audit Log Error:', err);
    }
}

export async function checkAgentAccess(userId: number, action: 'add' | 'edit' | 'delete', propertyId?: number): Promise<boolean> {
    try {
        // Check for specific permission
        // If propriete_id is NULL in the DB, it's a global permission for that action/agent
        const result = await pool.query(
            `SELECT id FROM demandes_acces 
             WHERE utilisateur_id = $1 
             AND type_action = $2 
             AND statut = 'approuve' 
             AND (propriete_id IS NULL OR propriete_id = $3)`,
            [userId, action, propertyId || null]
        );
        return result.rows.length > 0;
    } catch (err) {
        console.error('Access Check Error:', err);
        return false;
    }
}
