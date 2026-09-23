const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'BkiprotichEph4416%',
    database: process.env.DB_NAME || 'victory_school_membership_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Structural baseline check to confirm service viability upon boot
pool.getConnection()
    .then(conn => {
        console.log('✅ Relational engine pool established successfully with MySQL.');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Critical runtime: Database cluster pool connection dropped.', err.message);
    });

module.exports = pool;