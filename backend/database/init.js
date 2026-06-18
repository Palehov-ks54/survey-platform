const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const initDatabase = async () => {
    try {
        console.log('Начинаем создание таблиц...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Таблица users создана');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS surveys (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                admin_id INTEGER REFERENCES users(id)
            );
        `);
        console.log('Таблица surveys создана');

        // Создание таблицы questions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS questions (
                id SERIAL PRIMARY KEY,
                survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
                question_text TEXT NOT NULL,
                question_type VARCHAR(20) NOT NULL,
                position INTEGER NOT NULL
            );
        `);
        console.log('Таблица questions создана');

        // Создание таблицы answer_options
        await pool.query(`
            CREATE TABLE IF NOT EXISTS answer_options (
                id SERIAL PRIMARY KEY,
                question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
                option_text VARCHAR(255) NOT NULL,
                position INTEGER NOT NULL
            );
        `);
        console.log('Таблица answer_options создана');

        // Создание таблицы user_responses
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_responses (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                survey_id INTEGER REFERENCES surveys(id),
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, survey_id)
            );
        `);
        console.log('Таблица user_responses создана');

        // Создание таблицы response_answers
        await pool.query(`
            CREATE TABLE IF NOT EXISTS response_answers (
                id SERIAL PRIMARY KEY,
                response_id INTEGER REFERENCES user_responses(id) ON DELETE CASCADE,
                question_id INTEGER REFERENCES questions(id),
                answer_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Таблица response_answers создана');

        // Создание админа по умолчанию
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        const adminCheck = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
        
        if (adminCheck.rows.length === 0) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await pool.query(
                'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
                ['Администратор', adminEmail, hashedPassword, 'admin']
            );
            console.log('Админ создан:', adminEmail);
        } else {
            console.log('Админ уже существует');
        }

        console.log('База данных успешно инициализирована!');
        
    } catch (error) {
        console.error('Ошибка при инициализации БД:', error);
    }
};

module.exports = initDatabase;