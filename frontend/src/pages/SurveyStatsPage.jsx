import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import API_URL from '../config';
import './SurveyStatsPage.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const SurveyStatsPage = () => {
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/stats/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Stats data:', response.data);
      setStats(response.data);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPieData = (question) => {
    if (!question.options || question.options.length === 0) return null;


    return {
      labels: question.options.map(opt => `${opt.option_text} (${opt.count || 0})`),
      datasets: [{
        data: question.options.map(opt => opt.count || 0),
        backgroundColor: [
          '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
          '#1abc9c', '#e67e22', '#34495e', '#95a5a6', '#d35400'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 10,
          font: {
            size: 12
          },
          boxWidth: 12
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Загрузка статистики...</div></div>;
  }

  if (!stats) {
    return <div className="container"><div className="empty-state">Статистика не найдена</div></div>;
  }

  return (
    <div className="container">
      <div className="stats-page">
        <div className="stats-header">
          <div>
            <h2>{stats.survey.title}</h2>
            <p className="stats-subtitle">Детальная статистика опроса</p>
          </div>
          <Link to="/admin" className="btn btn-secondary">← Назад</Link>
        </div>

        <div className="stats-summary">
          <div className="summary-card">
            <div className="summary-value">{stats.totalResponses}</div>
            <div className="summary-label">Всего ответов</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{stats.questions.length}</div>
            <div className="summary-label">Вопросов</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{stats.users.length}</div>
            <div className="summary-label">Участников</div>
          </div>
        </div>

        <div className="stats-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Обзор ответов
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Участники
          </button>
        </div>

        {activeTab === 'overview' && (
  <div className="questions-analysis">
    {stats.questions.map((question, index) => (
      <div key={question.id} className="question-analysis-card">
        <h4>Вопрос {index + 1}: {question.question_text}</h4>
        <span className="question-type">
          {question.question_type === 'text' ? 'Текстовый ответ' : 
           question.question_type === 'single' ? 'Один вариант' : 
           question.question_type === 'multiple' ? 'Несколько вариантов' : 
           question.question_type === 'scale' ? 'Шкала 1-10' : 'Другое'}
        </span>
        
        {question.question_type === 'text' && (
          <div className="text-responses">
            {question.answers?.length > 0 ? (
              question.answers.map((answer, idx) => (
                <div key={idx} className="response-item">
                  <div className="response-user">{answer.username}</div>
                  <div className="response-text">{answer.answer_text}</div>
                  <div className="response-date">
                    {new Date(answer.created_at).toLocaleString('ru-RU')}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">Нет ответов</p>
            )}
          </div>
        )}

        {question.question_type === 'scale' && (
          <div>
            <div className="scale-stats">
              <div className="scale-average">
                Средняя оценка: <strong>{question.average}</strong> / 10
              </div>
              <div className="scale-distribution">
                <h5>Распределение оценок:</h5>
                {Object.entries(question.distribution || {}).map(([value, count]) => (
                  <div key={value} className="scale-bar-row">
                    <span className="scale-value">{value}</span>
                    <div className="scale-bar-wrapper">
                      <div 
                        className="scale-bar" 
                        style={{
                          width: `${question.answers?.length > 0 ? (count / question.answers.length * 100) : 0}%`
                        }}
                      />
                    </div>
                    <span className="scale-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-responses" style={{marginTop: '20px'}}>
              <h5>Все ответы:</h5>
              {question.answers?.length > 0 ? (
                question.answers.map((answer, idx) => (
                  <div key={idx} className="response-item">
                    <div className="response-user">{answer.username}</div>
                    <div className="response-text">Оценка: {answer.answer_text}</div>
                    <div className="response-date">
                      {new Date(answer.created_at).toLocaleString('ru-RU')}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">Нет ответов</p>
              )}
            </div>
          </div>
        )}

        {(question.question_type === 'single' || question.question_type === 'multiple') && (
          <div>
            {getPieData(question) && question.options?.some(opt => opt.count > 0) ? (
              <div className="chart-container">
                <Pie data={getPieData(question)} options={pieOptions} />
              </div>
            ) : (
              <p className="no-data">Нет данных для отображения</p>
            )}
            
            <div className="options-stats-list">
              {question.options?.map((option, idx) => (
                <div key={idx} className="option-stat-row">
                  <span className="option-name">{option.option_text}</span>
                  <div className="option-bar-wrapper">
                    <div 
                      className="option-bar" 
                      style={{
                        width: `${stats.totalResponses > 0 ? (option.count / stats.totalResponses * 100) : 0}%`
                      }}
                    />
                  </div>
                  <span className="option-count">{option.count || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ))}
  </div>
)}

        {activeTab === 'users' && (
          <div className="users-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Email</th>
                  <th>Дата прохождения</th>
                </tr>
              </thead>
              <tbody>
                {stats.users.map((user, index) => (
                  <tr key={index}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{new Date(user.completed_at).toLocaleString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyStatsPage;