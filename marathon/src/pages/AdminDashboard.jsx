import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { userData, logout, getAllUsers, getAllRegistrations } = useAuth(); // Removed unused 'currentUser'
  const [registrations, setRegistrations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('registrations');
  const navigate = useNavigate();

  // Wrap fetchAllData with useCallback to prevent unnecessary re-renders
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      const allRegistrations = await getAllRegistrations();
      setRegistrations(allRegistrations);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [getAllUsers, getAllRegistrations]);

  useEffect(() => {
    if (userData?.isAdmin) {
      fetchAllData();
    }
  }, [userData, fetchAllData]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleViewDetails = (registration) => {
    setSelectedRegistration(registration);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRegistration(null);
  };

  // Filter registrations
  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      reg.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || reg.categoryId === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Filter users
  const filteredUsers = users.filter(user => {
    return user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Get unique categories for filter
  const categories = [...new Set(registrations.map(reg => reg.categoryId))];

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>📊 Admin Dashboard</h1>
          <span className="registration-count">
            Total Users: {users.length} | Registrations: {registrations.length}
          </span>
        </div>
        <div className="admin-header-right">
          <button onClick={fetchAllData} className="refresh-btn">
            🔄 Refresh
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'registrations' ? 'active' : ''}`}
          onClick={() => setActiveTab('registrations')}
        >
          📝 Registrations ({registrations.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users ({users.length})
        </button>
      </div>

      <div className="admin-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder={activeTab === 'registrations' ? "Search by name, email, event..." : "Search users..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        {activeTab === 'registrations' && (
          <div className="filter-box">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'open' ? 'OPEN CATEGORY' : 
                   cat === 'masters' ? "40 UPPER'S/MASTER'S" : 
                   'LILOAN ONLY'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Rest of the component remains the same... */}
      {/* Registrations Table */}
      {activeTab === 'registrations' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Category</th>
                <th>Event</th>
                <th>Distance</th>
                <th>Fee</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan="11" className="no-data">
                    No registrations found
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((reg, index) => (
                  <tr key={reg.id || index}>
                    <td>{index + 1}</td>
                    <td className="name-cell">{reg.userName || 'N/A'}</td>
                    <td className="email-cell">{reg.userEmail || 'N/A'}</td>
                    <td>
                      <span className={`category-badge ${reg.categoryId}`}>
                        {reg.category || 'N/A'}
                      </span>
                    </td>
                    <td>{reg.eventName || 'N/A'}</td>
                    <td>{reg.distance || 'N/A'}</td>
                    <td className="fee-cell">₱{reg.fee?.toLocaleString() || '0'}</td>
                    <td>
                      <span className={`payment-badge ${reg.paymentMethod}`}>
                        {reg.paymentMethod?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${reg.status}`}>
                        {reg.status || 'N/A'}
                      </span>
                    </td>
                    <td className="date-cell">
                      {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <button 
                        className="view-btn"
                        onClick={() => handleViewDetails(reg)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Users Table */}
      {activeTab === 'users' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Registrations</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.uid || index}>
                    <td>{index + 1}</td>
                    <td className="name-cell">{user.displayName || 'N/A'}</td>
                    <td className="email-cell">{user.email || 'N/A'}</td>
                    <td>
                      <span className={`user-type-badge ${user.isAdmin ? 'admin' : 'user'}`}>
                        {user.isAdmin ? '👑 Admin' : '👤 User'}
                      </span>
                    </td>
                    <td>{user.registrationCount || 0}</td>
                    <td className="date-cell">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedRegistration && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>×</button>
            <h2>Registration Details</h2>
            
            <div className="detail-grid">
              <div className="detail-item">
                <label>Name</label>
                <span>{selectedRegistration.userName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Email</label>
                <span>{selectedRegistration.userEmail || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>User ID</label>
                <span className="small-text">{selectedRegistration.userId || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Category</label>
                <span>{selectedRegistration.category || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Category ID</label>
                <span>{selectedRegistration.categoryId || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Event</label>
                <span>{selectedRegistration.eventName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Event ID</label>
                <span>{selectedRegistration.eventId || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Distance</label>
                <span>{selectedRegistration.distance || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Fee</label>
                <span className="fee-amount">₱{selectedRegistration.fee?.toLocaleString() || '0'}</span>
              </div>
              <div className="detail-item">
                <label>Payment Method</label>
                <span className="payment-method-text">
                  {selectedRegistration.paymentMethod?.toUpperCase() || 'N/A'}
                </span>
              </div>
              <div className="detail-item">
                <label>Has Receipt</label>
                <span>{selectedRegistration.hasReceipt ? '✅ Yes' : '❌ No'}</span>
              </div>
              <div className="detail-item">
                <label>Receipt File</label>
                <span className="small-text">{selectedRegistration.receiptFileName || 'N/A'}</span>
              </div>
              <div className="detail-item full-width">
                <label>Receipt Preview</label>
                {selectedRegistration.receiptPreview ? (
                  <img 
                    src={selectedRegistration.receiptPreview} 
                    alt="Receipt" 
                    className="receipt-preview"
                  />
                ) : (
                  <span>No receipt uploaded</span>
                )}
              </div>
              <div className="detail-item">
                <label>Status</label>
                <span className={`status-badge ${selectedRegistration.status}`}>
                  {selectedRegistration.status || 'N/A'}
                </span>
              </div>
              <div className="detail-item">
                <label>Registration ID</label>
                <span className="small-text">{selectedRegistration.id || 'N/A'}</span>
              </div>
              <div className="detail-item full-width">
                <label>Registered At</label>
                <span>
                  {selectedRegistration.registeredAt ? 
                    new Date(selectedRegistration.registeredAt).toLocaleString() : 
                    'N/A'
                  }
                </span>
              </div>
            </div>

            <button className="modal-close-btn" onClick={handleCloseModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;