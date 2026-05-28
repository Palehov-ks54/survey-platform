const express = require('express');
const cors = require('cors');
require('dotenv').config();

const initDatabase = require('./database/init');
const authRoutes = require('./routes/auth');
const surveyRoutes = require('./routes/surveys');
const responseRoutes = require('./routes/responses');
const statsRoutes = require('./routes/stats');
const usersRoutes = require('./routes/users');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Инициализация БД
initDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', usersRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'API платформы опросов работает' });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});