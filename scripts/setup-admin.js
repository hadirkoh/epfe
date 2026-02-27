const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: 'hadir',
    database: 'pfe_real_estate',
    host: 'localhost',
    port: 5432,
});

async function main() {
    // Check existing users
    console.log('--- Existing utilisateurs ---');
    const users = await pool.query('SELECT id, nom, prenom, email, role, actif, LEFT(mot_de_passe,20) AS pwd_preview FROM utilisateurs');
    console.table(users.rows);

    // Insert admin if not exists
    const existing = await pool.query("SELECT id FROM utilisateurs WHERE email = 'hadir.ayari@esen.tn'");
    if (existing.rows.length === 0) {
        console.log('\nInserting admin user...');
        await pool.query(
            "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, actif) VALUES ('Ayari', 'Hadir', 'hadir.ayari@esen.tn', 'hadir', 'admin', true)"
        );
        console.log('Admin inserted with plain text password.');
    } else {
        console.log('\nAdmin user already exists:', existing.rows[0]);
        // Update password to plain text for testing
        await pool.query("UPDATE utilisateurs SET mot_de_passe = 'hadir', actif = true WHERE email = 'hadir.ayari@esen.tn'");
        console.log('Password reset to plain text "hadir".');
    }

    // Verify
    const verify = await pool.query("SELECT id, nom, prenom, email, role, actif FROM utilisateurs WHERE email = 'hadir.ayari@esen.tn'");
    console.log('\nAdmin user:');
    console.table(verify.rows);

    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
