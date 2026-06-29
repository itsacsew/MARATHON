import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard'; // ✅ ADD THIS
import './styles/App.css';

// Protected Route component
function PrivateRoute({ children, adminOnly = false, superAdminOnly = false }) {
  const { currentUser, userData, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (superAdminOnly && !userData?.isSuperAdmin) {
    return <Navigate to="/admin" />;
  }

  if (adminOnly && !userData?.isAdmin && !userData?.isSuperAdmin) {
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
  
  // Redirect based on user role - SUPER ADMIN FIRST
  if (userData?.isSuperAdmin) {
    return <Navigate to="/super-admin" />;
  } else if (userData?.isAdmin) {
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
      <Route path="/super-admin" element={
        <PrivateRoute superAdminOnly={true}>
          <SuperAdminDashboard />
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