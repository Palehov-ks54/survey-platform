import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import API_URL from '../config';
import './AdminPanelPage.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminPanelPage = () => {
  const [surveys, setSurveys] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const surveysPerPage = 5;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [surveysRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/surveys/all`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setSurveys(surveysRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот опрос?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/surveys/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Ошибка удаления опроса:', error);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const survey = surveys.find(s => s.id === id);
      await axios.put(`${API_URL}/surveys/${id}`, 
        { title: survey.title, description: survey.description, is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (error) {
      console.error('Ошибка изменения статуса:', error);
    }
  };

  const filteredSurveys = surveys.filter(survey =>
    survey.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastSurvey = currentPage * surveysPerPage;
  const indexOfFirstSurvey = indexOfLastSurvey - surveysPerPage;
  const currentSurveys = filteredSurveys.slice(indexOfFirstSurvey, indexOfLastSurvey);
  const totalPages = Math.ceil(filteredSurveys.length / surveysPerPage);

  const chartData = {
    labels: stats?.recentSurveys?.map(s => s.title.substring(0, 20)) || [],
    datasets: [
      {
        label: 'Количество прохождений',
        data: stats?.recentSurveys?.map(s => s.response_count) || [],
        backgroundColor: '#3498db',
        borderColor: '#2980b9',
        borderWidth: 1
      }
    ]
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h2>Панель управления</h2>
          <Link to="/admin/create-survey" className="btn btn-primary">
            + Новый опрос
          </Link>
          <Link to="/admin/users" className="btn btn-secondary">
  Пользователи
</Link>
        </div>

        {stats && (
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-value">{stats.totalSurveys}</div>
              <div className="stat-label">Всего опросов</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-label">Пользователей</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalResponses}</div>
              <div className="stat-label">Пройдено опросов</div>
            </div>
          </div>
        )}

        {stats?.recentSurveys?.length > 0 && (
          <div className="chart-container">
            <h3>Статистика прохождений</h3>
            <Bar data={chartData} options={{ responsive: true }} />
          </div>
        )}

        <div className="surveys-section">
          <div className="surveys-header">
            <h3>Все опросы</h3>
            <input
              type="text"
              className="form-control search-input"
              placeholder="Поиск опросов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {currentSurveys.length === 0 ? (
            <div className="empty-state">
              <p>Опросы не найдены</p>
            </div>
          ) : (
            <>
              <div className="surveys-grid">
                {currentSurveys.map(survey => (
                  <div key={survey.id} className="survey-card">
                    <div className="survey-card-header">
                      <h4>{survey.title}</h4>
                      <span className={`status-badge ${survey.is_active ? 'active' : 'inactive'}`}>
                        {survey.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </div>
                    <p className="survey-description">{survey.description || 'Нет описания'}</p>
                    <div className="survey-meta">
                      <span>Создан: {new Date(survey.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div className="survey-actions">
                      <Link to={`/survey/${survey.id}/stats`} className="btn btn-sm btn-info">
                        Статистика
                      </Link>
                      <Link to={`/admin/edit-survey/${survey.id}`} className="btn btn-sm btn-warning">
                        Изменить
                      </Link>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleToggleActive(survey.id, survey.is_active)}
                      >
                        {survey.is_active ? 'Скрыть' : 'Показать'}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(survey.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanelPage;