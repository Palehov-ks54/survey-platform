const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect()
    .then(() => console.log('Подключено к Neon.tech'))
    .catch(err => console.error('Ошибка подключения:', err));

module.exports = pool;