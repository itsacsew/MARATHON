import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RegistrationForm from '../components/RegistrationForm';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { currentUser, userData, logout, getUserRegistrations } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (currentUser) {
        const userRegs = await getUserRegistrations(currentUser.uid);
        setRegistrations(userRegs);
      }
      setLoading(false);
    };

    fetchRegistrations();
  }, [currentUser, getUserRegistrations]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="user-info">
          <h2>Welcome, {userData?.displayName || currentUser.email}!</h2>
          <p>Email: {currentUser.email}</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <div className="dashboard-content">
        <RegistrationForm />
        
        {registrations.length > 0 && (
          <div className="registrations-history">
            <h3>Your Registrations</h3>
            <div className="registrations-list">
              {registrations.map((reg, index) => (
                <div key={reg.id || index} className="registration-item">
                  <p><strong>Event:</strong> {reg.eventName}</p>
                  <p><strong>Category:</strong> {reg.category}</p>
                  <p><strong>Distance:</strong> {reg.distance}</p>
                  <p><strong>Fee:</strong> ₱{reg.fee}</p>
                  <p><strong>Registered:</strong> {new Date(reg.registeredAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;