const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Отправка ответов на опрос
router.post('/:surveyId', authMiddleware, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { surveyId } = req.params;
        const userId = req.user.id;
        const { answers } = req.body;

        // Проверка, не проходил ли пользователь уже этот опрос
        const existingResponse = await client.query(
            'SELECT * FROM user_responses WHERE user_id = $1 AND survey_id = $2',
            [userId, surveyId]
        );

        if (existingResponse.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Вы уже проходили этот опрос' });
        }

        // Создаем запись о прохождении опроса
        const responseResult = await client.query(
            'INSERT INTO user_responses (user_id, survey_id) VALUES ($1, $2) RETURNING *',
            [userId, surveyId]
        );

        const responseId = responseResult.rows[0].id;

        // Сохраняем ответы на вопросы
        for (let answer of answers) {
            await client.query(
                'INSERT INTO response_answers (response_id, question_id, answer_text) VALUES ($1, $2, $3)',
                [responseId, answer.question_id, answer.answer_text]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Ответы сохранены',
            response: responseResult.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Ошибка при сохранении ответов' });
    } finally {
        client.release();
    }
});

// Получение ответов пользователя
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT ur.*, s.title as survey_title 
             FROM user_responses ur 
             JOIN surveys s ON ur.survey_id = s.id 
             WHERE ur.user_id = $1 
             ORDER BY ur.completed_at DESC`,
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Проверка, проходил ли пользователь опрос
router.get('/check/:surveyId', authMiddleware, async (req, res) => {
    try {
        const { surveyId } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            'SELECT * FROM user_responses WHERE user_id = $1 AND survey_id = $2',
            [userId, surveyId]
        );

        res.json({ completed: result.rows.length > 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получение деталей ответов пользователя
router.get('/:responseId/details', authMiddleware, async (req, res) => {
    try {
        const { responseId } = req.params;
        const userId = req.user.id;

        // Проверяем, что ответ принадлежит пользователю
        const responseCheck = await pool.query(
            'SELECT * FROM user_responses WHERE id = $1 AND user_id = $2',
            [responseId, userId]
        );

        if (responseCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Ответы не найдены' });
        }

        // Получаем ответы с вопросами
        const answers = await pool.query(
            `SELECT q.question_text, ra.answer_text 
             FROM response_answers ra 
             JOIN questions q ON ra.question_id = q.id 
             WHERE ra.response_id = $1 
             ORDER BY q.position`,
            [responseId]
        );

        res.json(answers.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;