import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';
import './ProfilePage.css';

const ProfilePage = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/responses/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStats({
        totalSurveys: response.data.length,
        lastActivity: response.data.length > 0 ? response.data[0].completed_at : null,
        surveys: response.data
      });
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Загрузка профиля...</div></div>;
  }

  return (
    <div className="container">
      <div className="profile-page">
        <h2 className="profile-title">Профиль пользователя</h2>
        
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="profile-name">
              <h3>{user.username}</h3>
              <span className="profile-role">
                {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
              </span>
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-value">{user.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Дата регистрации</span>
              <span className="detail-value">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-stats">
          <h3>Статистика</h3>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-number">{stats?.totalSurveys || 0}</div>
              <div className="stat-text">Пройдено опросов</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">
                {stats?.surveys?.filter(s => {
                  const date = new Date(s.completed_at);
                  const now = new Date();
                  return (now - date) / (1000 * 60 * 60 * 24) <= 30;
                }).length || 0}
              </div>
              <div className="stat-text">За последние 30 дней</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">
                {stats?.lastActivity 
                  ? new Date(stats.lastActivity).toLocaleDateString('ru-RU')
                  : 'Нет'}
              </div>
              <div className="stat-text">Последняя активность</div>
            </div>
          </div>
        </div>

        {stats?.surveys?.length > 0 && (
          <div className="profile-history">
            <h3>История прохождений</h3>
            <div className="history-list">
              {stats.surveys.map((survey, index) => (
                <div key={index} className="history-item">
                  <span className="history-title">{survey.survey_title}</span>
                  <span className="history-date">
                    {new Date(survey.completed_at).toLocaleString('ru-RU')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;