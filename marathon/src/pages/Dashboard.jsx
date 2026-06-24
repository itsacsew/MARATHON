import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RegistrationForm from '../components/RegistrationForm';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';

const Dashboard = () => {
  const { currentUser, userData, logout, getUserRegistrations } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isWaiverOpen, setIsWaiverOpen] = useState(false);
  const captureRef = useRef(null);
  const waiverCaptureRef = useRef(null);
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

  // Generate Image (PNG) for view modal with iPhone compatibility
  const generateImage = async () => {
    const element = captureRef.current;
    if (!element) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      // Get the actual dimensions
      const rect = element.getBoundingClientRect();
      const width = rect.width || 550;
      const height = rect.height || 800;

      const canvas = await html2canvas(element, {
        scale: 3, // Higher scale for better quality on iPhone
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        width: width,
        height: height,
        windowWidth: width,
        windowHeight: height,
        onclone: (document) => {
          const clonedElement = document.getElementById('capture-content-dashboard');
          if (clonedElement) {
            clonedElement.style.width = width + 'px';
            clonedElement.style.height = 'auto';
            clonedElement.style.display = 'block';
          }
        }
      });

      // For iPhone compatibility
      const link = document.createElement('a');
      link.download = `registration-${selectedRegistration?.referenceNumber || 'confirmation'}.png`;
      link.href = canvas.toDataURL('image/png');
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(link.href);
      }, 100);
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please try again.');
    }
  };

  // Generate Waiver Image (PNG) with iPhone compatibility
  const generateWaiverImage = async () => {
    const element = waiverCaptureRef.current;
    if (!element) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const rect = element.getBoundingClientRect();
      const width = rect.width || 550;
      const height = rect.height || 800;

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        width: width,
        height: height,
        windowWidth: width,
        windowHeight: height,
        onclone: (document) => {
          const clonedElement = document.getElementById('waiver-capture-content');
          if (clonedElement) {
            clonedElement.style.width = width + 'px';
            clonedElement.style.height = 'auto';
            clonedElement.style.display = 'block';
          }
        }
      });

      const link = document.createElement('a');
      link.download = `waiver-${selectedRegistration?.userName || 'participant'}.png`;
      link.href = canvas.toDataURL('image/png');
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => {
        URL.revokeObjectURL(link.href);
      }, 100);
    } catch (error) {
      console.error('Error generating waiver image:', error);
      alert('Failed to generate waiver image. Please try again.');
    }
  };

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date with time
  const formatDateWithTime = (dateString) => {
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
    if (gender === 'male' || gender === 'Male') return '☑ Male';
    if (gender === 'female' || gender === 'Female') return '☑ Female';
    return gender || 'N/A';
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '👤';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Get random color for avatar based on name
  const getAvatarColor = (name) => {
    const colors = ['#EDDB0B', '#68B42D', '#00A8AB', '#0A70BA', '#2A499B'];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Open view modal
  const handleViewRegistration = (registration) => {
    setSelectedRegistration(registration);
    setIsViewModalOpen(true);
    setIsWaiverOpen(false);
  };

  // Close view modal
  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedRegistration(null);
    setIsWaiverOpen(false);
  };

  // Toggle waiver
  const toggleWaiver = () => {
    setIsWaiverOpen(!isWaiverOpen);
  };

  return (
    <div style={styles.dashboard}>
      {/* Animated Background */}
      <div style={styles.backgroundEffects}>
        <div style={styles.glow1}></div>
        <div style={styles.glow2}></div>
        <div style={styles.glow3}></div>
      </div>

      {/* Header Section */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.userSection}>
            <div style={styles.avatarWrapper}>
              <div style={{
                ...styles.avatar,
                background: getAvatarColor(userData?.displayName || currentUser.email)
              }}>
                {getInitials(userData?.displayName || currentUser.email)}
              </div>
              <div style={styles.onlineDot}></div>
            </div>
            <div style={styles.userInfo}>
              <h2 style={styles.welcomeText}>
                Welcome back, <span style={styles.userName}>{userData?.displayName || 'User'}!</span>
              </h2>
              <p style={styles.userEmail}>
                <span style={styles.emailIcon}>✉️</span> {currentUser.email}
              </p>
              <div style={styles.userBadge}>
                <span style={styles.badgeIcon}>🏆</span>
                <span style={styles.badgeText}>
                  {registrations.length} {registrations.length === 1 ? 'Registration' : 'Registrations'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <span style={styles.logoutIcon}>🚪</span>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={styles.content}>
        <RegistrationForm />
        
        {/* Registrations History */}
        {registrations.length > 0 && (
          <div style={styles.historySection}>
            <div style={styles.historyHeader}>
              <h3 style={styles.historyTitle}>
                <span style={styles.historyIcon}>📋</span>
                Your Registrations
              </h3>
              <span style={styles.historyCount}>
                {registrations.length} entries
              </span>
            </div>
            <div style={styles.registrationsGrid}>
              {registrations.map((reg, index) => (
                <div key={reg.id || index} style={styles.registrationCard}>
                  <div style={styles.cardHeader}>
                    <div style={styles.cardBadge}>
                      <span style={{
                        ...styles.categoryBadge,
                        background: reg.categoryId === 'open' ? '#0A70BA' :
                                   reg.categoryId === 'masters' ? '#2A499B' : '#68B42D'
                      }}>
                        {reg.category || 'N/A'}
                      </span>
                      <span style={{
                        ...styles.statusBadge,
                        background: reg.status === 'completed' ? '#68B42D' :
                                   reg.status === 'pending' ? '#EDDB0B' : '#ff6b6b'
                      }}>
                        {reg.status || 'N/A'}
                      </span>
                    </div>
                    <span style={styles.cardDate}>
                      {formatDate(reg.registeredAt)}
                    </span>
                  </div>
                  
                  <div style={styles.cardBody}>
                    <h4 style={styles.eventName}>{reg.eventName || 'N/A'}</h4>
                    <div style={styles.eventDetails}>
                      <span style={styles.detailTag}>
                        <span style={styles.tagIcon}>📏</span>
                        {reg.distance || 'N/A'}
                      </span>
                      <span style={styles.detailTag}>
                        <span style={styles.tagIcon}>💰</span>
                        ₱{reg.fee?.toLocaleString() || '0'}
                      </span>
                      <span style={styles.detailTag}>
                        <span style={styles.tagIcon}>💳</span>
                        {reg.paymentMethod?.toUpperCase() || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={styles.cardFooter}>
                    <div style={styles.cardActions}>
                      <button 
                        style={styles.viewBtn}
                        onClick={() => handleViewRegistration(reg)}
                      >
                        <span style={styles.viewIcon}>👁️</span>
                        View Details
                      </button>
                      <div style={styles.progressBar}>
                        <div style={{
                          ...styles.progressFill,
                          width: reg.status === 'completed' ? '100%' :
                                 reg.status === 'pending' ? '50%' : '25%'
                        }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* VIEW MODAL - Shows full registration details */}
      {/* ============================================================ */}
      {isViewModalOpen && selectedRegistration && (
        <div style={styles.modalOverlay} onClick={closeViewModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={closeViewModal}>×</button>

            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>📋 Registration Details</h2>
              <p style={styles.modalSubtitle}>Complete registration information</p>
            </div>

            {/* ============================================================ */}
            {/* CAPTURE CONTENT - For image download with iPhone compatibility */}
            {/* ============================================================ */}
            <div id="capture-content-dashboard" ref={captureRef} style={styles.captureContent}>
              <div style={styles.captureInner}>
                {/* Header */}
                <div style={styles.captureHeader}>
                  <h1 style={styles.captureHeaderH1}>🏃 Liloan Love the Life</h1>
                  <h2 style={styles.captureHeaderH2}>Registration Confirmation</h2>
                  <div style={styles.captureDivider}></div>
                </div>

                {/* Personal Information */}
                <div style={styles.captureSection}>
                  <h3 style={styles.captureSectionTitle}>Personal Information</h3>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Name</span>
                    <span style={styles.captureValue}>{selectedRegistration.userName || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Birthdate</span>
                    <span style={styles.captureValue}>{formatDateWithTime(selectedRegistration.birthdate) || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Age</span>
                    <span style={styles.captureValue}>{selectedRegistration.age || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Gender</span>
                    <span style={styles.captureValue}>{getGenderLabel(selectedRegistration.gender)}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Blood Type</span>
                    <span style={styles.captureValue}>{selectedRegistration.bloodType || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Mobile Number</span>
                    <span style={styles.captureValue}>{selectedRegistration.mobileNumber || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Email</span>
                    <span style={styles.captureValue}>{selectedRegistration.email || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Home Address</span>
                    <span style={styles.captureValue}>{selectedRegistration.homeAddress || 'N/A'}</span>
                  </div>
                </div>

                <div style={styles.captureDivider}></div>

                {/* Emergency Contact */}
                <div style={styles.captureSection}>
                  <h3 style={styles.captureSectionTitle}>Emergency Contact</h3>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Contact Person</span>
                    <span style={styles.captureValue}>{selectedRegistration.emergencyContact || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Contact Number</span>
                    <span style={styles.captureValue}>{selectedRegistration.emergencyNumber || 'N/A'}</span>
                  </div>
                </div>

                <div style={styles.captureDivider}></div>

                {/* Event Details */}
                <div style={styles.captureSection}>
                  <h3 style={styles.captureSectionTitle}>Event Details</h3>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Event</span>
                    <span style={styles.captureValue}>{selectedRegistration.eventName || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Category</span>
                    <span style={styles.captureValue}>{selectedRegistration.category || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Distance</span>
                    <span style={styles.captureValue}>{selectedRegistration.distance || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Shirt Size</span>
                    <span style={{...styles.captureValue, color: '#0A70BA', fontWeight: 'bold'}}>{selectedRegistration.shirtSize || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Fee</span>
                    <span style={{...styles.captureValue, color: '#2A499B', fontWeight: 'bold'}}>₱{selectedRegistration.fee?.toLocaleString() || '0'}.00</span>
                  </div>
                </div>

                <div style={styles.captureDivider}></div>

                {/* Payment Details */}
                <div style={styles.captureSection}>
                  <h3 style={styles.captureSectionTitle}>Payment Details</h3>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Payment Method</span>
                    <span style={styles.captureValue}>{selectedRegistration.paymentMethod?.toUpperCase() || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Reference Number</span>
                    <span style={{...styles.captureValue, color: '#0A70BA', fontFamily: 'Courier New, monospace', fontWeight: 'bold'}}>
                      {selectedRegistration.referenceNumber || 'N/A'}
                    </span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Payment Date</span>
                    <span style={styles.captureValue}>{formatDateWithTime(selectedRegistration.paymentDate || selectedRegistration.registeredAt)}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Status</span>
                    <span style={{...styles.captureValue, color: '#68B42D', fontWeight: 'bold'}}>✔ Completed</span>
                  </div>
                </div>

                <div style={styles.captureDivider}></div>

                {/* Footer */}
                <div style={styles.captureFooter}>
                  <p>Thank you for registering</p>
                  <p style={styles.captureFooterSmall}>Liloan Love the Life • 2026</p>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* WAIVER CAPTURE CONTENT - For image download with iPhone compatibility */}
            {/* ============================================================ */}
            <div id="waiver-capture-content" ref={waiverCaptureRef} style={styles.waiverCaptureContent}>
              <div style={styles.waiverCaptureInner}>
                <div style={styles.waiverCaptureHeader}>
                  <h1 style={styles.waiverCaptureTitle}>🏃 Liloan Love the Life</h1>
                  <h2 style={styles.waiverCaptureSubtitle}>WAIVER AND RELEASE OF LIABILITY</h2>
                  <div style={styles.captureDivider}></div>
                </div>

                <div style={styles.waiverCaptureBody}>
                  <p style={styles.waiverCaptureText}>
                    I hereby certify that I am physically fit and in good health to participate in the Lilo-Wawa Half Marathon. I understand that running is a strenuous physical activity that involves inherent risks, including injury, illness, dehydration, accidents, and other unforeseen circumstances.
                  </p>

                  <p style={styles.waiverCaptureText}>
                    I acknowledge that food and refreshments may be provided during the event and accept full responsibility for any allergies, dietary restrictions, or adverse reactions resulting from their consumption.
                  </p>

                  <p style={styles.waiverCaptureText}>
                    I further understand that the organizers will have standby medical personnel and first-aid assistance available during the event. However, I acknowledge that such assistance does not eliminate all risks associated with participation, and I voluntarily assume full responsibility for my health and safety.
                  </p>

                  <p style={styles.waiverCaptureText}>
                    In consideration of my participation, I hereby release and hold harmless the organizers, sponsors, partners, volunteers, medical personnel, and the Municipality of Liloan from any liability, claims, damages, injuries, losses, or expenses arising from or related to my participation in the event, except in cases of gross negligence or willful misconduct.
                  </p>

                  <p style={styles.waiverCaptureText}>
                    By registering for the Lilo-Wawa Half Marathon, I confirm that I have read, understood, and voluntarily agreed to this waiver and release of liability.
                  </p>

                  <div style={styles.waiverCaptureSignature}>
                    <div style={styles.waiverCaptureField}>
                      <span style={styles.waiverCaptureFieldLabel}>Participant's Name:</span>
                      <span style={styles.waiverCaptureFieldValue}>{selectedRegistration?.userName || '________________________'}</span>
                    </div>
                    <div style={styles.waiverCaptureField}>
                      <span style={styles.waiverCaptureFieldLabel}>Signature:</span>
                      <span style={styles.waiverCaptureFieldValue}>_______________________________</span>
                    </div>
                    <div style={styles.waiverCaptureField}>
                      <span style={styles.waiverCaptureFieldLabel}>Date:</span>
                      <span style={styles.waiverCaptureFieldValue}>{formatDateWithTime(new Date().toISOString())}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.captureDivider}></div>
                <div style={styles.waiverCaptureFooter}>
                  <p style={styles.waiverCaptureFooterText}>Liloan Love the Life • 2026</p>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* MODAL BODY - Display all registration details with Waiver toggle */}
            {/* ============================================================ */}
            <div style={styles.modalBody}>
              {/* Personal Information */}
              <div style={styles.modalSection}>
                <h3 style={styles.modalSectionTitle}>👤 Personal Information</h3>
                <div style={styles.modalGrid}>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Name</span>
                    <span style={styles.modalValue}>{selectedRegistration.userName || 'N/A'}</span>
                  </div>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Birthdate</span>
                    <span style={styles.modalValue}>{formatDateWithTime(selectedRegistration.birthdate) || 'N/A'}</span>
                  </div>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Age</span>
                    <span style={styles.modalValue}>{selectedRegistration.age || 'N/A'}</span>
                  </div>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Gender</span>
                    <span style={styles.modalValue}>{getGenderLabel(selectedRegistration.gender)}</span>
                  </div>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Blood Type</span>
                    <span style={styles.modalValue}>{selectedRegistration.bloodType || 'N/A'}</span>
                  </div>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Mobile Number</span>
                    <span style={styles.modalValue}>{selectedRegistration.mobileNumber || 'N/A'}</span>
                  </div>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Email</span>
                    <span style={styles.modalValue}>{selectedRegistration.email || 'N/A'}</span>
                  </div>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Home Address</span>
                    <span style={styles.modalValue}>{selectedRegistration.homeAddress || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div style={styles.modalSection}>
                <h3 style={styles.modalSectionTitle}>🚨 Emergency Contact</h3>
                <div style={styles.modalGrid}>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Contact Person</span>
                    <span style={styles.modalValue}>{selectedRegistration.emergencyContact || 'N/A'}</span>
                  </div>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Contact Number</span>
                    <span style={styles.modalValue}>{selectedRegistration.emergencyNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div style={styles.modalSection}>
                <h3 style={styles.modalSectionTitle}>🏁 Event Details</h3>
                <div style={styles.modalGrid}>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Event</span>
                    <span style={styles.modalValue}>{selectedRegistration.eventName || 'N/A'}</span>
                  </div>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Category</span>
                    <span style={styles.modalValue}>{selectedRegistration.category || 'N/A'}</span>
                  </div>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Distance</span>
                    <span style={styles.modalValue}>{selectedRegistration.distance || 'N/A'}</span>
                  </div>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Shirt Size</span>
                    <span style={{...styles.modalValue, color: '#0A70BA', fontWeight: 'bold'}}>{selectedRegistration.shirtSize || 'N/A'}</span>
                  </div>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Fee</span>
                    <span style={{...styles.modalValue, color: '#2A499B', fontWeight: 'bold'}}>₱{selectedRegistration.fee?.toLocaleString() || '0'}.00</span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div style={styles.modalSection}>
                <h3 style={styles.modalSectionTitle}>💳 Payment Details</h3>
                <div style={styles.modalGrid}>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Payment Method</span>
                    <span style={styles.modalValue}>{selectedRegistration.paymentMethod?.toUpperCase() || 'N/A'}</span>
                  </div>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Reference Number</span>
                    <span style={{...styles.modalValue, color: '#0A70BA', fontFamily: 'Courier New, monospace', fontWeight: 'bold'}}>
                      {selectedRegistration.referenceNumber || 'N/A'}
                    </span>
                  </div>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Payment Date</span>
                    <span style={styles.modalValue}>{formatDateWithTime(selectedRegistration.paymentDate || selectedRegistration.registeredAt)}</span>
                  </div>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Status</span>
                    <span style={{...styles.modalValue, color: '#68B42D', fontWeight: 'bold'}}>✅ Completed</span>
                  </div>
                </div>
              </div>

              {/* Waiver Section with Toggle */}
              <div style={styles.waiverToggleSection}>
                <div style={styles.waiverToggleHeader} onClick={toggleWaiver}>
                  <h3 style={styles.waiverToggleTitle}>
                    📄 Terms & Conditions (Waiver)
                  </h3>
                  <span style={{
                    ...styles.waiverToggleArrow,
                    transform: isWaiverOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                
                {isWaiverOpen && (
                  <div style={styles.waiverDisplay}>
                    <div style={styles.waiverDisplayHeader}>
                      <h4 style={styles.waiverDisplayTitle}>WAIVER AND RELEASE OF LIABILITY</h4>
                    </div>
                    <div style={styles.waiverDisplayBody}>
                      <p style={styles.waiverDisplayText}>
                        I hereby certify that I am physically fit and in good health to participate in the Lilo-Wawa Half Marathon. I understand that running is a strenuous physical activity that involves inherent risks, including injury, illness, dehydration, accidents, and other unforeseen circumstances.
                      </p>

                      <p style={styles.waiverDisplayText}>
                        I acknowledge that food and refreshments may be provided during the event and accept full responsibility for any allergies, dietary restrictions, or adverse reactions resulting from their consumption.
                      </p>

                      <p style={styles.waiverDisplayText}>
                        I further understand that the organizers will have standby medical personnel and first-aid assistance available during the event. However, I acknowledge that such assistance does not eliminate all risks associated with participation, and I voluntarily assume full responsibility for my health and safety.
                      </p>

                      <p style={styles.waiverDisplayText}>
                        In consideration of my participation, I hereby release and hold harmless the organizers, sponsors, partners, volunteers, medical personnel, and the Municipality of Liloan from any liability, claims, damages, injuries, losses, or expenses arising from or related to my participation in the event, except in cases of gross negligence or willful misconduct.
                      </p>

                      <p style={styles.waiverDisplayText}>
                        By registering for the Lilo-Wawa Half Marathon, I confirm that I have read, understood, and voluntarily agreed to this waiver and release of liability.
                      </p>

                      <div style={styles.waiverDisplaySignature}>
                        <div style={styles.waiverDisplayField}>
                          <span style={styles.waiverDisplayFieldLabel}>Participant's Name:</span>
                          <span style={styles.waiverDisplayFieldValue}>{selectedRegistration?.userName || '________________________'}</span>
                        </div>
                        <div style={styles.waiverDisplayField}>
                          <span style={styles.waiverDisplayFieldLabel}>Signature:</span>
                          <span style={styles.waiverDisplayFieldValue}>_______________________________</span>
                        </div>
                        <div style={styles.waiverDisplayField}>
                          <span style={styles.waiverDisplayFieldLabel}>Date:</span>
                          <span style={styles.waiverDisplayFieldValue}>{formatDateWithTime(new Date().toISOString())}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={styles.modalActions}>
              <button style={styles.downloadImageBtn} onClick={generateImage}>
                <span style={styles.imageIcon}>🖼️</span>
                Download Image
              </button>
              <button style={styles.downloadWaiverBtn} onClick={generateWaiverImage}>
                <span style={styles.imageIcon}>🖼️</span>
                Download Waiver
              </button>
              <button style={styles.closeModalBtn} onClick={closeViewModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// STYLES - Professional 3D Design with Liloan Love the Life Theme
// ============================================================

const colors = {
  yellow: '#EDDB0B',
  green: '#68B42D',
  teal: '#00A8AB',
  blue: '#0A70BA',
  darkBlue: '#2A499B',
};

const styles = {
  dashboard: {
    width: '100%',
    maxWidth: '720px',
    position: 'relative',
    padding: '20px',
    fontFamily: 'Segoe UI, Roboto, sans-serif',
  },
  backgroundEffects: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute',
    top: '-10%',
    right: '-5%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${colors.yellow}30, transparent 70%)`,
    animation: 'floatGlow 8s ease-in-out infinite',
  },
  glow2: {
    position: 'absolute',
    bottom: '-10%',
    left: '-5%',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${colors.teal}30, transparent 70%)`,
    animation: 'floatGlow 10s ease-in-out infinite reverse',
  },
  glow3: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${colors.blue}20, transparent 70%)`,
    animation: 'pulseGlow 6s ease-in-out infinite',
  },
  header: {
    position: 'relative',
    zIndex: 10,
    background: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(20px) saturate(1.2)',
    borderRadius: '24px',
    padding: '24px 32px',
    marginBottom: '28px',
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
    boxShadow: '0 20px 60px rgba(42, 73, 155, 0.30), 0 8px 24px rgba(0, 168, 171, 0.15), inset 0 1px 0 rgba(255,255,255,0.5)',
    border: '1px solid rgba(255,255,255,0.3)',
    transform: 'perspective(1000px) rotateX(1deg)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 700,
    color: 'white',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    transition: 'transform 0.3s ease',
  },
  onlineDot: {
    position: 'absolute',
    bottom: '2px',
    right: '2px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    background: '#68B42D',
    border: '3px solid white',
    boxShadow: '0 2px 8px rgba(104, 180, 45, 0.4)',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  welcomeText: {
    fontSize: '1.4rem',
    fontWeight: 600,
    color: '#2d3748',
    margin: 0,
  },
  userName: {
    background: `linear-gradient(135deg, ${colors.darkBlue}, ${colors.blue})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  userEmail: {
    fontSize: '0.9rem',
    color: '#4a5568',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  emailIcon: {
    fontSize: '0.9rem',
  },
  userBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 16px',
    background: `linear-gradient(135deg, ${colors.yellow}30, ${colors.green}30)`,
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: colors.darkBlue,
    marginTop: '4px',
  },
  badgeIcon: {
    fontSize: '0.9rem',
  },
  badgeText: {
    fontSize: '0.8rem',
  },
  logoutBtn: {
    padding: '12px 28px',
    background: `linear-gradient(145deg, #fc8181, #f56565)`,
    color: 'white',
    border: 'none',
    borderRadius: '40px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 6px 20px rgba(245, 101, 101, 0.30)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.95rem',
  },
  logoutIcon: {
    fontSize: '1.1rem',
  },
  content: {
    position: 'relative',
    zIndex: 10,
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '28px',
  },
  historySection: {
    background: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(20px) saturate(1.2)',
    borderRadius: '28px',
    padding: '32px',
    border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 20px 60px rgba(42, 73, 155, 0.25), 0 8px 24px rgba(0, 168, 171, 0.12), inset 0 1px 0 rgba(255,255,255,0.5)',
    transform: 'perspective(1200px) rotateX(1deg)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '2px solid rgba(0, 168, 171, 0.10)',
  },
  historyTitle: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: colors.darkBlue,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: 0,
  },
  historyIcon: {
    fontSize: '1.3rem',
  },
  historyCount: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#4a5568',
    background: 'rgba(10, 112, 186, 0.08)',
    padding: '4px 16px',
    borderRadius: '20px',
  },
  registrationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  registrationCard: {
    background: 'rgba(255, 255, 255, 0.6)',
    borderRadius: '16px',
    padding: '18px 20px',
    border: '1px solid rgba(0, 168, 171, 0.08)',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  cardBadge: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  categoryBadge: {
    padding: '2px 12px',
    borderRadius: '12px',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  statusBadge: {
    padding: '2px 12px',
    borderRadius: '12px',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  cardDate: {
    fontSize: '0.75rem',
    color: '#718096',
  },
  cardBody: {
    marginBottom: '12px',
  },
  eventName: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: colors.darkBlue,
    margin: '0 0 8px 0',
  },
  eventDetails: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  detailTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.8rem',
    color: '#4a5568',
    background: 'rgba(247, 250, 252, 0.8)',
    padding: '2px 12px',
    borderRadius: '12px',
  },
  tagIcon: {
    fontSize: '0.8rem',
  },
  cardFooter: {
    marginTop: '8px',
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  viewBtn: {
    padding: '6px 16px',
    background: `linear-gradient(135deg, ${colors.blue}, ${colors.darkBlue})`,
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(10, 112, 186, 0.25)',
  },
  viewIcon: {
    fontSize: '0.8rem',
  },
  progressBar: {
    flex: 1,
    height: '4px',
    background: 'rgba(0, 168, 171, 0.10)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: `linear-gradient(90deg, ${colors.blue}, ${colors.teal})`,
    borderRadius: '4px',
    transition: 'width 1s ease',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(255,255,255,0.2)',
    borderTop: `4px solid ${colors.yellow}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: 500,
  },
  // ============================================================
  // VIEW MODAL STYLES
  // ============================================================
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
    animation: 'fadeIn 0.3s ease',
  },
  modalContent: {
    background: 'white',
    borderRadius: '28px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    padding: '32px',
    position: 'relative',
    boxShadow: '0 40px 80px rgba(0,0,0,0.4), 0 0 0 4px rgba(237, 219, 11, 0.3)',
    animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  modalClose: {
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
    zIndex: 10,
  },
  modalHeader: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  modalTitle: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: colors.darkBlue,
    margin: 0,
  },
  modalSubtitle: {
    fontSize: '0.95rem',
    color: '#4a5568',
    margin: '4px 0 0 0',
  },
  modalBody: {
    marginBottom: '24px',
  },
  modalSection: {
    marginBottom: '20px',
    padding: '16px',
    background: 'rgba(247, 250, 252, 0.6)',
    borderRadius: '16px',
    border: '1px solid rgba(0, 168, 171, 0.08)',
  },
  modalSectionTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: colors.darkBlue,
    margin: '0 0 12px 0',
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px 16px',
  },
  modalItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  modalLabel: {
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#718096',
    fontWeight: 600,
  },
  modalValue: {
    fontSize: '0.95rem',
    fontWeight: 500,
    color: '#2d3748',
    wordBreak: 'break-word',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
    flexWrap: 'wrap',
  },
  downloadImageBtn: {
    flex: 1,
    minWidth: '140px',
    padding: '14px 20px',
    background: `linear-gradient(135deg, ${colors.darkBlue}, ${colors.blue})`,
    color: 'white',
    border: 'none',
    borderRadius: '40px',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 6px 20px rgba(10, 112, 186, 0.30)',
  },
  downloadWaiverBtn: {
    flex: 1,
    minWidth: '140px',
    padding: '14px 20px',
    background: `linear-gradient(135deg, ${colors.yellow}, #f5a623)`,
    color: colors.darkBlue,
    border: 'none',
    borderRadius: '40px',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 6px 20px rgba(237, 219, 11, 0.30)',
  },
  imageIcon: {
    fontSize: '1.2rem',
  },
  closeModalBtn: {
    flex: 0.5,
    minWidth: '100px',
    padding: '14px 20px',
    background: 'rgba(237, 242, 247, 0.9)',
    color: '#4a5568',
    border: '2px solid #e2e8f0',
    borderRadius: '40px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  // ============================================================
  // WAIVER TOGGLE STYLES
  // ============================================================
  waiverToggleSection: {
    marginTop: '20px',
    padding: '16px',
    background: 'rgba(247, 250, 252, 0.6)',
    borderRadius: '16px',
    border: '1px solid rgba(0, 168, 171, 0.08)',
  },
  waiverToggleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '4px 0',
    userSelect: 'none',
    transition: 'all 0.3s ease',
  },
  waiverToggleTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: colors.darkBlue,
    margin: 0,
  },
  waiverToggleArrow: {
    fontSize: '1.2rem',
    color: colors.blue,
    transition: 'transform 0.3s ease',
  },
  waiverDisplay: {
    marginTop: '16px',
    padding: '16px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid rgba(237, 219, 11, 0.2)',
    animation: 'slideDown 0.3s ease',
  },
  waiverDisplayHeader: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  waiverDisplayTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: colors.darkBlue,
    margin: 0,
  },
  waiverDisplayBody: {
    maxHeight: '400px',
    overflow: 'auto',
    paddingRight: '8px',
  },
  waiverDisplayText: {
    fontSize: '0.9rem',
    lineHeight: '1.8',
    color: '#4a5568',
    marginBottom: '12px',
    textAlign: 'justify',
  },
  waiverDisplaySignature: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0',
  },
  waiverDisplayField: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '6px 0',
    flexWrap: 'wrap',
  },
  waiverDisplayFieldLabel: {
    fontWeight: 600,
    color: '#4a5568',
    fontSize: '0.9rem',
    minWidth: '140px',
  },
  waiverDisplayFieldValue: {
    color: '#2d3748',
    fontSize: '0.9rem',
    borderBottom: '1px dashed #cbd5e0',
    padding: '2px 8px',
    flex: 1,
    minWidth: '150px',
  },
  // ============================================================
  // CAPTURE STYLES - For image generation with iPhone compatibility
  // ============================================================
  captureContent: {
    position: 'absolute',
    left: '-9999px',
    top: 0,
    width: '500px',
    maxWidth: '500px',
    background: 'white',
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    padding: 0,
    boxSizing: 'border-box',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
  captureInner: {
    padding: '30px 32px 25px',
    width: '100%',
    boxSizing: 'border-box',
    background: 'white',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
  },
  captureHeader: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  captureHeaderH1: {
    fontSize: '22px',
    color: '#2A499B',
    margin: '0 0 4px 0',
    fontWeight: '700',
  },
  captureHeaderH2: {
    fontSize: '16px',
    color: '#0A70BA',
    margin: '0 0 6px 0',
    fontWeight: '500',
  },
  captureDivider: {
    borderTop: '2px solid #EDDB0B',
    margin: '8px 0',
    width: '100%',
  },
  captureSection: {
    marginBottom: '8px',
  },
  captureSectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#2A499B',
    margin: '0 0 4px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  captureRow: {
    display: 'flex',
    padding: '4px 0',
    borderBottom: '1px solid #f0f0f0',
    alignItems: 'center',
  },
  captureLabel: {
    flex: '0 0 130px',
    fontWeight: '600',
    color: '#4a5568',
    fontSize: '12px',
    letterSpacing: '0.2px',
  },
  captureValue: {
    flex: 1,
    color: '#2d3748',
    fontSize: '12px',
    fontWeight: '500',
    wordBreak: 'break-word',
  },
  captureFooter: {
    textAlign: 'center',
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '2px solid #EDDB0B',
  },
  captureFooterSmall: {
    fontSize: '10px',
    color: '#a0aec0',
    fontWeight: '400',
  },
  // ============================================================
  // WAIVER CAPTURE STYLES - For image download with iPhone compatibility
  // ============================================================
  waiverCaptureContent: {
    position: 'absolute',
    left: '-9999px',
    top: 0,
    width: '500px',
    maxWidth: '500px',
    background: 'white',
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    padding: 0,
    boxSizing: 'border-box',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
  waiverCaptureInner: {
    padding: '35px 32px 25px',
    width: '100%',
    boxSizing: 'border-box',
    background: 'white',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
  },
  waiverCaptureHeader: {
    textAlign: 'center',
    marginBottom: '18px',
  },
  waiverCaptureTitle: {
    fontSize: '22px',
    color: '#2A499B',
    margin: '0 0 4px 0',
    fontWeight: '700',
  },
  waiverCaptureSubtitle: {
    fontSize: '16px',
    color: '#0A70BA',
    margin: '0 0 6px 0',
    fontWeight: '600',
  },
  waiverCaptureBody: {
    margin: '10px 0',
    flex: 1,
  },
  waiverCaptureText: {
    fontSize: '12px',
    lineHeight: '1.7',
    color: '#2d3748',
    marginBottom: '12px',
    textAlign: 'justify',
  },
  waiverCaptureSignature: {
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '2px solid #EDDB0B',
  },
  waiverCaptureField: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '5px 0',
  },
  waiverCaptureFieldLabel: {
    fontWeight: '600',
    color: '#4a5568',
    fontSize: '12px',
    minWidth: '140px',
  },
  waiverCaptureFieldValue: {
    color: '#2d3748',
    fontSize: '12px',
    borderBottom: '1px solid #cbd5e0',
    padding: '2px 8px',
    flex: 1,
  },
  waiverCaptureFooter: {
    textAlign: 'center',
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '2px solid #EDDB0B',
  },
  waiverCaptureFooterText: {
    fontSize: '11px',
    color: '#a0aec0',
  },
};

// ============================================================
// CSS KEYFRAMES (injected)
// ============================================================

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes floatGlow {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(30px, -30px) scale(1.1); }
  }

  @keyframes pulseGlow {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: scale(0.8) translateY(30px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
      max-height: 0;
    }
    to {
      opacity: 1;
      transform: translateY(0);
      max-height: 600px;
    }
  }

  /* Hover Effects */
  .view-btn:hover {
    transform: scale(1.05) !important;
    box-shadow: 0 6px 20px rgba(10, 112, 186, 0.4) !important;
  }

  .download-image-btn:hover {
    transform: translateY(-2px) scale(1.02) !important;
    box-shadow: 0 10px 30px rgba(10, 112, 186, 0.45) !important;
  }

  .download-waiver-btn:hover {
    transform: translateY(-2px) scale(1.02) !important;
    box-shadow: 0 10px 30px rgba(237, 219, 11, 0.45) !important;
  }

  .close-modal-btn:hover {
    background: #e2e8f0 !important;
    transform: translateY(-2px) !important;
  }

  .modal-close:hover {
    background: rgba(0,0,0,0.05) !important;
    transform: rotate(90deg) !important;
  }

  .waiver-toggle-header:hover {
    background: rgba(10, 112, 186, 0.05) !important;
    border-radius: 8px !important;
    padding: 4px 8px !important;
    margin: -4px -8px !important;
  }

  /* iPhone/iOS specific fixes */
  @supports (-webkit-touch-callout: none) {
    .capture-content, .waiver-capture-content {
      width: 500px !important;
      max-width: 500px !important;
    }
    
    .capture-inner, .waiver-capture-inner {
      padding: 30px 32px 25px !important;
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .modal-content {
      padding: 24px 16px !important;
      max-height: 95vh !important;
    }

    .modal-grid {
      grid-template-columns: 1fr !important;
    }

    .modal-actions {
      flex-direction: column !important;
    }

    .download-image-btn,
    .download-waiver-btn,
    .close-modal-btn {
      width: 100% !important;
      padding: 12px !important;
    }

    .header-content {
      flex-direction: column;
      align-items: stretch !important;
    }

    .user-section {
      flex-direction: column;
      align-items: center !important;
      text-align: center;
    }

    .user-info {
      align-items: center !important;
    }

    .logout-btn {
      width: 100%;
      justify-content: center;
    }

    .registrations-grid {
      grid-template-columns: 1fr !important;
    }

    .history-section {
      padding: 20px !important;
    }

    .header {
      padding: 20px !important;
    }

    .welcome-text {
      font-size: 1.1rem !important;
    }

    .card-actions {
      flex-direction: column !important;
      align-items: stretch !important;
    }

    .view-btn {
      justify-content: center !important;
    }

    .waiver-display-field {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 4px !important;
    }

    .waiver-display-field-value {
      width: 100% !important;
    }
  }

  @media (max-width: 480px) {
    .dashboard {
      padding: 12px !important;
    }

    .card-header {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 8px;
    }

    .history-header {
      flex-direction: column;
      gap: 8px;
      align-items: flex-start !important;
    }

    .modal-content {
      padding: 20px 12px !important;
      border-radius: 20px !important;
    }

    .modal-title {
      font-size: 1.3rem !important;
    }

    .waiver-toggle-title {
      font-size: 0.9rem !important;
    }

    .waiver-display-text {
      font-size: 0.8rem !important;
    }

    .waiver-display-field-label {
      min-width: 100px !important;
      font-size: 0.8rem !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Dashboard;