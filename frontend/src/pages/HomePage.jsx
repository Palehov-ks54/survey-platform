import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import './HomePage.css';

const HomePage = ({ user }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  return (
    <div className="homepage">
      <section className="hero">
        <div className="container">
          <h1>Платформа для создания опросов</h1>
          <p className="hero-subtitle">
            Создавайте профессиональные опросы, собирайте ответы и анализируйте результаты в одном месте
          </p>
          {!user ? (
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Начать бесплатно
              </Link>
              <Link to="/login" className="btn btn-outline-light btn-lg">
                Уже есть аккаунт
              </Link>
            </div>
          ) : (
            <div className="hero-actions">
              {user.role === 'admin' ? (
                <Link to="/admin" className="btn btn-primary btn-lg">
                  Перейти в админ-панель
                </Link>
              ) : (
                <Link to="/survey" className="btn btn-primary btn-lg">
                  Перейти к опросам
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>Возможности платформы</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Разные типы вопросов</h3>
              <p>Текстовые ответы, выбор одного или нескольких вариантов, шкала оценки от 1 до 10</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Детальная статистика</h3>
              <p>Наглядные графики, диаграммы и таблицы для анализа результатов опросов</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Управление пользователями</h3>
              <p>Регистрация участников, отслеживание прохождений, управление доступом</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Гибкие настройки</h3>
              <p>Активация и деактивация опросов, редактирование в реальном времени</p>
            </div>
          </div>
        </div>
      </section>

      {user?.role === 'admin' && stats && (
        <section className="quick-stats">
          <div className="container">
            <h2>Общая статистика</h2>
            <div className="quick-stats-grid">
              <div className="quick-stat-card">
                <div className="quick-stat-value">{stats.totalSurveys}</div>
                <div className="quick-stat-label">Всего опросов</div>
              </div>
              <div className="quick-stat-card">
                <div className="quick-stat-value">{stats.totalUsers}</div>
                <div className="quick-stat-label">Пользователей</div>
              </div>
              <div className="quick-stat-card">
                <div className="quick-stat-value">{stats.totalResponses}</div>
                <div className="quick-stat-label">Пройдено опросов</div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="how-it-works">
        <div className="container">
          <h2>Как это работает</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Регистрация</h3>
              <p>Создайте аккаунт за пару минут</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Создание опроса</h3>
              <p>Добавьте вопросы и настройте параметры</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Сбор ответов</h3>
              <p>Пользователи проходят ваши опросы</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Анализ результатов</h3>
              <p>Просматривайте статистику и делайте выводы</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;