import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';
import './UsersPage.css';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewUserStats = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/${userId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUser(response.data.user);
      setUserStats(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  const deleteUser = async (userId, username) => {
    if (!window.confirm(`Вы уверены, что хотите удалить пользователя "${username}"? Все его данные будут безвозвратно удалены.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
      alert('Ошибка при удалении пользователя');
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Загрузка...</div></div>;
  }

  return (
    <div className="container">
      <div className="users-page">
        <h2>Управление пользователями</h2>
        
        <div className="users-stats">
          <div className="total-users">
            Всего пользователей: <strong>{users.length}</strong>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="empty-state">Нет зарегистрированных пользователей</div>
        ) : (
          <div className="users-table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Email</th>
                  <th>Пройдено опросов</th>
                  <th>Дата регистрации</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.surveys_completed}</td>
                    <td>{new Date(user.created_at).toLocaleDateString('ru-RU')}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-info me-1"
                        onClick={() => viewUserStats(user.id)}
                      >
                        Статистика
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteUser(user.id, user.username)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && userStats && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Статистика пользователя: {selectedUser?.username}</h3>
                <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="user-info">
                  <p><strong>Email:</strong> {selectedUser?.email}</p>
                  <p><strong>Дата регистрации:</strong> {new Date(selectedUser?.created_at).toLocaleString('ru-RU')}</p>
                  <p><strong>Всего пройдено опросов:</strong> {userStats.totalCompleted}</p>
                </div>

                {userStats.completedSurveys.length > 0 && (
                  <div className="user-surveys">
                    <h4>Пройденные опросы:</h4>
                    {userStats.completedSurveys.map((survey, index) => (
                      <div key={index} className="survey-item">
                        <span>{survey.survey_title}</span>
                        <span className="survey-date">
                          {new Date(survey.completed_at).toLocaleString('ru-RU')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;