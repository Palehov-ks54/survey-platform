import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';
import './MyResultsPage.css';

const MyResultsPage = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchMyResponses();
  }, []);

  const fetchMyResponses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/responses/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResponses(response.data);
    } catch (error) {
      console.error('Ошибка загрузки результатов:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (responseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/responses/${responseId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnswers(response.data);
      setSelectedResponse(responseId);
      setShowModal(true);
    } catch (error) {
      console.error('Ошибка загрузки ответов:', error);
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Загрузка результатов...</div></div>;
  }

  return (
    <div className="container">
      <h2 className="page-title">Мои пройденные опросы</h2>
      
      {responses.length === 0 ? (
        <div className="empty-state">
          <p>Вы еще не прошли ни одного опроса</p>
        </div>
      ) : (
        <div className="results-table-wrapper">
          <table className="table results-table">
            <thead>
              <tr>
                <th>Опрос</th>
                <th>Дата прохождения</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {responses.map(response => (
                <tr key={response.id}>
                  <td className="survey-title-cell">{response.survey_title}</td>
                  <td>{new Date(response.completed_at).toLocaleString('ru-RU')}</td>
                  <td><span className="completed-badge">✓ Пройден</span></td>
                  <td>
                    <button 
                      className="btn btn-sm btn-info"
                      onClick={() => viewDetails(response.id)}
                    >
                      Посмотреть ответы
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Мои ответы</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {answers.map((item, index) => (
                <div key={index} className="answer-block">
                  <div className="question-text">
                    <strong>Вопрос {index + 1}:</strong> {item.question_text}
                  </div>
                  <div className="answer-text">
                    <strong>Ваш ответ:</strong> {item.answer_text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyResultsPage;