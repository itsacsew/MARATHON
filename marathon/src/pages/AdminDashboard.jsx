import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';

const AdminDashboard = () => {
  const { userData, logout, getAllUsers, getAllRegistrations } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('registrations');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfRegistration, setPdfRegistration] = useState(null);
  const navigate = useNavigate();

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

  const handleDownloadPDF = (registration) => {
    setPdfRegistration(registration);
    setShowPdfModal(true);
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setPdfRegistration(null);
  };

  // Filter registrations
  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      reg.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || reg.categoryId === filterCategory;
    const matchesGender = filterGender === 'all' || reg.gender === filterGender;
    
    return matchesSearch && matchesCategory && matchesGender;
  });

  // Filter users
  const filteredUsers = users.filter(user => {
    return user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Get unique categories for filter
  const categories = [...new Set(registrations.map(reg => reg.categoryId))];
  const genders = [...new Set(registrations.map(reg => reg.gender))];

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get gender label
  const getGenderLabel = (gender) => {
    if (gender === 'men') return '👨 Male';
    if (gender === 'women') return '👩 Female';
    return gender || 'N/A';
  };

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
            placeholder={activeTab === 'registrations' ? "Search by name, email, event, reference #..." : "Search users..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        {activeTab === 'registrations' && (
          <>
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

            <div className="filter-box">
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Genders</option>
                {genders.map(gender => (
                  <option key={gender} value={gender}>
                    {gender === 'men' ? '👨 Men' : gender === 'women' ? '👩 Women' : gender}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Registrations Table - WITH Reference Number and PDF Button */}
      {activeTab === 'registrations' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Gender</th>
                <th>Category</th>
                <th>Event</th>
                <th>Distance</th>
                <th>Fee</th>
                <th>Reference #</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan="13" className="no-data">
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
                      <span className={`gender-badge ${reg.gender}`}>
                        {reg.gender === 'men' ? '👨 Men' : reg.gender === 'women' ? '👩 Women' : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className={`category-badge ${reg.categoryId}`}>
                        {reg.category || 'N/A'}
                      </span>
                    </td>
                    <td>{reg.eventName || 'N/A'}</td>
                    <td>{reg.distance || 'N/A'}</td>
                    <td className="fee-cell">₱{reg.fee?.toLocaleString() || '0'}</td>
                    <td>
                      <span className="reference-number-cell">
                        {reg.referenceNumber || 'N/A'}
                      </span>
                    </td>
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
                      <div className="action-buttons">
                        <button 
                          className="view-btn"
                          onClick={() => handleViewDetails(reg)}
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button 
                          className="pdf-btn"
                          onClick={() => handleDownloadPDF(reg)}
                          title="Download PDF"
                        >
                          📄
                        </button>
                      </div>
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
                <label>Gender</label>
                <span>{getGenderLabel(selectedRegistration.gender)}</span>
              </div>
              <div className="detail-item">
                <label>Reference Number</label>
                <span className="reference-number-text">
                  {selectedRegistration.referenceNumber || 'N/A'}
                </span>
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

            <div className="modal-actions">
              <button 
                className="pdf-btn-modal"
                onClick={() => {
                  handleCloseModal();
                  handleDownloadPDF(selectedRegistration);
                }}
              >
                📄 Download PDF
              </button>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Download Modal */}
      {showPdfModal && pdfRegistration && (
        <div className="modal-overlay" onClick={handleClosePdfModal}>
          <div className="modal-content pdf-preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleClosePdfModal}>×</button>
            <h2>📄 Download PDF</h2>
            <p className="pdf-preview-subtitle">Preview and download registration details as PDF</p>
            
            {/* PDF Content Preview */}
            <div className="pdf-preview-content">
              <div className="pdf-preview-header">
                <h3>🏃 Liloan Love the Life</h3>
                <h4>Registration Confirmation</h4>
                <div className="pdf-preview-divider"></div>
              </div>
              
              <div className="pdf-preview-body">
                <div className="pdf-preview-row">
                  <span className="pdf-preview-label">Name:</span>
                  <span className="pdf-preview-value">{pdfRegistration.userName || 'N/A'}</span>
                </div>
                <div className="pdf-preview-row">
                  <span className="pdf-preview-label">Gender:</span>
                  <span className="pdf-preview-value">{getGenderLabel(pdfRegistration.gender)}</span>
                </div>
                <div className="pdf-preview-row">
                  <span className="pdf-preview-label">Reference Number:</span>
                  <span className="pdf-preview-value reference-number-preview">{pdfRegistration.referenceNumber || 'N/A'}</span>
                </div>
                <div className="pdf-preview-row">
                  <span className="pdf-preview-label">Date of Payment:</span>
                  <span className="pdf-preview-value">{formatDate(pdfRegistration.registeredAt)}</span>
                </div>
                <div className="pdf-preview-divider"></div>
                <div className="pdf-preview-row">
                  <span className="pdf-preview-label">Event:</span>
                  <span className="pdf-preview-value">{pdfRegistration.eventName || 'N/A'}</span>
                </div>
                <div className="pdf-preview-row">
                  <span className="pdf-preview-label">Category:</span>
                  <span className="pdf-preview-value">{pdfRegistration.category || 'N/A'}</span>
                </div>
                <div className="pdf-preview-row">
                  <span className="pdf-preview-label">Distance:</span>
                  <span className="pdf-preview-value">{pdfRegistration.distance || 'N/A'}</span>
                </div>
                <div className="pdf-preview-row">
                  <span className="pdf-preview-label">Fee:</span>
                  <span className="pdf-preview-value fee-amount">₱{pdfRegistration.fee?.toLocaleString() || '0'}.00</span>
                </div>
                <div className="pdf-preview-row">
                  <span className="pdf-preview-label">Payment Method:</span>
                  <span className="pdf-preview-value">{pdfRegistration.paymentMethod?.toUpperCase() || 'N/A'}</span>
                </div>
                <div className="pdf-preview-divider"></div>
                <div className="pdf-preview-row">
                  <span className="pdf-preview-label">Status:</span>
                  <span className="pdf-preview-value status-completed">✅ COMPLETED</span>
                </div>
                <div className="pdf-preview-row">
                  <span className="pdf-preview-label">Registration ID:</span>
                  <span className="pdf-preview-value">{pdfRegistration.id || 'N/A'}</span>
                </div>
              </div>
              
              <div className="pdf-preview-footer">
                <p>Thank you for registering! 🏃</p>
                <p className="pdf-preview-footer-small">Liloan Love the Life • 2026</p>
              </div>
            </div>

            <div className="pdf-preview-actions">
              <button className="download-pdf-btn" onClick={() => {
                // Generate and download PDF
                const element = document.querySelector('.pdf-preview-content');
                const opt = {
                  margin:        [15, 15, 15, 15],
                  filename:     `registration-${pdfRegistration.referenceNumber || 'confirmation'}.pdf`,
                  image:        { type: 'jpeg', quality: 0.98 },
                  html2canvas:  { scale: 2, useCORS: true, logging: false },
                  jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                html2pdf().set(opt).from(element).save();
              }}>
                <span className="pdf-icon">⬇️</span>
                Download PDF
              </button>
              <button className="done-btn" onClick={handleClosePdfModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;