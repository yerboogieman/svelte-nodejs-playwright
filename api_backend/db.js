const { Pool } = require('pg');

const pool = new Pool({
    user: 'ia_demo',
    host: 'dpg-cpotjk1u0jms73ffs5bg-a.oregon-postgres.render.com',
    database: 'ia_demo',
    password: 'nIEPFe4xfILd4w6ty9XkxdNBRnKpJIR2',
    port: 5432,
    ssl: {
        rejectUnauthorized: false // Allow connections to servers with self-signed or unverified certificates
    }
});

module.exports = pool;


