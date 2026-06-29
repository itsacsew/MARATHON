import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';

const SuperAdminDashboard = () => {
  const { userData, logout, getAllUsers, getAllRegistrations, deleteRegistration, deleteUser, updateRegistration } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('registrations');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfRegistration, setPdfRegistration] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptImageUrl, setReceiptImageUrl] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateNames, setDuplicateNames] = useState([]);
  const [hasDuplicates, setHasDuplicates] = useState(false);
  
  // ✅ NEW STATE FOR EDIT MODAL
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState(null);
  const [editFormData, setEditFormData] = useState({
    userName: '',
    userEmail: '',
    gender: '',
    category: '',
    categoryId: '',
    eventName: '',
    distance: '',
    shirtSize: '',
    fee: '',
    paymentMethod: '',
    status: '',
    referenceNumber: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // ✅ NEW STATE FOR DELETE CONFIRMATION
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState(''); // 'registration' or 'user'
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();

  // Check if user is Super Admin
  const isSuperAdmin = userData?.isSuperAdmin === true;

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      const allRegistrations = await getAllRegistrations();
      setRegistrations(allRegistrations);
      
      checkForDuplicates(allRegistrations);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [getAllUsers, getAllRegistrations]);

  const checkForDuplicates = (registrationsList) => {
    const nameMap = {};
    let hasDuplicate = false;

    registrationsList.forEach(reg => {
      const name = reg.userName?.trim()?.toLowerCase();
      if (name) {
        if (!nameMap[name]) {
          nameMap[name] = [];
        }
        nameMap[name].push(reg);
      }
    });

    Object.keys(nameMap).forEach(name => {
      if (nameMap[name].length > 1) {
        hasDuplicate = true;
      }
    });

    setHasDuplicates(hasDuplicate);
  };

  useEffect(() => {
    if (userData?.isSuperAdmin) {
      fetchAllData();
    } else if (userData?.isAdmin) {
      // If regular admin tries to access super admin, redirect
      navigate('/admin');
    }
  }, [userData, fetchAllData, navigate]);

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

  // ✅ NEW: Handle Edit
  const handleEditClick = (registration) => {
    setEditingRegistration(registration);
    setEditFormData({
      userName: registration.userName || '',
      userEmail: registration.userEmail || '',
      gender: registration.gender || '',
      category: registration.category || '',
      categoryId: registration.categoryId || '',
      eventName: registration.eventName || '',
      distance: registration.distance || '',
      shirtSize: registration.shirtSize || '',
      fee: registration.fee || '',
      paymentMethod: registration.paymentMethod || '',
      status: registration.status || '',
      referenceNumber: registration.referenceNumber || ''
    });
    setEditError('');
    setEditSuccess('');
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    try {
      // Validate required fields
      if (!editFormData.userName.trim()) {
        setEditError('Name is required');
        setEditLoading(false);
        return;
      }

      if (!editFormData.userEmail.trim()) {
        setEditError('Email is required');
        setEditLoading(false);
        return;
      }

      const updateData = {
        userName: editFormData.userName.trim(),
        userEmail: editFormData.userEmail.trim(),
        gender: editFormData.gender,
        category: editFormData.category,
        categoryId: editFormData.categoryId,
        eventName: editFormData.eventName,
        distance: editFormData.distance,
        shirtSize: editFormData.shirtSize,
        fee: parseFloat(editFormData.fee) || 0,
        paymentMethod: editFormData.paymentMethod,
        status: editFormData.status,
        referenceNumber: editFormData.referenceNumber
      };

      await updateRegistration(
        editingRegistration.userId,
        editingRegistration.id,
        updateData
      );

      setEditSuccess('✅ Registration updated successfully!');
      
      // Refresh data
      await fetchAllData();
      
      // Close modal after delay
      setTimeout(() => {
        setShowEditModal(false);
        setEditingRegistration(null);
        setEditSuccess('');
      }, 1500);

    } catch (error) {
      console.error('Error updating registration:', error);
      setEditError('Failed to update registration: ' + error.message);
    } finally {
      setEditLoading(false);
    }
  };

  // ✅ NEW: Handle Delete Registration
  const handleDeleteRegistration = (registration) => {
    setDeleteTarget(registration);
    setDeleteType('registration');
    setShowDeleteModal(true);
  };

  // ✅ NEW: Handle Delete User
  const handleDeleteUser = (user) => {
    setDeleteTarget(user);
    setDeleteType('user');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      if (deleteType === 'registration' && deleteTarget) {
        await deleteRegistration(deleteTarget.userId, deleteTarget.id);
        await fetchAllData();
        setShowDeleteModal(false);
        setDeleteTarget(null);
        // Show success message
        alert('✅ Registration deleted successfully!');
      } else if (deleteType === 'user' && deleteTarget) {
        await deleteUser(deleteTarget.uid);
        await fetchAllData();
        setShowDeleteModal(false);
        setDeleteTarget(null);
        alert('✅ User deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('❌ Failed to delete: ' + error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDetectClones = () => {
    if (!hasDuplicates) {
      return;
    }

    const nameMap = {};
    const duplicates = [];

    registrations.forEach(reg => {
      const name = reg.userName?.trim()?.toLowerCase();
      if (name) {
        if (!nameMap[name]) {
          nameMap[name] = [];
        }
        nameMap[name].push(reg);
      }
    });

    Object.keys(nameMap).forEach(name => {
      if (nameMap[name].length > 1) {
        duplicates.push({
          name: nameMap[name][0].userName,
          count: nameMap[name].length,
          registrations: nameMap[name]
        });
      }
    });

    if (duplicates.length === 0) {
      return;
    }

    setDuplicateNames(duplicates);
    setShowDuplicateModal(true);
  };

  const getLocalDateString = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  };

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
      'TSHIRT SIZE',
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
          reg.shirtSize || 'N/A',
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

  const sortRegistrationsByDate = (registrationsList) => {
    return [...registrationsList].sort((a, b) => {
      const dateA = a.registeredAt ? new Date(a.registeredAt).getTime() : 0;
      const dateB = b.registeredAt ? new Date(b.registeredAt).getTime() : 0;
      
      if (sortOrder === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  };

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

  const getUniqueDates = () => {
    const dates = new Set();
    registrations.forEach(reg => {
      if (reg.registeredAt) {
        const dateStr = getLocalDateString(reg.registeredAt);
        if (dateStr) {
          dates.add(dateStr);
        }
      }
    });
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  };

  const getFilteredAndSortedRegistrations = () => {
    const filtered = registrations.filter(reg => {
      const matchesSearch = 
        reg.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.shirtSize?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || reg.categoryId === filterCategory;
      const matchesGender = filterGender === 'all' || reg.gender === filterGender;
      
      let matchesDate = true;
      if (filterDate !== 'all') {
        if (reg.registeredAt) {
          const regDateStr = getLocalDateString(reg.registeredAt);
          matchesDate = regDateStr === filterDate;
        } else {
          matchesDate = false;
        }
      }
      
      return matchesSearch && matchesCategory && matchesGender && matchesDate;
    });

    if (sortBy === 'date') {
      return sortRegistrationsByDate(filtered);
    } else {
      return sortRegistrationsByCategoryAndDistance(filtered);
    }
  };

  const sortUsers = (usersList) => {
    return [...usersList].sort((a, b) => {
      const nameA = a.displayName?.toLowerCase() || '';
      const nameB = b.displayName?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });
  };

  const getFilteredAndSortedUsers = () => {
    const filtered = users.filter(user => {
      return user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    });
    return sortUsers(filtered);
  };

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

  const categories = [...new Set(registrations.map(reg => reg.categoryId))];
  const genders = [...new Set(registrations.map(reg => reg.gender))];
  const uniqueDates = getUniqueDates();

  const getGenderLabel = (gender) => {
    if (gender === 'Male') return '👨 Male';
    if (gender === 'Female') return '👩 Female';
    return gender || 'N/A';
  };

  const getCurrentPageData = (data) => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterGender, filterDate]);

  const toggleSort = () => {
    if (sortBy === 'date') {
      setSortBy('category');
      setSortOrder('asc');
    } else {
      setSortBy('date');
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading data...</p>
      </div>
    );
  }

  // Redirect if not super admin
  if (!isSuperAdmin) {
    return (
      <div className="loading-screen">
        <p>⛔ Access Denied. Super Admin only.</p>
        <button onClick={handleLogout} className="logout-btn">Go Back</button>
      </div>
    );
  }

  const filteredAndSortedRegistrations = getFilteredAndSortedRegistrations();
  const filteredAndSortedUsers = getFilteredAndSortedUsers();

  const totalRegistrations = filteredAndSortedRegistrations.length;
  const totalUsers = filteredAndSortedUsers.length;
  const totalPagesRegistrations = Math.ceil(totalRegistrations / rowsPerPage);
  const totalPagesUsers = Math.ceil(totalUsers / rowsPerPage);
  const currentPageData = activeTab === 'registrations' 
    ? getCurrentPageData(filteredAndSortedRegistrations)
    : getCurrentPageData(filteredAndSortedUsers);
  const totalPages = activeTab === 'registrations' ? totalPagesRegistrations : totalPagesUsers;

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
    <div className="admin-dashboard super-admin-dashboard">
      <div className="admin-dashboard-inner">
        <header className="admin-header super-admin-header">
          <div className="admin-header-left">
            <h1>👑 Super Dashboard</h1>
            <span className="registration-count">
              👥 Users: {users.length} | 📝 Registrations: {registrations.length}
            </span>
            <span className="super-admin-badge">⭐</span>
          </div>
          <div className="admin-header-right">
            <button 
              onClick={handleDetectClones} 
              className={`clone-btn ${!hasDuplicates ? 'disabled' : ''}`}
              disabled={!hasDuplicates}
              title={!hasDuplicates ? 'No duplicate names found' : 'Click to view duplicate registrations'}
            >
              🔍 Detect Clones {hasDuplicates && `(${duplicateNames.length})`}
            </button>
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
                placeholder={activeTab === 'registrations' ? "Search by name, email, event, reference #, shirt size..." : "Search users..."}
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

                <div className="filter-box">
                  <select
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">📅 ALL DATES</option>
                    {uniqueDates.map(date => {
                      const [year, month, day] = date.split('-');
                      const displayDate = new Date(year, month - 1, day).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });
                      return (
                        <option key={date} value={date}>
                          {displayDate}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

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
                      <th>Shirt Size</th>
                      <th>Fee</th>
                      <th>Reference #</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th className="sortable-header">
                        Date 
                        {sortBy === 'date' && (
                          <span className="sort-indicator">
                            {sortOrder === 'asc' ? ' ⬆️' : ' ⬇️'}
                          </span>
                        )}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPageData.length === 0 ? (
                      <tr>
                        <td colSpan="14" className="no-data">
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
                            <td>
                              <span className="shirt-size-badge">
                                {reg.shirtSize || 'N/A'}
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
                              {reg.registeredAt ? formatDisplayDate(reg.registeredAt) : 'N/A'}
                            </td>
                            <td>
                              <div className="action-buttons super-admin-actions">
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
                                <button 
                                  className="edit-btn-action"
                                  onClick={() => handleEditClick(reg)}
                                  title="Edit Registration"
                                >
                                  ✏️
                                </button>
                                <button 
                                  className="delete-btn-action"
                                  onClick={() => handleDeleteRegistration(reg)}
                                  title="Delete Registration"
                                >
                                  🗑️
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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPageData.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="no-data">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      currentPageData.map((user, index) => {
                        const realIndex = ((currentPage - 1) * rowsPerPage) + index + 1;
                        const userRegCount = registrations.filter(r => r.userId === user.uid).length;
                        const isSuperAdmin = user.isSuperAdmin === true;
                        const isCurrentUser = user.uid === userData?.uid;
                        return (
                          <tr key={user.uid || index}>
                            <td>{realIndex}</td>
                            <td className="name-cell">
                              {user.displayName || 'N/A'}
                              {isSuperAdmin && <span className="super-admin-tag">⭐</span>}
                            </td>
                            <td className="email-cell">{user.email || 'N/A'}</td>
                            <td>
                              <span className={`user-type-badge ${isSuperAdmin ? 'super-admin' : user.isAdmin ? 'admin' : 'user'}`}>
                                {isSuperAdmin ? '👑 Super Admin' : user.isAdmin ? '👤 Admin' : '👤 User'}
                              </span>
                            </td>
                            <td>{userRegCount}</td>
                            <td className="date-cell">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td>
                              <div className="action-buttons super-admin-actions">
                                {!isCurrentUser && !isSuperAdmin && (
                                  <button 
                                    className="delete-btn-action"
                                    onClick={() => handleDeleteUser(user)}
                                    title="Delete User"
                                  >
                                    🗑️
                                  </button>
                                )}
                                {isSuperAdmin && (
                                  <span className="protected-badge">🔒 Protected</span>
                                )}
                                {isCurrentUser && (
                                  <span className="current-user-badge">You</span>
                                )}
                              </div>
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
                <label>Shirt Size</label>
                <span className="shirt-size-text">
                  {selectedRegistration.shirtSize || 'N/A'}
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
              <button 
                className="edit-btn-modal"
                onClick={() => {
                  handleCloseModal();
                  handleEditClick(selectedRegistration);
                }}
              >
                ✏️ Edit
              </button>
              <button 
                className="delete-btn-modal"
                onClick={() => {
                  handleCloseModal();
                  handleDeleteRegistration(selectedRegistration);
                }}
              >
                🗑️ Delete
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
                  <span className="pdf-preview-label">Shirt Size:</span>
                  <span className="pdf-preview-value">{pdfRegistration.shirtSize || 'N/A'}</span>
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

      {/* Duplicate/Clone Detection Modal */}
      {showDuplicateModal && (
        <div className="modal-overlay" onClick={() => setShowDuplicateModal(false)}>
          <div className="modal-content duplicate-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDuplicateModal(false)}>×</button>
            <h2>⚠️ Duplicate/Clone Registrations Detected</h2>
            <p className="duplicate-subtitle">
              Found <strong>{duplicateNames.length}</strong> name(s) with multiple registrations:
            </p>
            
            <div className="duplicate-list">
              {duplicateNames.map((dup, idx) => (
                <div key={idx} className="duplicate-group">
                  <div className="duplicate-header">
                    <span className="duplicate-name">👤 {dup.name}</span>
                    <span className="duplicate-count">📝 {dup.count} registrations</span>
                  </div>
                  <div className="duplicate-registrations">
                    {dup.registrations.map((reg, regIdx) => (
                      <div key={regIdx} className="duplicate-reg-item">
                        <span className="reg-index">#{regIdx + 1}</span>
                        <span className="reg-detail">📧 {reg.userEmail || 'N/A'}</span>
                        <span className="reg-detail">🏷️ {reg.category || 'N/A'}</span>
                        <span className="reg-detail">📏 {reg.distance || 'N/A'}</span>
                        <span className="reg-detail">👕 {reg.shirtSize || 'N/A'}</span>
                        <span className="reg-detail">💰 ₱{reg.fee?.toLocaleString() || '0'}</span>
                        <span className="reg-detail">📅 {formatDisplayDate(reg.registeredAt)}</span>
                        <span className="reg-detail ref-number">🔢 {reg.referenceNumber || 'N/A'}</span>
                        <button 
                          className="view-reg-btn"
                          onClick={() => {
                            setShowDuplicateModal(false);
                            handleViewDetails(reg);
                          }}
                          title="View Registration Details"
                        >
                          👁️ View
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="duplicate-divider"></div>
                </div>
              ))}
            </div>

            <div className="duplicate-summary">
              <p>Total duplicate registrations: <strong>{duplicateNames.reduce((acc, dup) => acc + dup.count, 0)}</strong></p>
            </div>

            <div className="modal-actions">
              <button className="modal-close-btn" onClick={() => setShowDuplicateModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ EDIT MODAL */}
      {showEditModal && editingRegistration && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            <h2>✏️ Edit Registration</h2>
            <p className="edit-subtitle">Editing registration for <strong>{editingRegistration.userName}</strong></p>
            
            {editError && <div className="error-message-modal">{editError}</div>}
            {editSuccess && <div className="success-message-modal">{editSuccess}</div>}
            
            <form onSubmit={handleEditSubmit}>
              <div className="edit-form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="userName"
                    value={editFormData.userName}
                    onChange={handleEditInputChange}
                    className="edit-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="userEmail"
                    value={editFormData.userEmail}
                    onChange={handleEditInputChange}
                    className="edit-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={editFormData.gender}
                    onChange={handleEditInputChange}
                    className="edit-select"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Shirt Size</label>
                  <select
                    name="shirtSize"
                    value={editFormData.shirtSize}
                    onChange={handleEditInputChange}
                    className="edit-select"
                  >
                    <option value="">Select Size</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Category</label>
                  <select
                    name="categoryId"
                    value={editFormData.categoryId}
                    onChange={handleEditInputChange}
                    className="edit-select"
                  >
                    <option value="">Select Category</option>
                    <option value="open">Open Category</option>
                    <option value="masters">40 Upper's/Master's</option>
                    <option value="liloan">Liloan Only</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Distance</label>
                  <input
                    type="text"
                    name="distance"
                    value={editFormData.distance}
                    onChange={handleEditInputChange}
                    className="edit-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Fee (₱)</label>
                  <input
                    type="number"
                    name="fee"
                    value={editFormData.fee}
                    onChange={handleEditInputChange}
                    className="edit-input"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={editFormData.paymentMethod}
                    onChange={handleEditInputChange}
                    className="edit-select"
                  >
                    <option value="">Select Payment</option>
                    <option value="landbank">Landbank</option>
                    <option value="maya">Maya</option>
                    <option value="gcash">GCash</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditInputChange}
                    className="edit-select"
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Reference Number</label>
                  <input
                    type="text"
                    name="referenceNumber"
                    value={editFormData.referenceNumber}
                    onChange={handleEditInputChange}
                    className="edit-input"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Event Name</label>
                  <input
                    type="text"
                    name="eventName"
                    value={editFormData.eventName}
                    onChange={handleEditInputChange}
                    className="edit-input"
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="save-edit-btn"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button 
                  type="button" 
                  className="modal-close-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ DELETE CONFIRMATION MODAL */}
      {showDeleteModal && deleteTarget && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            <h2>⚠️ Confirm Deletion</h2>
            
            {deleteType === 'registration' && (
              <>
                <p>Are you sure you want to delete this registration?</p>
                <div className="delete-info">
                  <p><strong>Name:</strong> {deleteTarget.userName}</p>
                  <p><strong>Email:</strong> {deleteTarget.userEmail}</p>
                  <p><strong>Reference:</strong> {deleteTarget.referenceNumber}</p>
                </div>
                <p className="delete-warning">⚠️ This action cannot be undone!</p>
              </>
            )}
            
            {deleteType === 'user' && (
              <>
                <p>Are you sure you want to delete this user?</p>
                <div className="delete-info">
                  <p><strong>Name:</strong> {deleteTarget.displayName}</p>
                  <p><strong>Email:</strong> {deleteTarget.email}</p>
                  <p><strong>Registrations:</strong> {deleteTarget.registrationCount || 0}</p>
                </div>
                <p className="delete-warning">⚠️ This will permanently delete the user and all their data!</p>
              </>
            )}
            
            <div className="modal-actions">
              <button 
                className="confirm-delete-btn"
                onClick={confirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : '🗑️ Yes, Delete'}
              </button>
              <button 
                className="modal-close-btn"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;