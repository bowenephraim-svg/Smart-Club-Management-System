const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'victory_school_membership_system',
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(conn => {
        console.log('✅ Relational engine pool established successfully with MySQL.');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Critical runtime: Database cluster pool connection dropped.', err.message);
    });

module.exports = pool;