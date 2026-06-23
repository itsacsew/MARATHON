import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import CategorySelector from './CategorySelector';
import EventModal from './EventModal';
import FeeDisplay from './FeeDisplay';
import PaymentButtons from './PaymentButtons';
import PaymentModal from './PaymentModal';
import { EVENT_CONFIG, GENDER_OPTIONS } from '../config/eventConfig';
import { useAuth } from '../contexts/AuthContext';

// Color theme
const colors = {
  yellow: '#EDDB0B',
  green: '#68B42D',
  teal: '#00A8AB',
  blue: '#0A70BA',
  darkBlue: '#2A499B',
};

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    event: '',
    gender: ''  // Add gender to form data
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { currentUser, saveRegistration, userData } = useAuth();

  const selectedCategoryData = EVENT_CONFIG.categories.find(
    cat => cat.id === selectedCategory
  );

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedEvent(null);
    setFormData({
      ...formData,
      category: categoryId,
      event: ''
    });
    if (categoryId) {
      setIsEventModalOpen(true);
      setIsEditing(false);
    }
  };

  const handleEventSelect = (eventId) => {
    setSelectedEvent(eventId);
    setFormData({
      ...formData,
      event: eventId
    });
    setIsEditing(false);
  };

  const handleGenderSelect = (genderId) => {
    setSelectedGender(genderId);
    setFormData({
      ...formData,
      gender: genderId
    });
  };

  const handleNameChange = (e) => {
    setFormData({
      ...formData,
      name: e.target.value
    });
  };

  const handlePaymentSelect = (paymentId) => {
    setSelectedPayment(paymentId);
    setIsPaymentModalOpen(true);
    setUploadedFile(null);
  };

  const handleFileUpload = (fileData) => {
    setUploadedFile(fileData);
  };

  const handleFinalSubmit = async (paymentData) => {
    if (!currentUser || !selectedCategoryData || !selectedEvent || !selectedGender) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const eventDetails = selectedCategoryData.events.find(e => e.id === selectedEvent);
      if (!eventDetails) {
        throw new Error('Event not found');
      }

      const registrationData = {
        userName: formData.name || userData?.displayName || 'Anonymous',
        gender: selectedGender,
        category: selectedCategoryData.name,
        categoryId: selectedCategory,
        eventName: eventDetails.name,
        eventId: selectedEvent,
        distance: eventDetails.distance,
        fee: eventDetails.fee,
        paymentMethod: paymentData.paymentMethod,
        hasReceipt: true,
        receiptFileName: paymentData.receiptFile?.name || 'receipt.jpg',
        receiptPreview: paymentData.receiptPreview || null,
        status: 'completed',
        registeredAt: new Date().toISOString()
      };
      
      await saveRegistration(currentUser.uid, registrationData);
      
      setShowSuccess(true);
      setSaveMessage('✅ Successfully Registered!');
      
      setTimeout(() => {
        setFormData({
          name: '',
          category: '',
          event: '',
          gender: ''
        });
        setSelectedCategory(null);
        setSelectedEvent(null);
        setSelectedGender(null);
        setSelectedPayment(null);
        setUploadedFile(null);
        setShowSuccess(false);
        setSaveMessage('');
        setIsPaymentModalOpen(false);
      }, 2500);
      
    } catch (error) {
      console.error('Error submitting registration:', error);
      setSaveMessage('❌ Failed to submit registration');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };

  const handleBackToCategory = () => {
    setSelectedCategory(null);
    setSelectedEvent(null);
    setFormData({
      ...formData,
      category: '',
      event: ''
    });
    setIsEditing(false);
  };

  const handleBackToEvent = () => {
    if (selectedCategory) {
      setIsEventModalOpen(true);
      setIsEditing(true);
    }
  };

  const getSelectedEventDetails = () => {
    if (!selectedCategoryData || !selectedEvent) return null;
    return selectedCategoryData.events.find(e => e.id === selectedEvent);
  };

  const selectedEventDetails = getSelectedEventDetails();

  return (
    <>
      <div style={styles.container}>
        <div style={styles.formWrapper}>
          {/* Decorative Elements */}
          <div style={styles.decorativeTop}></div>
          <div style={styles.decorativeBottom}></div>
          
          <div style={styles.header}>
            <div style={styles.headerIcon}>🏃</div>
            <h1 style={styles.title}>Event Registration</h1>
            <div style={styles.headerBadge}>
              <span style={styles.badgeDot}></span>
              <span style={styles.badgeText}>Active</span>
            </div>
          </div>

          <div style={styles.formContent}>
            {/* Success Message */}
            {showSuccess && (
              <div style={styles.successMessage}>
                <div style={styles.successContent}>
                  <span style={styles.successEmoji}>✅</span>
                  <div>
                    <span style={styles.successText}>Successfully Registered!</span>
                    <span style={styles.successSubtext}>Your registration has been confirmed</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error/Save Message */}
            {saveMessage && !showSuccess && (
              <div style={{
                ...styles.saveMessage,
                background: saveMessage.includes('success') || saveMessage.includes('✅') 
                  ? 'rgba(104, 180, 45, 0.12)' 
                  : 'rgba(254, 215, 215, 0.9)',
                borderColor: saveMessage.includes('success') || saveMessage.includes('✅')
                  ? colors.green
                  : '#fc8181',
                color: saveMessage.includes('success') || saveMessage.includes('✅')
                  ? '#276749'
                  : '#c53030'
              }}>
                {saveMessage}
              </div>
            )}

            {/* Name Input */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <span style={styles.labelIcon}>📝</span>
                Full Name
                <span style={styles.required}>*</span>
              </label>
              <div style={styles.inputWrapper}>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleNameChange}
                  style={styles.input}
                  disabled={isSubmitting || showSuccess}
                />
                {formData.name && <span style={styles.inputCheck}>✓</span>}
              </div>
            </div>

            {/* Gender Selection - Below Name, Above Category */}
            {!selectedCategory && !showSuccess && (
              <div style={styles.genderSection}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionIcon}>⚧️</span>
                  <span style={styles.sectionTitle}>Select Gender</span>
                  <span style={styles.required}>*</span>
                </div>
                <div style={styles.genderButtons}>
                  {GENDER_OPTIONS.map((gender) => (
                    <button
                      key={gender.id}
                      style={{
                        ...styles.genderBtn,
                        borderColor: selectedGender === gender.id ? colors.blue : 'rgba(0, 168, 171, 0.20)',
                        background: selectedGender === gender.id 
                          ? `linear-gradient(135deg, ${colors.blue}, ${colors.darkBlue})`
                          : 'rgba(255, 255, 255, 0.7)',
                        color: selectedGender === gender.id ? 'white' : '#4a5568',
                        transform: selectedGender === gender.id ? 'scale(1.05)' : 'scale(1)',
                      }}
                      onClick={() => handleGenderSelect(gender.id)}
                      disabled={isSubmitting || showSuccess}
                    >
                      <span style={styles.genderIcon}>{gender.label.split(' ')[0]}</span>
                      <span>{gender.label.split(' ')[1]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Show selected gender when category is selected */}
            {selectedGender && !showSuccess && (
              <div style={styles.selectedGenderDisplay}>
                <span style={styles.selectedGenderLabel}>Gender:</span>
                <span style={styles.selectedGenderValue}>
                  {selectedGender === 'men' ? '👨 Men' : '👩 Women'}
                </span>
              </div>
            )}

            {/* Category Selection */}
            {!selectedCategory && !showSuccess && (
              <div style={styles.categorySection}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionIcon}>🎯</span>
                  <span style={styles.sectionTitle}>Select Category</span>
                </div>
                <CategorySelector
                  selectedCategory={selectedCategory}
                  onCategoryChange={handleCategoryChange}
                  categories={EVENT_CONFIG.categories}
                />
              </div>
            )}

            {/* Selected Category Display */}
            {selectedCategory && !showSuccess && (
              <div style={styles.selectedCategory}>
                <div style={styles.selectedCategoryContent}>
                  <span style={styles.selectedCategoryLabel}>Selected Category:</span>
                  <span style={styles.selectedCategoryName}>{selectedCategoryData?.name}</span>
                </div>
                <button 
                  style={styles.backBtnSmall}
                  onClick={handleBackToCategory}
                  disabled={isSubmitting}
                >
                  ← Back
                </button>
              </div>
            )}

            {/* Selected Event & Payment */}
            {selectedCategory && selectedEventDetails && !showSuccess && (
              <>
                <div style={styles.selectedEvent}>
                  <div style={styles.selectedEventInfo}>
                    <span style={styles.selectedEventLabel}>Selected Event:</span>
                    <div style={styles.selectedEventDetails}>
                      <span style={styles.selectedEventName}>{selectedEventDetails.name}</span>
                      <span style={styles.selectedEventDistance}>{selectedEventDetails.distance}</span>
                    </div>
                  </div>
                  <div style={styles.eventActions}>
                    <button 
                      style={styles.editBtn}
                      onClick={handleBackToEvent}
                      disabled={isSubmitting}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </div>

                <FeeDisplay
                  selectedEvent={selectedEvent}
                  events={selectedCategoryData.events}
                />
                
                <PaymentButtons onPaymentSelect={handlePaymentSelect} />
              </>
            )}

            <div style={styles.footer}>
              <span style={styles.footerText}>© 2026 Liloan Love the Life</span>
              <span style={styles.footerDot}>•</span>
              <span style={styles.footerText}>Powered by Liloan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals - Rendered outside using React Portal */}
      {selectedCategoryData && ReactDOM.createPortal(
        <EventModal
          isOpen={isEventModalOpen}
          onClose={closeEventModal}
          events={selectedCategoryData.events}
          selectedEvent={selectedEvent}
          onEventSelect={handleEventSelect}
          categoryName={selectedCategoryData.name}
          isEditing={isEditing}
        />,
        document.body
      )}

      {ReactDOM.createPortal(
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={closePaymentModal}
          paymentMethod={selectedPayment}
          onFileUpload={handleFileUpload}
          onSubmit={handleFinalSubmit}
        />,
        document.body
      )}
    </>
  );
};

// ============================================================
// STYLES - Professional 3D Design with Mobile Responsiveness
// ============================================================

const styles = {
  container: {
    width: '100%',
    maxWidth: '720px',
    margin: '0 auto',
    padding: '8px',
    animation: 'fadeInUp 0.6s ease',
  },
  formWrapper: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(20px) saturate(1.2)',
    borderRadius: '32px',
    padding: '32px 36px 24px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 20px 60px rgba(42, 73, 155, 0.30), 0 8px 24px rgba(0, 168, 171, 0.15), inset 0 1px 0 rgba(255,255,255,0.5)',
    transform: 'perspective(1200px) rotateX(2deg) rotateY(-0.5deg)',
    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease',
    overflow: 'hidden',
  },
  decorativeTop: {
    position: 'absolute',
    top: '-40px',
    right: '-40px',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${colors.yellow}40, transparent 70%)`,
    pointerEvents: 'none',
  },
  decorativeBottom: {
    position: 'absolute',
    bottom: '-60px',
    left: '-60px',
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${colors.teal}30, transparent 70%)`,
    pointerEvents: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '28px',
    paddingBottom: '16px',
    borderBottom: '2px solid rgba(0, 168, 171, 0.10)',
    position: 'relative',
    zIndex: 1,
    flexWrap: 'wrap',
  },
  headerIcon: {
    fontSize: '2.2rem',
    animation: 'bounce 2s ease-in-out infinite',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: '1.6rem',
    fontWeight: 700,
    background: `linear-gradient(135deg, ${colors.darkBlue}, ${colors.blue})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
    letterSpacing: '-0.5px',
    minWidth: '120px',
  },
  headerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 16px',
    background: `rgba(104, 180, 45, 0.12)`,
    borderRadius: '20px',
    border: `1px solid ${colors.green}30`,
    flexShrink: 0,
  },
  badgeDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: colors.green,
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  badgeText: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: colors.green,
  },
  formContent: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
  },
  successMessage: {
    padding: '16px 20px',
    marginBottom: '20px',
    background: `linear-gradient(135deg, ${colors.green}15, ${colors.green}08)`,
    borderRadius: '16px',
    border: `2px solid ${colors.green}`,
    animation: 'successPulse 0.5s ease',
    width: '100%',
  },
  successContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
  },
  successEmoji: {
    fontSize: '2.2rem',
    animation: 'bounce 0.6s ease',
    flexShrink: 0,
  },
  successText: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#276749',
    display: 'block',
  },
  successSubtext: {
    fontSize: '0.85rem',
    color: '#4a7a5a',
    display: 'block',
    fontWeight: 400,
  },
  saveMessage: {
    padding: '12px 18px',
    borderRadius: '12px',
    marginBottom: '16px',
    fontWeight: 600,
    textAlign: 'center',
    border: '1px solid',
    width: '100%',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    marginBottom: '20px',
    background: 'rgba(10, 112, 186, 0.06)',
    borderRadius: '12px',
    border: '1px solid rgba(10, 112, 186, 0.12)',
    width: '100%',
    flexWrap: 'wrap',
  },
  userBadgeIcon: {
    fontSize: '1.1rem',
    flexShrink: 0,
  },
  userBadgeText: {
    fontSize: '0.9rem',
    color: '#4a5568',
    fontWeight: 500,
    wordBreak: 'break-word',
  },
  formGroup: {
    marginBottom: '22px',
    width: '100%',
  },
  label: {
    display: 'block',
    fontWeight: 600,
    color: colors.darkBlue,
    marginBottom: '8px',
    fontSize: '0.9rem',
    letterSpacing: '0.3px',
  },
  labelIcon: {
    marginRight: '6px',
  },
  required: {
    color: '#e53e3e',
    marginLeft: '4px',
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  input: {
    width: '100%',
    padding: '14px 48px 14px 18px',
    border: '2px solid rgba(0, 168, 171, 0.20)',
    borderRadius: '16px',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    background: 'rgba(255, 255, 255, 0.7)',
    boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.02)',
    boxSizing: 'border-box',
  },
  inputCheck: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: colors.green,
    fontWeight: 700,
    fontSize: '1.1rem',
  },
  genderSection: {
    marginBottom: '20px',
    width: '100%',
  },
  genderButtons: {
    display: 'flex',
    gap: '12px',
    width: '100%',
  },
  genderBtn: {
    flex: 1,
    padding: '14px 20px',
    border: '2px solid',
    borderRadius: '16px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minHeight: '56px',
  },
  genderIcon: {
    fontSize: '1.4rem',
  },
  selectedGenderDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    marginBottom: '16px',
    background: 'rgba(10, 112, 186, 0.06)',
    borderRadius: '12px',
    border: '1px solid rgba(10, 112, 186, 0.15)',
    width: '100%',
  },
  selectedGenderLabel: {
    fontWeight: 600,
    color: '#4a5568',
    fontSize: '0.85rem',
  },
  selectedGenderValue: {
    fontWeight: 700,
    color: colors.blue,
    fontSize: '0.95rem',
  },
  categorySection: {
    marginBottom: '20px',
    width: '100%',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  sectionIcon: {
    fontSize: '1.1rem',
    flexShrink: 0,
  },
  sectionTitle: {
    fontWeight: 600,
    color: colors.darkBlue,
    fontSize: '0.95rem',
  },
  selectedCategory: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    marginBottom: '16px',
    background: 'rgba(10, 112, 186, 0.06)',
    borderRadius: '16px',
    border: '2px solid rgba(10, 112, 186, 0.15)',
    width: '100%',
    flexWrap: 'wrap',
    gap: '10px',
  },
  selectedCategoryContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    flex: 1,
  },
  selectedCategoryLabel: {
    fontWeight: 600,
    color: '#4a5568',
    fontSize: '0.85rem',
  },
  selectedCategoryName: {
    fontWeight: 700,
    color: colors.blue,
    fontSize: '0.95rem',
  },
  backBtnSmall: {
    padding: '6px 16px',
    background: 'rgba(237, 242, 247, 0.8)',
    border: '2px solid #e2e8f0',
    borderRadius: '30px',
    color: '#4a5568',
    fontWeight: 600,
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    flexShrink: 0,
  },
  selectedEvent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    marginBottom: '16px',
    background: 'rgba(255, 255, 255, 0.7)',
    borderRadius: '16px',
    border: '2px solid rgba(0, 168, 171, 0.15)',
    transition: 'all 0.3s ease',
    width: '100%',
    flexWrap: 'wrap',
    gap: '12px',
  },
  selectedEventInfo: {
    flex: 1,
    minWidth: '120px',
  },
  selectedEventLabel: {
    display: 'block',
    fontWeight: 600,
    color: '#5a6a7e',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  selectedEventDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  selectedEventName: {
    fontWeight: 700,
    color: colors.darkBlue,
    fontSize: '1.05rem',
  },
  selectedEventDistance: {
    color: '#718096',
    fontSize: '0.85rem',
    background: 'rgba(237, 242, 247, 0.8)',
    padding: '4px 14px',
    borderRadius: '20px',
  },
  eventActions: {
    display: 'flex',
    gap: '10px',
    flexShrink: 0,
  },
  editBtn: {
    padding: '8px 20px',
    background: 'white',
    border: '2px solid',
    borderColor: colors.blue,
    borderRadius: '30px',
    color: colors.blue,
    fontWeight: 700,
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  changeCategoryContainer: {
    marginTop: '16px',
    width: '100%',
  },
  changeCategoryBtn: {
    width: '100%',
    padding: '14px',
    background: 'rgba(255, 245, 245, 0.9)',
    border: '2px solid #fc8181',
    borderRadius: '30px',
    color: '#c53030',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  footer: {
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(0, 168, 171, 0.08)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    position: 'relative',
    zIndex: 1,
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: '0.75rem',
    color: '#a0aec0',
  },
  footerDot: {
    fontSize: '0.5rem',
    color: '#cbd5e0',
  },
};

// ============================================================
// CSS KEYFRAMES & HOVER EFFECTS (injected)
// ============================================================

if (!document.getElementById('registration-form-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'registration-form-styles';
  styleSheet.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes bounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }

    @keyframes successPulse {
      0% { transform: scale(0.8); opacity: 0; }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); opacity: 1; }
    }

    /* Hover Effects */
    .form-wrapper:hover {
      transform: perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(-6px) !important;
      box-shadow: 0 30px 80px rgba(42, 73, 155, 0.35), 0 0 0 2px rgba(237, 219, 11, 0.15), 0 0 0 4px rgba(104, 180, 45, 0.08) !important;
    }

    .name-input:focus {
      outline: none;
      border-color: #0A70BA !important;
      box-shadow: 0 0 0 4px rgba(10, 112, 186, 0.12), inset 0 2px 6px rgba(0,0,0,0.04) !important;
      background: white !important;
    }

    .gender-btn:hover {
      border-color: #0A70BA !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 4px 16px rgba(10, 112, 186, 0.15) !important;
    }

    .back-btn-sm:hover {
      background: #e2e8f0 !important;
      transform: scale(1.05) !important;
    }

    .edit-btn:hover {
      background: linear-gradient(135deg, #2A499B, #0A70BA) !important;
      color: white !important;
      transform: scale(1.05) !important;
      box-shadow: 0 6px 20px rgba(10, 112, 186, 0.30) !important;
    }

    .change-category-btn:hover {
      background: #fed7d7 !important;
      transform: scale(1.02) !important;
    }

    .selected-event:hover {
      border-color: #0A70BA !important;
      box-shadow: 0 4px 16px rgba(10, 112, 186, 0.08) !important;
    }

    .selected-category:hover {
      border-color: #0A70BA !important;
      box-shadow: 0 4px 16px rgba(10, 112, 186, 0.08) !important;
    }

    button:disabled {
      opacity: 0.6 !important;
      cursor: not-allowed !important;
      transform: none !important;
    }

    /* Mobile Responsive - Phone */
    @media (max-width: 640px) {
      .container {
        padding: 4px !important;
      }

      .form-wrapper {
        padding: 20px 16px !important;
        border-radius: 20px !important;
      }

      .header {
        gap: 10px !important;
        justify-content: center !important;
        text-align: center !important;
      }

      .header-icon {
        font-size: 1.8rem !important;
      }

      .title {
        font-size: 1.2rem !important;
        text-align: center !important;
        min-width: 100% !important;
        flex: none !important;
      }

      .header-badge {
        width: 100% !important;
        justify-content: center !important;
      }

      .gender-buttons {
        flex-direction: column !important;
      }

      .gender-btn {
        min-width: 100% !important;
        width: 100% !important;
        padding: 12px !important;
      }

      .success-content {
        flex-direction: column !important;
        text-align: center !important;
      }

      .success-emoji {
        font-size: 1.8rem !important;
      }

      .success-text {
        font-size: 1rem !important;
      }

      .user-badge {
        flex-direction: column !important;
        text-align: center !important;
        padding: 12px !important;
      }

      .selected-event {
        flex-direction: column !important;
        align-items: stretch !important;
      }

      .selected-event-details {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 6px !important;
      }

      .event-actions {
        width: 100% !important;
      }

      .edit-btn {
        width: 100% !important;
        justify-content: center !important;
        padding: 10px !important;
      }

      .selected-category {
        flex-direction: column !important;
        align-items: stretch !important;
        text-align: center !important;
      }

      .selected-category-content {
        justify-content: center !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 4px !important;
      }

      .back-btn-sm {
        width: 100% !important;
        text-align: center !important;
        justify-content: center !important;
        padding: 8px !important;
      }

      .category-buttons {
        flex-direction: column !important;
      }

      .category-btn {
        min-width: 100% !important;
        width: 100% !important;
        text-align: center !important;
        padding: 12px !important;
      }

      .payment-methods {
        flex-direction: column !important;
      }

      .payment-btn {
        min-width: 100% !important;
        width: 100% !important;
        text-align: center !important;
        padding: 14px !important;
      }

      .fee-card {
        flex-direction: column !important;
        gap: 8px !important;
        text-align: center !important;
      }

      .fee-card .fee-info {
        flex-direction: column !important;
        gap: 4px !important;
      }

      .footer {
        flex-direction: column !important;
        gap: 4px !important;
        text-align: center !important;
      }

      .input {
        padding: 12px 44px 12px 14px !important;
        font-size: 0.9rem !important;
      }

      .change-category-btn {
        padding: 12px !important;
        font-size: 0.85rem !important;
      }

      .modal-content {
        padding: 24px 16px !important;
        margin: 10px !important;
        border-radius: 20px !important;
      }

      .event-select-btn {
        padding: 12px 16px !important;
      }

      .event-select-btn .event-details {
        flex-direction: column !important;
        gap: 4px !important;
      }

      .qr-code {
        width: 120px !important;
        height: 120px !important;
      }

      .upload-container {
        padding: 16px !important;
      }

      .file-input-label {
        flex-wrap: wrap !important;
        gap: 8px !important;
        padding: 10px !important;
      }

      .file-text {
        width: 100% !important;
        text-align: center !important;
        font-size: 0.85rem !important;
      }

      .file-browse-btn {
        width: 100% !important;
        text-align: center !important;
        padding: 6px !important;
      }

      .submit-btn {
        font-size: 0.9rem !important;
        padding: 14px !important;
      }

      .selected-gender-display {
        flex-direction: column !important;
        text-align: center !important;
        gap: 4px !important;
      }
    }

    /* Very Small Phones */
    @media (max-width: 380px) {
      .form-wrapper {
        padding: 16px 12px !important;
        border-radius: 16px !important;
      }

      .title {
        font-size: 1rem !important;
      }

      .header-icon {
        font-size: 1.5rem !important;
      }

      .input {
        padding: 10px 40px 10px 12px !important;
        font-size: 0.8rem !important;
      }

      .selected-event-name {
        font-size: 0.9rem !important;
      }

      .selected-event-distance {
        font-size: 0.75rem !important;
        padding: 2px 10px !important;
      }

      .category-btn {
        font-size: 0.8rem !important;
        padding: 10px !important;
      }

      .payment-btn {
        font-size: 0.8rem !important;
        padding: 10px !important;
      }

      .gender-btn {
        font-size: 0.85rem !important;
        padding: 10px !important;
        min-height: 44px !important;
      }

      .fee-card .fee-amount {
        font-size: 1.1rem !important;
      }

      .success-text {
        font-size: 0.9rem !important;
      }

      .success-subtext {
        font-size: 0.75rem !important;
      }

      .user-badge-text {
        font-size: 0.8rem !important;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default RegistrationForm;