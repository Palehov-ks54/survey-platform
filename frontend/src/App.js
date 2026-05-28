import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPanelPage from './pages/AdminPanelPage';
import CreateSurveyPage from './pages/CreateSurveyPage';
import TakeSurveyPage from './pages/TakeSurveyPage';
import SurveyStatsPage from './pages/SurveyStatsPage';
import MyResultsPage from './pages/MyResultsPage';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';
import SurveysListPage from './pages/SurveysListPage';
import MySurveysPage from './pages/MySurveysPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <div className="app">
        <Header user={user} logout={logout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage user={user} />} />
            <Route path="/login" element={!user ? <LoginPage setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <RegisterPage setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/admin" element={user?.role === 'admin' ? <AdminPanelPage /> : <Navigate to="/" />} />
            <Route path="/admin/create-survey" element={user?.role === 'admin' ? <CreateSurveyPage /> : <Navigate to="/" />} />
            <Route path="/admin/edit-survey/:id" element={user?.role === 'admin' ? <CreateSurveyPage /> : <Navigate to="/" />} />
            <Route path="/survey/:id" element={user ? <TakeSurveyPage /> : <Navigate to="/login" />} />
            <Route path="/survey/:id/stats" element={user ? <SurveyStatsPage /> : <Navigate to="/login" />} />
            <Route path="/my-results" element={user ? <MyResultsPage /> : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <ProfilePage user={user} /> : <Navigate to="/login" />} />
            <Route path="/admin/users" element={user?.role === 'admin' ? <UsersPage /> : <Navigate to="/" />} />
            <Route path="/surveys" element={user ? <SurveysListPage /> : <Navigate to="/login" />} />
            <Route path="/my-surveys" element={user ? <MySurveysPage /> : <Navigate to="/login" />} />
            <Route path="/create-survey" element={user ? <CreateSurveyPage /> : <Navigate to="/login" />} />
            <Route path="/edit-survey/:id" element={user ? <CreateSurveyPage /> : <Navigate to="/login" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;