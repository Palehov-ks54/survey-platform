const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Получение всех активных опросов (для прохождения)
router.get('/active', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT s.*, u.username as creator_name FROM surveys s JOIN users u ON s.admin_id = u.id WHERE s.is_active = true ORDER BY s.created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получение ВСЕХ опросов (для админа)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT s.*, u.username as creator_name FROM surveys s JOIN users u ON s.admin_id = u.id ORDER BY s.created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получение опросов текущего пользователя
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM surveys WHERE admin_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получение опроса с вопросами
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const surveyResult = await pool.query('SELECT * FROM surveys WHERE id = $1', [id]);
        if (surveyResult.rows.length === 0) {
            return res.status(404).json({ message: 'Опрос не найден' });
        }

        const survey = surveyResult.rows[0];

        const questionsResult = await pool.query(
            'SELECT * FROM questions WHERE survey_id = $1 ORDER BY position',
            [id]
        );

        const questions = questionsResult.rows;

        for (let question of questions) {
            const optionsResult = await pool.query(
                'SELECT * FROM answer_options WHERE question_id = $1 ORDER BY position',
                [question.id]
            );
            question.options = optionsResult.rows;
        }

        survey.questions = questions;
        res.json(survey);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Создание опроса (любой авторизованный пользователь)
router.post('/', authMiddleware, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { title, description, questions } = req.body;

        const surveyResult = await client.query(
            'INSERT INTO surveys (title, description, admin_id) VALUES ($1, $2, $3) RETURNING *',
            [title, description, req.user.id]
        );

        const survey = surveyResult.rows[0];

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            const questionResult = await client.query(
                'INSERT INTO questions (survey_id, question_text, question_type, position) VALUES ($1, $2, $3, $4) RETURNING *',
                [survey.id, question.question_text, question.question_type, i + 1]
            );

            if (question.question_type === 'single' || question.question_type === 'multiple') {
                for (let j = 0; j < question.options.length; j++) {
                    await client.query(
                        'INSERT INTO answer_options (question_id, option_text, position) VALUES ($1, $2, $3)',
                        [questionResult.rows[0].id, question.options[j], j + 1]
                    );
                }
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Опрос успешно создан',
            survey
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Ошибка при создании опроса' });
    } finally {
        client.release();
    }
});

// Обновление опроса (владелец или админ)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const surveyCheck = await pool.query('SELECT * FROM surveys WHERE id = $1', [id]);
        if (surveyCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Опрос не найден' });
        }
        
        if (surveyCheck.rows[0].admin_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нет прав на редактирование' });
        }

        const { title, description, is_active } = req.body;
        await pool.query(
            'UPDATE surveys SET title = $1, description = $2, is_active = $3 WHERE id = $4',
            [title, description, is_active, id]
        );

        res.json({ message: 'Опрос обновлен' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка при обновлении опроса' });
    }
});

// Удаление всех вопросов опроса
router.delete('/:id/questions', authMiddleware, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        
        // Проверяем права
        const surveyCheck = await client.query('SELECT * FROM surveys WHERE id = $1', [id]);
        if (surveyCheck.rows[0].admin_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нет прав' });
        }

        await client.query('BEGIN');
        await client.query('DELETE FROM response_answers WHERE question_id IN (SELECT id FROM questions WHERE survey_id = $1)', [id]);
        await client.query('DELETE FROM answer_options WHERE question_id IN (SELECT id FROM questions WHERE survey_id = $1)', [id]);
        await client.query('DELETE FROM questions WHERE survey_id = $1', [id]);
        await client.query('COMMIT');

        res.json({ message: 'Вопросы удалены' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Ошибка' });
    } finally {
        client.release();
    }
});

// Добавление новых вопросов к опросу
router.post('/:id/questions', authMiddleware, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { questions } = req.body;
        
        // Проверяем права
        const surveyCheck = await client.query('SELECT * FROM surveys WHERE id = $1', [id]);
        if (surveyCheck.rows[0].admin_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нет прав' });
        }

        await client.query('BEGIN');

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            const questionResult = await client.query(
                'INSERT INTO questions (survey_id, question_text, question_type, position) VALUES ($1, $2, $3, $4) RETURNING *',
                [id, question.question_text, question.question_type, i + 1]
            );

            if (question.question_type === 'single' || question.question_type === 'multiple') {
                for (let j = 0; j < question.options.length; j++) {
                    if (question.options[j].trim() !== '') {
                        await client.query(
                            'INSERT INTO answer_options (question_id, option_text, position) VALUES ($1, $2, $3)',
                            [questionResult.rows[0].id, question.options[j], j + 1]
                        );
                    }
                }
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Вопросы обновлены' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Ошибка' });
    } finally {
        client.release();
    }
}); 

// Удаление опроса (владелец или админ)
router.delete('/:id', authMiddleware, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        
        const surveyCheck = await client.query('SELECT * FROM surveys WHERE id = $1', [id]);
        if (surveyCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Опрос не найден' });
        }
        
        if (surveyCheck.rows[0].admin_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нет прав на удаление' });
        }

        await client.query('BEGIN');

        await client.query('DELETE FROM response_answers WHERE response_id IN (SELECT id FROM user_responses WHERE survey_id = $1)', [id]);
        await client.query('DELETE FROM user_responses WHERE survey_id = $1', [id]);
        await client.query('DELETE FROM answer_options WHERE question_id IN (SELECT id FROM questions WHERE survey_id = $1)', [id]);
        await client.query('DELETE FROM questions WHERE survey_id = $1', [id]);
        await client.query('DELETE FROM surveys WHERE id = $1', [id]);

        await client.query('COMMIT');
        
        res.json({ message: 'Опрос успешно удален' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Ошибка при удалении опроса:', error);
        res.status(500).json({ message: 'Ошибка при удалении опроса' });
    } finally {
        client.release();
    }
});

module.exports = router;