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
  const [filterDistance, setFilterDistance] = useState('all');
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
  const [receiptImages, setReceiptImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateNames, setDuplicateNames] = useState([]);
  const [hasDuplicates, setHasDuplicates] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const navigate = useNavigate();

  // ✅ Helper function to get receipt count from registration
  const getReceiptCount = (registration) => {
    if (!registration) return 0;
    
    if (registration.receiptPreviews && Array.isArray(registration.receiptPreviews)) {
      return registration.receiptPreviews.filter(img => img).length;
    }
    if (registration.receiptUrls && Array.isArray(registration.receiptUrls)) {
      return registration.receiptUrls.filter(img => img).length;
    }
    if (registration.receiptImages && Array.isArray(registration.receiptImages)) {
      return registration.receiptImages.filter(img => img).length;
    }
    if (registration.receipts && typeof registration.receipts === 'object') {
      return Object.values(registration.receipts).filter(img => img).length;
    }
    if (registration.receiptPreview && typeof registration.receiptPreview === 'string') {
      return 1;
    }
    if (registration.receiptUrl && typeof registration.receiptUrl === 'string') {
      return 1;
    }
    if (registration.receiptFileName && typeof registration.receiptFileName === 'string') {
      return 1;
    }
    
    return 0;
  };

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

  // ✅ Get receipt images from registration (supports multiple formats)
  const getReceiptImages = (registration) => {
    if (!registration) return [];
    
    if (registration.receiptPreviews && Array.isArray(registration.receiptPreviews) && registration.receiptPreviews.length > 0) {
      return registration.receiptPreviews.filter(img => img);
    }
    if (registration.receiptUrls && Array.isArray(registration.receiptUrls)) {
      return registration.receiptUrls.filter(img => img);
    }
    if (registration.receiptImages && Array.isArray(registration.receiptImages)) {
      return registration.receiptImages.filter(img => img);
    }
    if (registration.receipts && typeof registration.receipts === 'object') {
      return Object.values(registration.receipts).filter(img => img);
    }
    if (registration.receiptPreview && typeof registration.receiptPreview === 'string') {
      return [registration.receiptPreview];
    }
    if (registration.receiptUrl && typeof registration.receiptUrl === 'string') {
      return [registration.receiptUrl];
    }
    if (registration.receiptFileName && typeof registration.receiptFileName === 'string') {
      return [registration.receiptFileName];
    }
    
    return [];
  };

  const handleReceiptClick = (images) => {
    let imageArray = [];
    if (Array.isArray(images)) {
      imageArray = images.filter(img => img);
    } else if (typeof images === 'string') {
      imageArray = [images];
    } else if (images && typeof images === 'object') {
      imageArray = Object.values(images).filter(img => img);
    }
    
    if (imageArray.length === 0 && selectedRegistration) {
      imageArray = getReceiptImages(selectedRegistration);
    }
    
    if (imageArray.length === 0 && selectedRegistration?.receiptPreview) {
      imageArray = [selectedRegistration.receiptPreview];
    }
    
    if (imageArray.length === 0) {
      alert('No receipt image found.');
      return;
    }
    
    setReceiptImages(imageArray);
    setCurrentImageIndex(0);
    setShowReceiptModal(true);
  };

  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
    setReceiptImages([]);
    setCurrentImageIndex(0);
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? receiptImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === receiptImages.length - 1 ? 0 : prev + 1
    );
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
      'ADDRESS',
      'GENDER',
      'TSHIRT SIZE',
      'EVENT',
      'FEE (₱)',
      'PAYMENT METHOD',
      'STATUS',
      'REGISTRATION DATE',
      'NO. OF RECEIPTS'
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
          reg.homeAddress || 'N/A',
          reg.gender || 'N/A',
          reg.shirtSize || 'N/A',
          reg.eventName || 'N/A',
          reg.fee || 0,
          reg.paymentMethod?.toUpperCase() || 'N/A',
          reg.status || 'N/A',
          reg.registeredAt ? new Date(reg.registeredAt).toLocaleString('en-PH') : 'N/A',
          getReceiptCount(reg)
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
      { wch: 40 },
      { wch: 12 },
      { wch: 12 },
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 25 },
      { wch: 15 }
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
    if (distStr.includes('6k') || distStr.includes('6 km')) return 3;
    if (distStr.includes('10k') || distStr.includes('10 km')) return 4;
    if (distStr.includes('16k') || distStr.includes('16 km')) return 5;
    if (distStr.includes('21k') || distStr.includes('21 km')) return 6;
    if (distStr.includes('42k') || distStr.includes('42 km')) return 7;
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

  // ✅ Get grouped filter options by category
  const getGroupedFilterOptions = () => {
    const categoryMap = {
      'open': { label: 'OPEN CATEGORY', distances: new Set(), icon: '📁' },
      'masters': { label: "40 UPPER'S/MASTER'S", distances: new Set(), icon: '📁' },
      'liloan': { label: 'LILOAN ONLY', distances: new Set(), icon: '📁' }
    };

    registrations.forEach(reg => {
      const catId = reg.categoryId?.toLowerCase();
      if (catId && categoryMap[catId]) {
        if (reg.distance) {
          categoryMap[catId].distances.add(reg.distance);
        }
      }
    });

    // Sort distances for each category
    Object.keys(categoryMap).forEach(key => {
      categoryMap[key].distances = Array.from(categoryMap[key].distances).sort((a, b) => {
        return getDistanceOrder(a) - getDistanceOrder(b);
      });
    });

    return categoryMap;
  };

  const getFilteredAndSortedRegistrations = () => {
    const filtered = registrations.filter(reg => {
      const matchesSearch = 
        reg.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.shirtSize?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.homeAddress?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // ✅ Filter by category + distance
      let matchesCategoryAndDistance = true;
      if (filterCategory !== 'all') {
        // Check if filter includes distance (format: categoryId-distance)
        if (filterCategory.includes('-')) {
          const [catId, distance] = filterCategory.split('-');
          const regCatId = reg.categoryId?.toLowerCase();
          const regDistance = reg.distance;
          matchesCategoryAndDistance = regCatId === catId && regDistance === distance;
        } else {
          // Filter by category only
          matchesCategoryAndDistance = reg.categoryId?.toLowerCase() === filterCategory;
        }
      }

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
      
      return matchesSearch && matchesCategoryAndDistance && matchesGender && matchesDate;
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

  // ✅ Get display label for selected filter
  const getSelectedFilterLabel = () => {
    if (filterCategory === 'all') return '📋 ALL CATEGORIES';
    
    const groupedOptions = getGroupedFilterOptions();
    if (filterCategory.includes('-')) {
      const [catId, distance] = filterCategory.split('-');
      const catLabel = groupedOptions[catId]?.label || catId;
      return `${catLabel} → ${distance}`;
    }
    
    const catLabel = groupedOptions[filterCategory]?.label || filterCategory;
    return catLabel;
  };

  // ✅ Handle filter selection
  const handleFilterSelect = (value) => {
    setFilterCategory(value);
    setShowDropdown(false);
    setCurrentPage(1);
  };

  // ✅ Toggle category expansion
  const toggleCategory = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.custom-dropdown')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading data...</p>
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

  // ✅ Grouped filter options
  const groupedOptions = getGroupedFilterOptions();

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
                placeholder={activeTab === 'registrations' ? "Search by name, email, address, event, reference #, shirt size..." : "Search users..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>

            {activeTab === 'registrations' && (
              <>
                {/* ✅ Drupal-Style Grouped Dropdown */}
                <div className="custom-dropdown">
                  <button 
                    className="dropdown-trigger"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <span className="dropdown-label">{getSelectedFilterLabel()}</span>
                    <span className="dropdown-arrow">{showDropdown ? '▲' : '▼'}</span>
                  </button>
                  
                  {showDropdown && (
                    <div className="dropdown-menu">
                      {/* All Categories option */}
                      <div 
                        className={`dropdown-item all-categories ${filterCategory === 'all' ? 'active' : ''}`}
                        onClick={() => handleFilterSelect('all')}
                      >
                        <span className="item-icon">📋</span>
                        <span className="item-label">ALL CATEGORIES</span>
                        <span className="item-count">{registrations.length}</span>
                      </div>
                      
                      <div className="dropdown-divider"></div>
                      
                      {Object.keys(groupedOptions).map(catId => {
                        const category = groupedOptions[catId];
                        const isCategoryActive = filterCategory === catId;
                        const hasDistances = category.distances.length > 0;
                        const categoryCount = registrations.filter(r => r.categoryId?.toLowerCase() === catId).length;
                        const isExpanded = expandedCategories[catId] || false;
                        
                        return (
                          <div key={catId} className="dropdown-group">
                            <div 
                              className={`dropdown-category ${isCategoryActive ? 'active' : ''}`}
                              onClick={() => {
                                if (hasDistances) {
                                  toggleCategory(catId);
                                } else {
                                  handleFilterSelect(catId);
                                }
                              }}
                              onDoubleClick={() => handleFilterSelect(catId)}
                            >
                              <span className="category-expand-icon">
                                {hasDistances && (isExpanded ? '▾' : '▸')}
                              </span>
                              <span className="category-icon">📁</span>
                              <span className="category-label">{category.label}</span>
                              <span className="category-count">{categoryCount}</span>
                            </div>
                            
                            {hasDistances && isExpanded && (
                              <div className="dropdown-distances">
                                {category.distances.map(distance => {
                                  const value = `${catId}-${distance}`;
                                  const isActive = filterCategory === value;
                                  const count = registrations.filter(r => 
                                    r.categoryId?.toLowerCase() === catId && 
                                    r.distance === distance
                                  ).length;
                                  
                                  return (
                                    <div 
                                      key={value}
                                      className={`dropdown-item distance-item ${isActive ? 'active' : ''}`}
                                      onClick={() => handleFilterSelect(value)}
                                    >
                                      <span className="distance-indent"></span>
                                      <span className="distance-bullet">•</span>
                                      <span className="item-label">{distance}</span>
                                      <span className="item-count">{count}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                      <th>Address</th>
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
                      <th>Receipts</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPageData.length === 0 ? (
                      <tr>
                        <td colSpan="16" className="no-data">
                          No registrations found
                        </td>
                      </tr>
                    ) : (
                      currentPageData.map((reg, index) => {
                        const realIndex = ((currentPage - 1) * rowsPerPage) + index + 1;
                        const receiptCount = getReceiptCount(reg);
                        return (
                          <tr key={reg.id || index}>
                            <td>{realIndex}</td>
                            <td className="name-cell">{reg.userName || 'N/A'}</td>
                            <td className="email-cell">{reg.userEmail || 'N/A'}</td>
                            <td className="address-cell">{reg.homeAddress || 'N/A'}</td>
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
                              <button 
                                className={`receipt-count-btn ${receiptCount > 0 ? 'has-receipt' : 'no-receipt'}`}
                                onClick={() => {
                                  if (receiptCount > 0) {
                                    const images = getReceiptImages(reg);
                                    handleReceiptClick(images);
                                  }
                                }}
                                title={receiptCount > 0 ? `Click to view ${receiptCount} receipt(s)` : 'No receipts uploaded'}
                                disabled={receiptCount === 0}
                              >
                                {receiptCount > 0 ? `📷 ${receiptCount}` : '📷 0'}
                              </button>
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
                <label>Address</label>
                <span>{selectedRegistration.homeAddress || 'N/A'}</span>
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
              
              {/* ✅ RECEIPT PREVIEW SECTION */}
              <div className="detail-item full-width">
                <label>Receipt Preview</label>
                {(() => {
                  const images = getReceiptImages(selectedRegistration);
                  
                  if (images.length === 0) {
                    return <span>No receipt uploaded</span>;
                  }
                  
                  if (images.length === 1) {
                    return (
                      <div 
                        className="receipt-preview-container"
                        onClick={() => handleReceiptClick(images)}
                        style={{
                          cursor: 'pointer',
                          border: '2px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '8px',
                          transition: 'all 0.3s ease',
                          background: '#f7fafc',
                          display: 'inline-block',
                          maxWidth: '300px',
                          width: '100%'
                        }}
                      >
                        <img 
                          src={images[0]} 
                          alt="Receipt" 
                          className="receipt-preview"
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '150px',
                            objectFit: 'contain',
                            borderRadius: '8px'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            parent.innerHTML = `
                              <div style="padding: 20px; text-align: center; color: #e53e3e; background: #fed7d7; border-radius: 8px; font-size: 14px;">
                                ⚠️ Image not found or invalid URL
                              </div>
                            `;
                          }}
                        />
                        <div className="receipt-click-hint" style={{
                          textAlign: 'center',
                          fontSize: '0.7rem',
                          color: '#718096',
                          marginTop: '6px',
                          fontWeight: 500
                        }}>
                          🔍 Click to enlarge
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="receipt-grid-container">
                      <div className="receipt-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                        gap: '12px',
                        width: '100%'
                      }}>
                        {images.slice(0, 4).map((img, idx) => (
                          <div 
                            key={idx} 
                            className="receipt-grid-item"
                            onClick={() => handleReceiptClick(images)}
                            style={{
                              cursor: 'pointer',
                              border: '2px solid #e2e8f0',
                              borderRadius: '12px',
                              padding: '8px',
                              transition: 'all 0.3s ease',
                              background: '#f7fafc',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            <img 
                              src={img} 
                              alt={`Receipt ${idx + 1}`} 
                              className="receipt-grid-image"
                              style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '100px',
                                objectFit: 'contain',
                                borderRadius: '8px'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const parent = e.target.parentElement;
                                const errorDiv = document.createElement('div');
                                errorDiv.style.cssText = 'padding: 20px 10px; text-align: center; color: #e53e3e; background: #fed7d7; border-radius: 8px; font-size: 12px;';
                                errorDiv.textContent = '⚠️ Image not found';
                                parent.appendChild(errorDiv);
                              }}
                            />
                            {idx === 3 && images.length > 4 && (
                              <div className="receipt-grid-overlay" style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                borderRadius: '10px'
                              }}>
                                +{images.length - 4}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="receipt-grid-hint" style={{
                        textAlign: 'center',
                        fontSize: '0.8rem',
                        color: '#718096',
                        marginTop: '8px',
                        fontWeight: 500
                      }}>
                        📸 {images.length} image(s) • Click to view all
                      </div>
                    </div>
                  );
                })()}
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

      {/* ✅ RECEIPT MODAL */}
      {showReceiptModal && receiptImages.length > 0 && (
        <div className="modal-overlay receipt-modal-overlay" onClick={handleCloseReceiptModal}>
          <div className="modal-content receipt-modal-content" onClick={(e) => e.stopPropagation()} style={{
            background: 'white',
            borderRadius: '28px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '32px',
            position: 'relative',
            boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
            animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <button className="modal-close" onClick={handleCloseReceiptModal} style={{
              position: 'absolute',
              top: '16px',
              right: '20px',
              background: 'none',
              border: 'none',
              fontSize: '2rem',
              cursor: 'pointer',
              color: '#4a5568',
              transition: 'all 0.3s ease',
              padding: '4px 12px',
              borderRadius: '8px',
              zIndex: 10
            }}>×</button>
            
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#2A499B',
              margin: '0 0 16px 0',
              textAlign: 'center'
            }}>
              📷 Receipt Preview 
              {receiptImages.length > 1 && (
                <span style={{
                  fontSize: '0.9rem',
                  color: '#718096',
                  fontWeight: 500
                }}>
                  ({currentImageIndex + 1} of {receiptImages.length})
                </span>
              )}
            </h2>
            
            <div className="receipt-full-container" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '16px 0',
              position: 'relative'
            }}>
              {receiptImages.length > 1 && (
                <button 
                  className="receipt-nav-btn receipt-nav-prev"
                  onClick={handlePreviousImage}
                  style={{
                    position: 'absolute',
                    left: '4px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    zIndex: 5,
                    transition: 'all 0.3s ease'
                  }}
                >
                  ❮
                </button>
              )}
              
              <img 
                src={receiptImages[currentImageIndex]} 
                alt={`Receipt ${currentImageIndex + 1}`} 
                className="receipt-full-image"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
                }}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5Ij5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+';
                  e.target.style.maxHeight = '300px';
                  e.target.style.width = 'auto';
                }}
              />
              
              {receiptImages.length > 1 && (
                <button 
                  className="receipt-nav-btn receipt-nav-next"
                  onClick={handleNextImage}
                  style={{
                    position: 'absolute',
                    right: '4px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    zIndex: 5,
                    transition: 'all 0.3s ease'
                  }}
                >
                  ❯
                </button>
              )}
            </div>
            
            {receiptImages.length > 1 && (
              <div className="receipt-thumbnails" style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'center',
                marginTop: '12px',
                flexWrap: 'wrap'
              }}>
                {receiptImages.map((img, idx) => (
                  <div 
                    key={idx}
                    className={`receipt-thumbnail ${idx === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(idx)}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: idx === currentImageIndex ? '3px solid #0A70BA' : '2px solid #e2e8f0',
                      transition: 'all 0.3s ease',
                      opacity: idx === currentImageIndex ? 1 : 0.6
                    }}
                  >
                    <img 
                      src={img} 
                      alt={`Thumbnail ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            
            <button className="modal-close-btn" onClick={handleCloseReceiptModal} style={{
              width: '100%',
              padding: '14px',
              background: 'rgba(237, 242, 247, 0.9)',
              color: '#4a5568',
              border: '2px solid #e2e8f0',
              borderRadius: '40px',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              marginTop: '16px'
            }}>
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
                  <span className="pdf-preview-label">Address:</span>
                  <span className="pdf-preview-value">{pdfRegistration.homeAddress || 'N/A'}</span>
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
                        <span className="reg-detail">📍 {reg.homeAddress || 'N/A'}</span>
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
    </div>
  );
};

export default AdminDashboard;