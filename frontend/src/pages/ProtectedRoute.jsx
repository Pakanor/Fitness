import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GATED_PREFIXES = ['/exercises', '/calorie-tracker'];

const isGatedRoute = (pathname) =>
  GATED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));

const ProtectedRoute = ({ children }) => {
  const { user, loading, hasMeasurements } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Block only the Exercises and Calories areas when measurements are missing.
  // Life Records, Profile and Dashboard remain accessible at all times.
  if (isGatedRoute(location.pathname) && !hasMeasurements) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
