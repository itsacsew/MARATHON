import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';

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
  const [sortBy, setSortBy] = useState('category');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptImageUrl, setReceiptImageUrl] = useState('');
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

  const handleReceiptClick = (imageUrl) => {
    setReceiptImageUrl(imageUrl);
    setShowReceiptModal(true);
  };

  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
    setReceiptImageUrl('');
  };

  // Download Excel File
  const handleDownloadExcel = () => {
    if (registrations.length === 0) {
      alert('No registrations to export!');
      return;
    }

    const groupedData = {};
    
    registrations.forEach(reg => {
      const category = reg.category || 'Unknown';
      const distance = reg.distance || 'Unknown';
      const key = `${category} - ${distance}`;
      
      if (!groupedData[key]) {
        groupedData[key] = {
          category: category,
          distance: distance,
          registrations: []
        };
      }
      groupedData[key].registrations.push(reg);
    });

    const excelRows = [];
    
    excelRows.push([
      'CATEGORY',
      'DISTANCE',
      'REFERENCE #',
      'NAME',
      'EMAIL',
      'GENDER',
      'EVENT',
      'FEE (₱)',
      'PAYMENT METHOD',
      'STATUS',
      'REGISTRATION DATE'
    ]);

    const categoryOrder = { 'open': 1, 'masters': 2, 'liloan': 3 };
    const sortedKeys = Object.keys(groupedData).sort((a, b) => {
      const catA = groupedData[a].category?.toLowerCase() || '';
      const catB = groupedData[b].category?.toLowerCase() || '';
      const orderA = categoryOrder[catA] || 99;
      const orderB = categoryOrder[catB] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.localeCompare(b);
    });

    sortedKeys.forEach(key => {
      const group = groupedData[key];
      const sortedRegs = [...group.registrations].sort((a, b) => {
        return (a.userName || '').localeCompare(b.userName || '');
      });
      
      sortedRegs.forEach(reg => {
        excelRows.push([
          group.category,
          group.distance,
          reg.referenceNumber || 'N/A',
          reg.userName || 'N/A',
          reg.userEmail || 'N/A',
          reg.gender || 'N/A',
          reg.eventName || 'N/A',
          reg.fee || 0,
          reg.paymentMethod?.toUpperCase() || 'N/A',
          reg.status || 'N/A',
          reg.registeredAt ? new Date(reg.registeredAt).toLocaleString('en-PH') : 'N/A'
        ]);
      });
    });

    excelRows.push([]);
    excelRows.push(['=== SUMMARY BY CATEGORY ===']);
    excelRows.push(['CATEGORY', 'TOTAL REGISTRATIONS', 'TOTAL FEE (₱)']);
    
    const categorySummary = {};
    registrations.forEach(reg => {
      const cat = reg.category || 'Unknown';
      if (!categorySummary[cat]) {
        categorySummary[cat] = { count: 0, totalFee: 0 };
      }
      categorySummary[cat].count++;
      categorySummary[cat].totalFee += (reg.fee || 0);
    });

    const sortedCategories = Object.keys(categorySummary).sort((a, b) => {
      const orderA = categoryOrder[a.toLowerCase()] || 99;
      const orderB = categoryOrder[b.toLowerCase()] || 99;
      return orderA - orderB;
    });

    sortedCategories.forEach(cat => {
      excelRows.push([
        cat,
        categorySummary[cat].count,
        categorySummary[cat].totalFee.toFixed(2)
      ]);
    });

    const grandTotal = registrations.reduce((sum, reg) => sum + (reg.fee || 0), 0);
    excelRows.push([]);
    excelRows.push(['GRAND TOTAL', registrations.length, grandTotal.toFixed(2)]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelRows);

    ws['!cols'] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
      { wch: 30 },
      { wch: 35 },
      { wch: 12 },
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 25 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Registrations');

    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10);
    const filename = `registrations_${dateStr}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  // Get distance order for sorting
  const getDistanceOrder = (distance) => {
    if (!distance) return 99;
    const distStr = distance.toString().toLowerCase();
    if (distStr.includes('3k') || distStr.includes('3 km')) return 1;
    if (distStr.includes('5k') || distStr.includes('5 km')) return 2;
    if (distStr.includes('10k') || distStr.includes('10 km')) return 3;
    if (distStr.includes('16k') || distStr.includes('16 km')) return 4;
    if (distStr.includes('21k') || distStr.includes('21 km')) return 5;
    if (distStr.includes('42k') || distStr.includes('42 km')) return 6;
    return 99;
  };

  // Sort registrations by category then by distance
  const sortRegistrationsByCategoryAndDistance = (registrationsList) => {
    const categoryOrder = {
      'open': 1,
      'masters': 2,
      'liloan': 3
    };
    
    return [...registrationsList].sort((a, b) => {
      const catA = categoryOrder[a.categoryId?.toLowerCase()] || 99;
      const catB = categoryOrder[b.categoryId?.toLowerCase()] || 99;
      
      if (catA !== catB) {
        return catA - catB;
      }
      
      const distA = getDistanceOrder(a.distance);
      const distB = getDistanceOrder(b.distance);
      
      if (sortOrder === 'asc') {
        return distA - distB;
      } else {
        return distB - distA;
      }
    });
  };

  // Filter and sort registrations
  const getFilteredAndSortedRegistrations = () => {
    const filtered = registrations.filter(reg => {
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

    return sortRegistrationsByCategoryAndDistance(filtered);
  };

  // Sort users
  const sortUsers = (usersList) => {
    return [...usersList].sort((a, b) => {
      const nameA = a.displayName?.toLowerCase() || '';
      const nameB = b.displayName?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });
  };

  // Filter and sort users
  const getFilteredAndSortedUsers = () => {
    const filtered = users.filter(user => {
      return user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    });
    return sortUsers(filtered);
  };

  // Get category counts with distance breakdown
  const getCategoryDetails = () => {
    const details = {
      open: { count: 0, distances: {} },
      masters: { count: 0, distances: {} },
      liloan: { count: 0, distances: {} }
    };
    
    registrations.forEach(reg => {
      const catId = reg.categoryId?.toLowerCase();
      if (catId === 'open' || catId === 'masters' || catId === 'liloan') {
        details[catId].count++;
        
        const dist = reg.distance || 'Unknown';
        if (!details[catId].distances[dist]) {
          details[catId].distances[dist] = 0;
        }
        details[catId].distances[dist]++;
      }
    });
    
    return details;
  };

  // Calculate total fee from all registrations
  const calculateTotalFee = () => {
    let total = 0;
    registrations.forEach(reg => {
      const fee = parseFloat(reg.fee);
      if (!isNaN(fee)) {
        total += fee;
      }
    });
    return total;
  };

  const categoryDetails = getCategoryDetails();
  const totalFeeOverall = calculateTotalFee();

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
    if (gender === 'Male') return '👨 Male';
    if (gender === 'Female') return '👩 Female';
    return gender || 'N/A';
  };

  // Get current page data
  const getCurrentPageData = (data) => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Reset to first page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterGender]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading data...</p>
      </div>
    );
  }

  // Get sorted data
  const filteredAndSortedRegistrations = getFilteredAndSortedRegistrations();
  const filteredAndSortedUsers = getFilteredAndSortedUsers();

  // Pagination calculations
  const totalRegistrations = filteredAndSortedRegistrations.length;
  const totalUsers = filteredAndSortedUsers.length;
  const totalPagesRegistrations = Math.ceil(totalRegistrations / rowsPerPage);
  const totalPagesUsers = Math.ceil(totalUsers / rowsPerPage);
  const currentPageData = activeTab === 'registrations' 
    ? getCurrentPageData(filteredAndSortedRegistrations)
    : getCurrentPageData(filteredAndSortedUsers);
  const totalPages = activeTab === 'registrations' ? totalPagesRegistrations : totalPagesUsers;

  // Pagination component
  const Pagination = ({ totalPages, currentPage, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Showing {((currentPage - 1) * rowsPerPage) + 1} - {Math.min(currentPage * rowsPerPage, activeTab === 'registrations' ? totalRegistrations : totalUsers)} of {activeTab === 'registrations' ? totalRegistrations : totalUsers}
        </div>
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ◀ Previous
          </button>
          {pageNumbers.map(number => (
            <button
              key={number}
              className={`pagination-btn ${number === currentPage ? 'active' : ''}`}
              onClick={() => handlePageChange(number)}
            >
              {number}
            </button>
          ))}
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next ▶
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-inner">
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
            <button onClick={handleDownloadExcel} className="excel-btn">
              📊 Download Excel File
            </button>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </header>

        {/* Category Summary Cards - same width as table */}
        <div className="category-summary-wrapper">
          <div className="category-summary">
            <div className="category-card open">
              <span className="category-icon">🏃</span>
              <div className="category-info">
                <span className="category-name">OPEN CATEGORY</span>
                <span className="category-count">{categoryDetails.open.count}</span>
                <div className="distance-breakdown">
                  {Object.entries(categoryDetails.open.distances).map(([dist, count]) => (
                    <span key={dist} className="distance-tag">
                      {dist}: {count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="category-card masters">
              <span className="category-icon">🏃</span>
              <div className="category-info">
                <span className="category-name">40 UPPER'S/MASTER'S</span>
                <span className="category-count">{categoryDetails.masters.count}</span>
                <div className="distance-breakdown">
                  {Object.entries(categoryDetails.masters.distances).map(([dist, count]) => (
                    <span key={dist} className="distance-tag">
                      {dist}: {count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="category-card liloan">
              <span className="category-icon">🏃</span>
              <div className="category-info">
                <span className="category-name">LILOAN ONLY</span>
                <span className="category-count">{categoryDetails.liloan.count}</span>
                <div className="distance-breakdown">
                  {Object.entries(categoryDetails.liloan.distances).map(([dist, count]) => (
                    <span key={dist} className="distance-tag">
                      {dist}: {count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="category-card total-fee">
              <span className="category-icon">💰</span>
              <div className="category-info">
                <span className="category-name">TOTAL COLLECTED</span>
                <span className="category-count fee-amount">₱{totalFeeOverall.toLocaleString()}</span>
                <span className="fee-subtext">from {registrations.length} registrations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and Search/Filter */}
        <div className="admin-top-bar">
          <div className="admin-tabs">
            <button 
              className={`tab-btn ${activeTab === 'registrations' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('registrations');
                setCurrentPage(1);
              }}
            >
              📝 Registrations ({registrations.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('users');
                setCurrentPage(1);
              }}
            >
              👥 Users ({users.length})
            </button>
          </div>

          <div className="admin-controls-wrapper">
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
                    <option value="all">ALL CATEGORIES</option>
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
                    <option value="all">ALL GENDER</option>
                    {genders.map(gender => (
                      <option key={gender} value={gender}>
                        {gender === 'Male' ? '👨 Male' : gender === 'Female' ? '👩 Female' : gender}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Table Container - same width as cards */}
        <div className="admin-table-container">
          <div className="admin-table-scroll-wrapper">
            <table className="admin-table">
              {activeTab === 'registrations' && (
                <>
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
                    {currentPageData.length === 0 ? (
                      <tr>
                        <td colSpan="13" className="no-data">
                          No registrations found
                        </td>
                      </tr>
                    ) : (
                      currentPageData.map((reg, index) => {
                        const realIndex = ((currentPage - 1) * rowsPerPage) + index + 1;
                        return (
                          <tr key={reg.id || index}>
                            <td>{realIndex}</td>
                            <td className="name-cell">{reg.userName || 'N/A'}</td>
                            <td className="email-cell">{reg.userEmail || 'N/A'}</td>
                            <td>
                              <span className={`gender-badge ${reg.gender}`}>
                                {reg.gender === 'Male' ? '👨 Male' : reg.gender === 'Female' ? '👩 Female' : 'N/A'}
                              </span>
                            </td>
                            <td>
                              <span className={`category-badge ${reg.categoryId}`}>
                                {reg.category || 'N/A'}
                              </span>
                            </td>
                            <td>{reg.eventName || 'N/A'}</td>
                            <td>
                              <span className="distance-badge">
                                {reg.distance || 'N/A'}
                              </span>
                            </td>
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
                        );
                      })
                    )}
                  </tbody>
                </>
              )}

              {activeTab === 'users' && (
                <>
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
                    {currentPageData.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="no-data">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      currentPageData.map((user, index) => {
                        const realIndex = ((currentPage - 1) * rowsPerPage) + index + 1;
                        const userRegCount = registrations.filter(r => r.userId === user.uid).length;
                        return (
                          <tr key={user.uid || index}>
                            <td>{realIndex}</td>
                            <td className="name-cell">{user.displayName || 'N/A'}</td>
                            <td className="email-cell">{user.email || 'N/A'}</td>
                            <td>
                              <span className={`user-type-badge ${user.isAdmin ? 'admin' : 'user'}`}>
                                {user.isAdmin ? '👑 Admin' : '👤 User'}
                              </span>
                            </td>
                            <td>{userRegCount}</td>
                            <td className="date-cell">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </>
              )}
            </table>
          </div>
          
          <Pagination 
            totalPages={totalPages} 
            currentPage={currentPage} 
            onPageChange={handlePageChange} 
          />
        </div>
      </div>

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
                  <div 
                    className="receipt-preview-container"
                    onClick={() => handleReceiptClick(selectedRegistration.receiptPreview)}
                  >
                    <img 
                      src={selectedRegistration.receiptPreview} 
                      alt="Receipt" 
                      className="receipt-preview"
                    />
                    <div className="receipt-click-hint">🔍 Click to enlarge</div>
                  </div>
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

      {/* Receipt Modal */}
      {showReceiptModal && receiptImageUrl && (
        <div className="modal-overlay receipt-modal-overlay" onClick={handleCloseReceiptModal}>
          <div className="modal-content receipt-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseReceiptModal}>×</button>
            <h2>📷 Receipt Preview</h2>
            <div className="receipt-full-container">
              <img 
                src={receiptImageUrl} 
                alt="Receipt Full View" 
                className="receipt-full-image"
              />
            </div>
            <button className="modal-close-btn" onClick={handleCloseReceiptModal}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* PDF Modal */}
      {showPdfModal && pdfRegistration && (
        <div className="modal-overlay" onClick={handleClosePdfModal}>
          <div className="modal-content pdf-preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleClosePdfModal}>×</button>
            <h2>📄 Download PDF</h2>
            <p className="pdf-preview-subtitle">Preview and download registration details as PDF</p>
            
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