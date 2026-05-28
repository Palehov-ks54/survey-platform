import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Платформа опросов</h4>
            <p>Современный инструмент для создания и проведения опросов любой сложности.</p>
          </div>
          
          <div className="footer-section">
            <h4>Навигация</h4>
            <ul className="footer-links">
              <li><Link to="/">Главная</Link></li>
              <li><Link to="/login">Войти</Link></li>
              <li><Link to="/register">Регистрация</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Возможности</h4>
            <ul className="footer-links">
              <li>Создание опросов</li>
              <li>Сбор статистики</li>
              <li>Анализ результатов</li>
              <li>Экспорт данных</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Контакты</h4>
            <ul className="footer-links">
              <li>Email: support@surveys.ru</li>
              <li>Телефон: +7 (999) 123-45-67</li>
              <li>Адрес: Рязанский просп., 8, стр. 1, Москва</li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2026 Платформа опросов. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;