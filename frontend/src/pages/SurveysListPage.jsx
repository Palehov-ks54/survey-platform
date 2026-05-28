import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import './SurveysListPage.css';

const SurveysListPage = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/surveys/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSurveys(response.data);
    } catch (error) {
      console.error('Ошибка загрузки опросов:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCreatorInfo = (survey) => {
    // Если admin_id = 1 (админ по умолчанию) или роль админа
    if (survey.admin_id === 1 || survey.creator_name === 'Администратор') {
      return 'Официальный опрос платформы';
    }
    return `Создал: ${survey.creator_name || 'Пользователь'}`;
  };

  const isOfficialSurvey = (survey) => {
    return survey.admin_id === 1 || survey.creator_name === 'Администратор';
  };

  const filteredSurveys = surveys.filter(survey =>
    survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (survey.description && survey.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="container"><div className="loading">Загрузка опросов...</div></div>;
  }

  return (
    <div className="container">
      <div className="surveys-list-page">
        <h2>Доступные опросы</h2>
        
        <div className="surveys-search">
          <input
            type="text"
            className="form-control"
            placeholder="Поиск опросов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredSurveys.length === 0 ? (
          <div className="empty-state">
            <p>Опросы не найдены</p>
          </div>
        ) : (
          <div className="surveys-grid">
            {filteredSurveys.map(survey => (
              <div key={survey.id} className={`survey-card ${isOfficialSurvey(survey) ? 'official' : ''}`}>
                {isOfficialSurvey(survey) && (
                  <div className="official-badge">Официальный</div>
                )}
                <div className="survey-card-body">
                  <h3>{survey.title}</h3>
                  <p className="survey-desc">{survey.description || 'Без описания'}</p>
                  <div className="survey-meta">
                    <div className="survey-creator">
                      {getCreatorInfo(survey)}
                    </div>
                    <div className="survey-date">
                      Создан: {new Date(survey.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
                <div className="survey-card-footer">
                  <Link to={`/survey/${survey.id}`} className="btn btn-primary w-100">
                    Пройти опрос
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveysListPage;