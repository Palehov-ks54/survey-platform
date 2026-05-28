import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import './TakeSurveyPage.css';

const TakeSurveyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  useEffect(() => {
    checkCompletion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const checkCompletion = async () => {
    try {
      const token = localStorage.getItem('token');
      const checkResponse = await axios.get(`${API_URL}/responses/check/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (checkResponse.data.completed) {
        setAlreadyCompleted(true);
        setLoading(false);
        return;
      }

      fetchSurvey();
    } catch (error) {
      console.error('Ошибка:', error);
      setLoading(false);
    }
  };

  const fetchSurvey = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/surveys/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSurvey(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки опроса:', error);
      setLoading(false);
    }
  };

  const handleSingleChoice = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleMultipleChoice = (questionId, option) => {
    setAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      if (currentAnswers.includes(option)) {
        return {
          ...prev,
          [questionId]: currentAnswers.filter(item => item !== option)
        };
      } else {
        return {
          ...prev,
          [questionId]: [...currentAnswers, option]
        };
      }
    });
  };

  const handleTextAnswer = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formattedAnswers = Object.keys(answers).map(questionId => ({
        question_id: parseInt(questionId),
        answer_text: Array.isArray(answers[questionId]) 
          ? answers[questionId].join(', ') 
          : answers[questionId]
      }));

      await axios.post(`${API_URL}/responses/${id}`, {
        answers: formattedAnswers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Спасибо за прохождение опроса!');
      navigate('/surveys');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при отправке ответов');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container"><p>Загрузка опроса...</p></div>;
  }

  if (alreadyCompleted) {
    return (
      <div className="container">
        <div className="already-completed">
          <h3>Вы уже прошли этот опрос</h3>
          <p>Каждый пользователь может пройти опрос только один раз.</p>
          <button className="btn btn-primary" onClick={() => navigate('/surveys')}>
            Вернуться к списку опросов
          </button>
        </div>
      </div>
    );
  }

  if (!survey) {
    return <div className="container"><p>Опрос не найден</p></div>;
  }

  return (
    <div className="container">
      <div className="take-survey">
        <h2>{survey.title}</h2>
        <p className="survey-description">{survey.description}</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          {survey.questions.map((question, index) => (
            <div key={question.id} className="question-block">
              <h5>Вопрос {index + 1}: {question.question_text}</h5>

              {question.question_type === 'text' && (
                <textarea
                  className="form-control"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleTextAnswer(question.id, e.target.value)}
                  placeholder="Введите ваш ответ"
                  required
                  rows="3"
                />
              )}

              {question.question_type === 'single' && (
                <div className="options-list">
                  {question.options.map((option, optIndex) => (
                    <div key={option.id} className="form-check">
                      <input
                        type="radio"
                        className="form-check-input"
                        id={`q${question.id}_${optIndex}`}
                        name={`question_${question.id}`}
                        checked={answers[question.id] === option.option_text}
                        onChange={() => handleSingleChoice(question.id, option.option_text)}
                        required
                      />
                      <label className="form-check-label" htmlFor={`q${question.id}_${optIndex}`}>
                        {option.option_text}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {question.question_type === 'multiple' && (
                <div className="options-list">
                  {question.options.map((option, optIndex) => (
                    <div key={option.id} className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`q${question.id}_${optIndex}`}
                        checked={(answers[question.id] || []).includes(option.option_text)}
                        onChange={() => handleMultipleChoice(question.id, option.option_text)}
                      />
                      <label className="form-check-label" htmlFor={`q${question.id}_${optIndex}`}>
                        {option.option_text}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {question.question_type === 'scale' && (
                <div className="scale-input">
                  <p className="scale-label">Выберите значение от 1 до 10 (где 1 - минимальное, 10 - максимальное):</p>
                  <div className="scale-options">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <label key={num} className="scale-option-label">
                        <input
                          type="radio"
                          className="scale-radio"
                          name={`question_${question.id}`}
                          value={num}
                          checked={answers[question.id] === num.toString()}
                          onChange={() => handleSingleChoice(question.id, num.toString())}
                          required
                        />
                        <span className="scale-number">{num}</span>
                      </label>
                    ))}
                  </div>
                  <div className="scale-descriptions">
                    <span>1 - Минимум</span>
                    <span>10 - Максимум</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Отправка...' : 'Отправить ответы'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TakeSurveyPage;