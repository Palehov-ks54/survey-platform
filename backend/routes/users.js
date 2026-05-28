const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Получение всех пользователей (только админ)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.id, u.username, u.email, u.role, u.created_at,
                    (SELECT COUNT(*) FROM user_responses WHERE user_id = u.id) as surveys_completed
             FROM users u 
             WHERE u.role = 'user'
             ORDER BY u.created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получение статистики пользователя
router.get('/:userId/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await pool.query(
            'SELECT id, username, email, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const completedSurveys = await pool.query(
            `SELECT ur.*, s.title as survey_title 
             FROM user_responses ur 
             JOIN surveys s ON ur.survey_id = s.id 
             WHERE ur.user_id = $1 
             ORDER BY ur.completed_at DESC`,
            [userId]
        );

        res.json({
            user: user.rows[0],
            completedSurveys: completedSurveys.rows,
            totalCompleted: completedSurveys.rows.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Удаление пользователя и всех его данных
router.delete('/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { userId } = req.params;

        // Проверяем, что это не админ
        const userCheck = await client.query('SELECT role FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        if (userCheck.rows[0].role === 'admin') {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Нельзя удалить администратора' });
        }

        // Удаляем ответы пользователя
        await client.query(
            `DELETE FROM response_answers 
             WHERE response_id IN (
                 SELECT id FROM user_responses WHERE user_id = $1
             )`,
            [userId]
        );

        // Удаляем записи о прохождении опросов
        await client.query('DELETE FROM user_responses WHERE user_id = $1', [userId]);

        // Удаляем пользователя
        await client.query('DELETE FROM users WHERE id = $1', [userId]);

        await client.query('COMMIT');
        res.json({ message: 'Пользователь и все его данные успешно удалены' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Ошибка при удалении пользователя' });
    } finally {
        client.release();
    }
});

module.exports = router;