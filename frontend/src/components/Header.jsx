import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({ user, logout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container">
        <nav className="navbar">
          <Link to="/" className="logo">
            Платформа опросов
          </Link>
          
          <div className="nav-links">
            {user ? (
              <>
                <Link to="/surveys" className="nav-link">
                  Все опросы
                </Link>
                <Link to="/my-surveys" className="nav-link">
                  Мои опросы
                </Link>
                <Link to="/create-survey" className="nav-link">
                  Создать опрос
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="nav-link">
                    Админ-панель
                  </Link>
                )}
                <Link to="/my-results" className="nav-link">
                  Мои результаты
                </Link>
                <Link to="/profile" className="nav-link">
                  Профиль
                </Link>
                <button onClick={handleLogout} className="btn btn-outline-light">
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  Войти
                </Link>
                <Link to="/register" className="btn btn-light">
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;