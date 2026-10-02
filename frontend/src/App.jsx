import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegisterForm from './pages/RegisterPage'; 
import CalorieTracer from './pages/CalorieTracer';
import VerifyPage from './pages/VerifyPage';
import HomePage from './pages/HomePage';
import ExerciseStartPage from './pages/ExerciseStartPage';
import DashboardPage from './pages/DashboardPage';
import RecordsPage from './pages/RecordsPage';
import ProfilePage from './pages/ProfilePage';
import LoginForm from './pages/LoginPage';
import ProtectedRoute from './pages/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import ExerciseHub from './features/exercises/ExerciseHub';
import Records1RMPage from './features/exercises/Records1RMPage';
import TrainingHistoryPage from './features/exercises/TrainingHistoryPage';


function App() {
  return (
    <Router>
      <AuthProvider>
      <ToastProvider />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/calorie-tracker" element={<ProtectedRoute><CalorieTracer /></ProtectedRoute>} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/exercises" element={<ProtectedRoute><ExerciseHub /></ProtectedRoute>} />
        <Route path="/exercises/records" element={<ProtectedRoute><Records1RMPage /></ProtectedRoute>} />
        <Route path="/exercises/history" element={<ProtectedRoute><TrainingHistoryPage /></ProtectedRoute>} />

        <Route path="/exercise-start" element={<ProtectedRoute><ExerciseStartPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/records" element={<ProtectedRoute><RecordsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;