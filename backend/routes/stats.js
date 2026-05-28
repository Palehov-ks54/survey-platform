const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

router.get('/:surveyId', authMiddleware, async (req, res) => {
    try {
        const { surveyId } = req.params;

        const surveyResult = await pool.query('SELECT * FROM surveys WHERE id = $1', [surveyId]);
        if (surveyResult.rows.length === 0) {
            return res.status(404).json({ message: 'Опрос не найден' });
        }

        // Проверяем права: владелец или админ
        const survey = surveyResult.rows[0];
        if (survey.admin_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нет доступа к статистике' });
        }

        const totalResponses = await pool.query(
            'SELECT COUNT(*) FROM user_responses WHERE survey_id = $1',
            [surveyId]
        );

        const questionsResult = await pool.query(
            'SELECT * FROM questions WHERE survey_id = $1 ORDER BY position',
            [surveyId]
        );

        const questions = questionsResult.rows;

        for (let question of questions) {
            if (question.question_type === 'text') {
                const answers = await pool.query(
                    `SELECT ra.answer_text, u.username, ra.created_at 
                     FROM response_answers ra 
                     JOIN user_responses ur ON ra.response_id = ur.id 
                     JOIN users u ON ur.user_id = u.id 
                     WHERE ra.question_id = $1`,
                    [question.id]
                );
                question.answers = answers.rows;
            } else if (question.question_type === 'scale') {
                const answers = await pool.query(
                    `SELECT ra.answer_text, u.username, ra.created_at 
                     FROM response_answers ra 
                     JOIN user_responses ur ON ra.response_id = ur.id 
                     JOIN users u ON ur.user_id = u.id 
                     WHERE ra.question_id = $1`,
                    [question.id]
                );
                
                const distribution = {};
                for (let i = 1; i <= 10; i++) {
                    distribution[i] = 0;
                }
                
                answers.rows.forEach(answer => {
                    const value = parseInt(answer.answer_text);
                    if (value >= 1 && value <= 10) {
                        distribution[value]++;
                    }
                });

                question.answers = answers.rows;
                question.distribution = distribution;
                question.average = answers.rows.length > 0 
                    ? (answers.rows.reduce((sum, a) => sum + parseInt(a.answer_text), 0) / answers.rows.length).toFixed(1)
                    : 0;
            } else {
                const options = await pool.query(
                    'SELECT * FROM answer_options WHERE question_id = $1 ORDER BY position',
                    [question.id]
                );

                for (let option of options.rows) {
                    const count = await pool.query(
                        `SELECT COUNT(*) FROM response_answers 
                         WHERE question_id = $1 AND answer_text LIKE $2`,
                        [question.id, `%${option.option_text}%`]
                    );
                    option.count = parseInt(count.rows[0].count);
                }

                question.options = options.rows;
            }
        }

        const usersResult = await pool.query(
            `SELECT u.username, u.email, ur.completed_at 
             FROM user_responses ur 
             JOIN users u ON ur.user_id = u.id 
             WHERE ur.survey_id = $1 
             ORDER BY ur.completed_at DESC`,
            [surveyId]
        );

        res.json({
            survey,
            totalResponses: parseInt(totalResponses.rows[0].count),
            questions,
            users: usersResult.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const totalSurveys = await pool.query('SELECT COUNT(*) FROM surveys');
        const totalUsers = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['user']);
        const totalResponses = await pool.query('SELECT COUNT(*) FROM user_responses');

        const recentSurveys = await pool.query(
            `SELECT s.*, 
                    (SELECT COUNT(*) FROM user_responses WHERE survey_id = s.id) as response_count 
             FROM surveys s 
             ORDER BY s.created_at DESC 
             LIMIT 5`
        );

        res.json({
            totalSurveys: parseInt(totalSurveys.rows[0].count),
            totalUsers: parseInt(totalUsers.rows[0].count),
            totalResponses: parseInt(totalResponses.rows[0].count),
            recentSurveys: recentSurveys.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;