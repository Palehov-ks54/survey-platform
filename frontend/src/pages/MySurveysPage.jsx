import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import './MySurveysPage.css';

const MySurveysPage = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMySurveys();
  }, []);

  const fetchMySurveys = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/surveys/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSurveys(response.data);
    } catch (error) {
      console.error('Ошибка загрузки опросов:', error);
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
      fetchMySurveys();
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
      fetchMySurveys();
    } catch (error) {
      console.error('Ошибка изменения статуса:', error);
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Загрузка...</div></div>;
  }

  return (
    <div className="container">
      <div className="my-surveys">
        <div className="surveys-header">
          <h2>Мои опросы</h2>
          <Link to="/create-survey" className="btn btn-primary">
            + Создать опрос
          </Link>
        </div>

        {surveys.length === 0 ? (
          <div className="empty-state">
            <p>У вас пока нет созданных опросов</p>
            <Link to="/create-survey" className="btn btn-primary">
              Создать первый опрос
            </Link>
          </div>
        ) : (
          <div className="surveys-grid">
            {surveys.map(survey => (
              <div key={survey.id} className="survey-card">
                <div className="survey-card-header">
                  <h3>{survey.title}</h3>
                  <span className={`status-badge ${survey.is_active ? 'active' : 'inactive'}`}>
                    {survey.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
                <p className="survey-desc">{survey.description || 'Нет описания'}</p>
                <div className="survey-meta">
                  Создан: {new Date(survey.created_at).toLocaleDateString('ru-RU')}
                </div>
                <div className="survey-actions">
  <Link to={`/survey/${survey.id}/stats`} className="btn btn-sm btn-info">
    Статистика
  </Link>
  <Link to={`/edit-survey/${survey.id}`} className="btn btn-sm btn-warning">
    Редактировать
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
        )}
      </div>
    </div>
  );
};

export default MySurveysPage;