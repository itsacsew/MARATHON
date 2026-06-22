import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import './styles/App.css';

// Protected Route component
function PrivateRoute({ children, adminOnly = false }) {
  const { currentUser, userData, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !userData?.isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
}

// Root redirect based on user role
function RootRedirect() {
  const { currentUser, userData, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  // Redirect based on user role
  if (userData?.isAdmin) {
    return <Navigate to="/admin" />;
  } else {
    return <Navigate to="/dashboard" />;
  }
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/admin" element={
        <PrivateRoute adminOnly={true}>
          <AdminDashboard />
        </PrivateRoute>
      } />
      <Route path="/" element={<RootRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;