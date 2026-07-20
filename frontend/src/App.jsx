import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

// Guard for private routes
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100">
        <div className="w-8 h-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin mb-4"></div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Verifying session...</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

// Guard for login/register pages when already authenticated
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Silent load on public pages
  }

  return user ? <Navigate to="/dashboard" replace /> : children;
};

function MainApp() {
  // Dark mode defaults to true for that high-end midnight theme
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('eduai_theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('eduai_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('eduai_theme', 'light');
    }
  }, [darkMode]);

  return (
    <Routes>
      {/* Public Pages */}
      <Route 
        path="/" 
        element={<LandingPage darkMode={darkMode} setDarkMode={setDarkMode} />} 
      />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } 
      />

      {/* Protected Dashboard */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <DashboardPage darkMode={darkMode} setDarkMode={setDarkMode} />
          </PrivateRoute>
        } 
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
