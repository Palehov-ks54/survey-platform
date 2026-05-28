import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import './CreateSurveyPage.css';

const CreateSurveyPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // ID опроса для редактирования
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchSurvey();
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchSurvey = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/surveys/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const survey = response.data;
      setTitle(survey.title);
      setDescription(survey.description || '');
      
      // Преобразуем вопросы для формы
      const formattedQuestions = survey.questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options ? q.options.map(opt => opt.option_text) : ['']
      }));
      
      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Ошибка загрузки опроса:', error);
      setError('Ошибка загрузки опроса');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = (type) => {
    const newQuestion = {
      id: Date.now(),
      question_text: '',
      question_type: type,
      options: type === 'single' || type === 'multiple' ? [''] : []
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const addOption = (questionId) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, options: [...q.options, ''] } : q
    ));
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? {
        ...q,
        options: q.options.map((opt, idx) => idx === optionIndex ? value : opt)
      } : q
    ));
  };

  const removeOption = (questionId, optionIndex) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? {
        ...q,
        options: q.options.filter((_, idx) => idx !== optionIndex)
      } : q
    ));
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || questions.length === 0) {
      setError('Заполните название и добавьте хотя бы один вопрос');
      return;
    }

    for (let question of questions) {
      if ((question.question_type === 'single' || question.question_type === 'multiple') && 
          question.options.filter(opt => opt.trim() !== '').length === 0) {
        setError('Добавьте варианты ответов для вопросов с выбором');
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      
      if (isEditing) {
        // Обновляем существующий опрос (только основные поля)
        await axios.put(`${API_URL}/surveys/${id}`, {
          title,
          description,
          is_active: true
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Удаляем старые вопросы и создаём новые
        await axios.delete(`${API_URL}/surveys/${id}/questions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Создаём новые вопросы
        await axios.post(`${API_URL}/surveys/${id}/questions`, {
          questions
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        navigate(`/survey/${id}/stats`);
      } else {
        // Создаём новый опрос
        const response = await axios.post(`${API_URL}/surveys`, {
          title,
          description,
          questions
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        navigate(`/survey/${response.data.survey.id}/stats`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при сохранении опроса');
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Загрузка опроса...</div></div>;
  }

  return (
    <div className="container">
      <div className="create-survey">
        <h2>{isEditing ? 'Редактирование опроса' : 'Создание опроса'}</h2>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Название опроса</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название опроса"
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">Описание</label>
            <textarea
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите цель опроса"
              rows="3"
            />
          </div>

          <div className="questions-section">
            <h4>Вопросы</h4>
            
            {questions.map((question, index) => (
              <div key={question.id} className="question-card">
                <div className="question-header">
                  <span>Вопрос {index + 1} ({question.question_type === 'text' ? 'Текстовый ответ' : 
                    question.question_type === 'single' ? 'Один вариант' : 
                    question.question_type === 'multiple' ? 'Несколько вариантов' : 
                    'Шкала 1-10'})</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removeQuestion(question.id)}
                  >
                    Удалить
                  </button>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Текст вопроса</label>
                  <input
                    type="text"
                    className="form-control"
                    value={question.question_text}
                    onChange={(e) => updateQuestion(question.id, 'question_text', e.target.value)}
                    placeholder="Введите вопрос"
                    required
                  />
                </div>

                {(question.question_type === 'single' || question.question_type === 'multiple') && (
                  <div className="options-section">
                    <label className="form-label">Варианты ответов</label>
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="input-group mb-2">
                        <input
                          type="text"
                          className="form-control"
                          value={option}
                          onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                          placeholder={`Вариант ${optIndex + 1}`}
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => removeOption(question.id, optIndex)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => addOption(question.id)}
                    >
                      + Добавить вариант
                    </button>
                  </div>
                )}

                {question.question_type === 'scale' && (
                  <div className="scale-info">
                    <p>Шкала оценки от 1 до 10</p>
                    <div className="scale-preview">
                      {[1,2,3,4,5,6,7,8,9,10].map(num => (
                        <div key={num} className="scale-number">{num}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {questions.length === 0 && (
              <div className="no-questions">
                <p>Добавьте вопросы для создания опроса</p>
              </div>
            )}
          </div>

          <div className="add-questions">
            <h5>Добавить вопрос:</h5>
            <div className="btn-group">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => addQuestion('text')}
              >
                📝 Текстовый ответ
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => addQuestion('single')}
              >
                ☝️ Один вариант
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => addQuestion('multiple')}
              >
                ☑️ Несколько вариантов
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => addQuestion('scale')}
              >
                📊 Шкала (1-10)
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg">
              {isEditing ? 'Сохранить изменения' : 'Создать опрос'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-lg"
              onClick={() => navigate(isEditing ? `/survey/${id}/stats` : '/my-surveys')}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSurveyPage;