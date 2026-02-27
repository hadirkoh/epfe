const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: 'hadir',
    database: 'pfe_real_estate',
    host: 'localhost',
    port: 5432,
});

async function main() {
    console.log('--- Mise à jour du schéma de base de données ---');

    // Create demandes_acces table
    console.log('Création de la table demandes_acces...');
    await pool.query(`
        CREATE TABLE IF NOT EXISTS demandes_acces (
            id SERIAL PRIMARY KEY,
            utilisateur_id INTEGER REFERENCES utilisateurs(id) ON DELETE CASCADE,
            explication TEXT NOT NULL,
            statut VARCHAR(20) DEFAULT 'en_attente', -- 'en_attente', 'approuve', 'rejete'
            date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            date_reponse TIMESTAMP
        );
    `);

    // Create journaux_actions table
    console.log('Création de la table journaux_actions...');
    await pool.query(`
        CREATE TABLE IF NOT EXISTS journaux_actions (
            id SERIAL PRIMARY KEY,
            utilisateur_id INTEGER REFERENCES utilisateurs(id) ON DELETE CASCADE,
            action VARCHAR(50) NOT NULL,
            entite VARCHAR(50) NOT NULL,
            entite_id INTEGER,
            details TEXT,
            date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log('Schéma mis à jour avec succès !');
    process.exit(0);
}

main().catch(e => {
    console.error('Erreur lors de la mise à jour du schéma:', e);
    process.exit(1);
});
