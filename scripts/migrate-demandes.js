const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: 'hadir',
    database: 'pfe_real_estate',
    host: 'localhost',
    port: 5432,
});

async function main() {
    console.log('--- Migration: Ajout de type_action et propriete_id à demandes_acces ---');

    try {
        // Add type_action and propriete_id columns
        console.log('Exécution de ALTER TABLE...');
        await pool.query(`
            ALTER TABLE demandes_acces 
            ADD COLUMN IF NOT EXISTS type_action VARCHAR(50),
            ADD COLUMN IF NOT EXISTS propriete_id INTEGER REFERENCES biens_immobiliers(id) ON DELETE SET NULL;
        `);
        console.log('Colonnes ajoutées avec succès !');
    } catch (e) {
        console.error('Détails de l\'erreur SQL:', e.message);
        console.error('Code d\'erreur:', e.code);
    } finally {
        await pool.end();
    }
}

main().catch(console.error);
