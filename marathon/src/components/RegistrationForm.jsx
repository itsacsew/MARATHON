import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import CategoryModal from './CategoryModal';
import EventModal from './EventModal';
import EventSummaryModal from './EventSummaryModal';
import FeeDisplay from './FeeDisplay';
import PaymentButtons from './PaymentButtons';
import PaymentModal from './PaymentModal';
import SuccessModal from './SuccessModal';
import { EVENT_CONFIG } from '../config/eventConfig';
import { useAuth } from '../contexts/AuthContext';

// Color theme
const colors = {
  yellow: '#EDDB0B',
  green: '#68B42D',
  teal: '#00A8AB',
  blue: '#0A70BA',
  darkBlue: '#2A499B',
};

// Gender options
const GENDER_OPTIONS = [
  { id: 'Male', label: '👨 Male' },
  { id: 'Female', label: '👩 Female' }
];

// Blood type options
const BLOOD_TYPE_OPTIONS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'
];

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    birthdate: '',
    age: '',
    gender: '',
    bloodType: '',
    mobileNumber: '',
    email: '',
    homeAddress: '',
    emergencyContact: '',
    emergencyNumber: '',
    category: '',
    event: '',
    shirtSize: '',
    agreedToWaiver: false
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedBloodType, setSelectedBloodType] = useState('');
  const [selectedShirtSize, setSelectedShirtSize] = useState('');
  const [agreedToWaiver, setAgreedToWaiver] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [registrationData, setRegistrationData] = useState(null);
  const [showCategoryStep, setShowCategoryStep] = useState(false);

  const { currentUser, saveRegistration, userData } = useAuth();

  const selectedCategoryData = EVENT_CONFIG.categories.find(
    cat => cat.id === selectedCategory
  );

  // Calculate age from birthdate
  const calculateAge = (birthdate) => {
    if (!birthdate) return '';
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Handle birthdate change - auto calculate age
  const handleBirthdateChange = (e) => {
    const birthdate = e.target.value;
    const age = calculateAge(birthdate);
    setFormData({
      ...formData,
      birthdate: birthdate,
      age: age
    });
  };

  // Handle Proceed button click - opens category modal
  const handleProceedToCategory = () => {
    // Validate all required fields
    if (!formData.name.trim()) {
      setSaveMessage('❌ Please enter your full name');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    if (!formData.birthdate) {
      setSaveMessage('❌ Please enter your birthdate');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    if (!formData.gender) {
      setSaveMessage('❌ Please select your gender');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    if (!formData.bloodType) {
      setSaveMessage('❌ Please select your blood type');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    if (!formData.mobileNumber.trim()) {
      setSaveMessage('❌ Please enter your mobile number');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    if (!formData.email.trim()) {
      setSaveMessage('❌ Please enter your email address');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    if (!formData.homeAddress.trim()) {
      setSaveMessage('❌ Please enter your home address');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    if (!formData.emergencyContact.trim()) {
      setSaveMessage('❌ Please enter emergency contact person');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    if (!formData.emergencyNumber.trim()) {
      setSaveMessage('❌ Please enter emergency contact number');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    // Open category modal
    setIsCategoryModalOpen(true);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedEvent(null);
    setFormData({
      ...formData,
      category: categoryId,
      event: ''
    });
    setIsCategoryModalOpen(false);
    setIsEventModalOpen(true);
    setIsEditing(false);
    setShowCategoryStep(true);
  };

  const handleEventSelect = (eventId) => {
    setSelectedEvent(eventId);
    setFormData({
      ...formData,
      event: eventId
    });
    setIsEventModalOpen(false);
    setIsEditing(false);
  };

  // Handle proceed from event modal with shirt size and waiver
  const handleEventProceed = (data) => {
    setSelectedEvent(data.eventId);
    setSelectedShirtSize(data.shirtSize);
    setAgreedToWaiver(data.agreedToWaiver || false);
    setFormData({
      ...formData,
      event: data.eventId,
      shirtSize: data.shirtSize,
      agreedToWaiver: data.agreedToWaiver || false
    });
    setIsEventModalOpen(false);
    // Open summary modal
    setIsSummaryModalOpen(true);
  };

  const handleGenderSelect = (genderId) => {
    setSelectedGender(genderId);
    setFormData({
      ...formData,
      gender: genderId
    });
    if (saveMessage.includes('gender')) {
      setSaveMessage('');
    }
  };

  const handleBloodTypeSelect = (bloodType) => {
    setSelectedBloodType(bloodType);
    setFormData({
      ...formData,
      bloodType: bloodType
    });
    if (saveMessage.includes('blood type')) {
      setSaveMessage('');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error messages
    if (saveMessage.includes(name)) {
      setSaveMessage('');
    }
  };

  const handlePaymentSelect = (paymentId) => {
    setSelectedPayment(paymentId);
    setIsSummaryModalOpen(false);
    setIsPaymentModalOpen(true);
    setUploadedFile(null);
    setReferenceNumber('');
  };

  const handleFileUpload = (fileData) => {
    setUploadedFile(fileData);
    if (fileData.referenceNumber) {
      setReferenceNumber(fileData.referenceNumber);
    }
  };

  const handleFinalSubmit = async (paymentData) => {
    if (!currentUser || !selectedCategoryData || !selectedEvent || !formData.gender) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const eventDetails = selectedCategoryData.events.find(e => e.id === selectedEvent);
      if (!eventDetails) {
        throw new Error('Event not found');
      }

      const registrationDataToSave = {
        userName: formData.name,
        birthdate: formData.birthdate,
        age: formData.age,
        gender: formData.gender,
        bloodType: formData.bloodType,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        homeAddress: formData.homeAddress,
        emergencyContact: formData.emergencyContact,
        emergencyNumber: formData.emergencyNumber,
        category: selectedCategoryData.name,
        categoryId: selectedCategory,
        eventName: eventDetails.name,
        eventId: selectedEvent,
        distance: eventDetails.distance,
        fee: eventDetails.fee,
        shirtSize: formData.shirtSize || selectedShirtSize,
        agreedToWaiver: formData.agreedToWaiver || agreedToWaiver,
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber || '',
        hasReceipt: true,
        receiptFileName: paymentData.receiptFile?.name || 'receipt.jpg',
        receiptPreview: paymentData.receiptPreview || null,
        status: 'completed',
        registeredAt: new Date().toISOString()
      };
      
      await saveRegistration(currentUser.uid, registrationDataToSave);
      
      setRegistrationData({
        ...registrationDataToSave,
        name: formData.name,
        paymentDate: new Date().toISOString()
      });
      
      setIsPaymentModalOpen(false);
      setIsSuccessModalOpen(true);
      
      setTimeout(() => {
        setFormData({
          name: '',
          birthdate: '',
          age: '',
          gender: '',
          bloodType: '',
          mobileNumber: '',
          email: '',
          homeAddress: '',
          emergencyContact: '',
          emergencyNumber: '',
          category: '',
          event: '',
          shirtSize: '',
          agreedToWaiver: false
        });
        setSelectedCategory(null);
        setSelectedEvent(null);
        setSelectedGender(null);
        setSelectedBloodType('');
        setSelectedShirtSize('');
        setAgreedToWaiver(false);
        setSelectedPayment(null);
        setUploadedFile(null);
        setReferenceNumber('');
        setShowSuccess(false);
        setSaveMessage('');
        setShowCategoryStep(false);
      }, 500);
      
    } catch (error) {
      console.error('Error submitting registration:', error);
      setSaveMessage('❌ Failed to submit registration');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
  };

  const closeSummaryModal = () => {
    setIsSummaryModalOpen(false);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setReferenceNumber('');
  };

  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setRegistrationData(null);
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
    setShowCategoryStep(false);
    setIsCategoryModalOpen(true);
    setIsSummaryModalOpen(false);
  };

  const handleBackToEvent = () => {
    if (selectedCategory) {
      setIsSummaryModalOpen(false);
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
            {/* Save Message */}
            {saveMessage && (
              <div style={{
                ...styles.saveMessage,
                background: saveMessage.includes('❌') 
                  ? 'rgba(254, 215, 215, 0.9)' 
                  : 'rgba(104, 180, 45, 0.12)',
                borderColor: saveMessage.includes('❌')
                  ? '#fc8181'
                  : colors.green,
                color: saveMessage.includes('❌')
                  ? '#c53030'
                  : '#276749'
              }}>
                {saveMessage}
              </div>
            )}

            {/* PERSONAL INFORMATION SECTION */}
            <div style={styles.sectionContainer}>
              <h2 style={styles.sectionTitle}>📋 Personal Information</h2>
              
              {/* Full Name */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Full Name
                  <span style={styles.required}>*</span>
                </label>
                <div style={styles.inputWrapper}>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={styles.input}
                    disabled={isSubmitting || showSuccess || showCategoryStep}
                  />
                  {formData.name && <span style={styles.inputCheck}>✓</span>}
                </div>
              </div>

              {/* Birthdate and Age - Row */}
              <div style={styles.row}>
                <div style={styles.rowItem2}>
                  <label style={styles.label}>
                    Birthdate
                    <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="date"
                    name="birthdate"
                    value={formData.birthdate}
                    onChange={handleBirthdateChange}
                    style={styles.input}
                    disabled={isSubmitting || showSuccess || showCategoryStep}
                  />
                </div>
                <div style={styles.rowItem1}>
                  <label style={styles.label}>Age</label>
                  <input
                    type="text"
                    name="age"
                    value={formData.age}
                    style={{...styles.input, background: '#f7fafc'}}
                    disabled
                  />
                </div>
              </div>

              {/* Gender and Blood Type - Row */}
              <div style={styles.row}>
                <div style={styles.rowItem}>
                  <label style={styles.label}>
                    Gender
                    <span style={styles.required}>*</span>
                  </label>
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
                        }}
                        onClick={() => handleGenderSelect(gender.id)}
                        disabled={isSubmitting || showSuccess || showCategoryStep}
                      >
                        <span style={styles.genderIcon}>{gender.label.split(' ')[0]}</span>
                        <span>{gender.label.split(' ')[1]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
              </div>
              <div style={styles.rowItem}>
                  <label style={styles.label}>
                    Blood Type
                    <span style={styles.required}>*</span>
                  </label>
                  <select
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={(e) => handleBloodTypeSelect(e.target.value)}
                    style={styles.select}
                    disabled={isSubmitting || showSuccess || showCategoryStep}
                  >
                    <option value="">Select Blood Type</option>
                    {BLOOD_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
            </div>

            {/* CONTACT & EMERGENCY DETAILS SECTION */}
            <div style={styles.sectionContainer}>
              <h2 style={styles.sectionTitle}>📞 Contact & Emergency Details</h2>

              {/* Mobile Number */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Mobile Number
                  <span style={styles.required}>*</span>
                </label>
                <input
                  type="tel"
                  name="mobileNumber"
                  placeholder="Enter your mobile number"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  style={styles.input}
                  disabled={isSubmitting || showSuccess || showCategoryStep}
                />
              </div>

              {/* Email Address */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Email Address
                  <span style={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={styles.input}
                  disabled={isSubmitting || showSuccess || showCategoryStep}
                />
              </div>

              {/* Home Address */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Home Address
                  <span style={styles.required}>*</span>
                </label>
                <textarea
                  name="homeAddress"
                  placeholder="Enter your home address"
                  value={formData.homeAddress}
                  onChange={handleInputChange}
                  style={styles.textarea}
                  rows="2"
                  disabled={isSubmitting || showSuccess || showCategoryStep}
                />
              </div>
              <div style={styles.rowItem}>
                  <label style={styles.label}>
                    Emergency Contact Person
                    <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="emergencyContact"
                    placeholder="Full name of contact person"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    style={styles.input}
                    disabled={isSubmitting || showSuccess || showCategoryStep}
                  />
                </div>
              <div style={styles.rowItem}>
                  <label style={styles.label}>
                    Emergency Contact No.
                    <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="emergencyNumber"
                    placeholder="Contact number"
                    value={formData.emergencyNumber}
                    onChange={handleInputChange}
                    style={styles.input}
                    disabled={isSubmitting || showSuccess || showCategoryStep}
                  />
                </div>
            </div>

            {/* PROCEED Button */}
            {!showCategoryStep && (
              <button 
                style={styles.proceedBtn}
                onClick={handleProceedToCategory}
                disabled={isSubmitting || showSuccess}
              >
                <span style={styles.proceedIcon}>🚀</span>
                Proceed to Category Selection
              </button>
            )}

            {/* Selected Category Display */}
            {selectedCategory && showCategoryStep && !showSuccess && !isSummaryModalOpen && (
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
                  ← Change
                </button>
              </div>
            )}

            {/* Selected Event Display */}
            {selectedCategory && selectedEventDetails && showCategoryStep && !showSuccess && (
              <>
                <div style={styles.selectedEvent}>
                  <div style={styles.selectedEventInfo}>
                    <span style={styles.selectedEventLabel}>Selected Event:</span>
                    <div style={styles.selectedEventDetails}>
                      <span style={styles.selectedEventName}>{selectedEventDetails.name}</span>
                      <span style={styles.selectedEventDistance}>{selectedEventDetails.distance}</span>
                    </div>
                    {selectedShirtSize && (
                      <div style={styles.selectedShirtSizeDisplay}>
                        <span style={styles.selectedShirtSizeLabel}>👕 Shirt Size:</span>
                        <span style={styles.selectedShirtSizeValue}>{selectedShirtSize}</span>
                      </div>
                    )}
                  </div>
                  <div style={styles.eventActions}>
                    <button 
                      style={styles.editBtn}
                      onClick={handleBackToEvent}
                      disabled={isSubmitting}
                    >
                      ✏️ Change Event
                    </button>
                    <button 
                      style={styles.viewSummaryBtn}
                      onClick={() => setIsSummaryModalOpen(true)}
                      disabled={isSubmitting}
                    >
                      📋 View Summary
                    </button>
                  </div>
                </div>
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

      {/* Category Modal */}
      {ReactDOM.createPortal(
        <CategoryModal
          isOpen={isCategoryModalOpen}
          onClose={closeCategoryModal}
          onCategorySelect={handleCategorySelect}
          categories={EVENT_CONFIG.categories}
        />,
        document.body
      )}

      {/* Event Modal */}
      {selectedCategoryData && ReactDOM.createPortal(
        <EventModal
          isOpen={isEventModalOpen}
          onClose={closeEventModal}
          events={selectedCategoryData.events}
          selectedEvent={selectedEvent}
          onEventSelect={handleEventSelect}
          onProceed={handleEventProceed}
          categoryName={selectedCategoryData.name}
          isEditing={isEditing}
        />,
        document.body
      )}

      {/* Summary Modal */}
      {selectedCategoryData && selectedEvent && ReactDOM.createPortal(
        <EventSummaryModal
          isOpen={isSummaryModalOpen}
          onClose={closeSummaryModal}
          selectedEvent={selectedEvent}
          events={selectedCategoryData.events}
          categoryName={selectedCategoryData.name}
          selectedCategory={selectedCategory}
          onPaymentSelect={handlePaymentSelect}
          onBackToEvent={handleBackToEvent}
          isSubmitting={isSubmitting}
          shirtSize={selectedShirtSize || formData.shirtSize || 'N/A'}
        />,
        document.body
      )}

      {/* Payment Modal */}
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

      {/* Success Modal */}
      {ReactDOM.createPortal(
        <SuccessModal
          isOpen={isSuccessModalOpen}
          onClose={closeSuccessModal}
          registrationData={registrationData}
        />,
        document.body
      )}
    </>
  );
};

// ============================================================
// STYLES - (Keep your existing styles here)
// ============================================================

const styles = {
  container: {
    width: '100%',
    maxWidth: '100%',
    margin: '0 auto',
    padding: 'clamp(8px, 2vw, 24px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    animation: 'fadeInUp 0.6s ease',
    boxSizing: 'border-box',
  },
  formWrapper: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px) saturate(1.2)',
    borderRadius: 'clamp(20px, 4vw, 40px)',
    padding: 'clamp(16px, 4vw, 48px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 20px 60px rgba(42, 73, 155, 0.30), 0 8px 24px rgba(0, 168, 171, 0.15), inset 0 1px 0 rgba(255,255,255,0.5)',
    transform: 'perspective(1200px) rotateX(1deg)',
    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease',
    overflow: 'hidden',
    width: '100%',
    maxWidth: 'clamp(340px, 90vw, 900px)',
    boxSizing: 'border-box',
  },
  decorativeTop: {
    position: 'absolute',
    top: '-40px',
    right: '-40px',
    width: 'clamp(80px, 15vw, 120px)',
    height: 'clamp(80px, 15vw, 120px)',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${colors.yellow}40, transparent 70%)`,
    pointerEvents: 'none',
  },
  decorativeBottom: {
    position: 'absolute',
    bottom: '-60px',
    left: '-60px',
    width: 'clamp(100px, 18vw, 160px)',
    height: 'clamp(100px, 18vw, 160px)',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${colors.teal}30, transparent 70%)`,
    pointerEvents: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'clamp(8px, 2vw, 14px)',
    marginBottom: 'clamp(16px, 4vw, 28px)',
    paddingBottom: 'clamp(12px, 2vw, 16px)',
    borderBottom: '2px solid rgba(0, 168, 171, 0.10)',
    position: 'relative',
    zIndex: 1,
    flexWrap: 'wrap',
  },
  headerIcon: {
    fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
    animation: 'bounce 2s ease-in-out infinite',
    flexShrink: 0,
  },
  title: {
    fontSize: 'clamp(1rem, 4vw, 1.8rem)',
    fontWeight: 700,
    background: `linear-gradient(135deg, ${colors.darkBlue}, ${colors.blue})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
    letterSpacing: '-0.5px',
    textAlign: 'center',
    flex: '1 1 auto',
    minWidth: 'clamp(120px, 30vw, 200px)',
  },
  headerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: 'clamp(3px, 1vw, 6px) clamp(10px, 2vw, 16px)',
    background: `rgba(104, 180, 45, 0.12)`,
    borderRadius: '20px',
    border: `1px solid ${colors.green}30`,
    flexShrink: 0,
  },
  badgeDot: {
    width: 'clamp(6px, 1.5vw, 8px)',
    height: 'clamp(6px, 1.5vw, 8px)',
    borderRadius: '50%',
    background: colors.green,
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  badgeText: {
    fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)',
    fontWeight: 600,
    color: colors.green,
  },
  formContent: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  saveMessage: {
    padding: 'clamp(10px, 2vw, 14px) clamp(14px, 2.5vw, 18px)',
    borderRadius: '12px',
    marginBottom: 'clamp(12px, 2vw, 16px)',
    fontWeight: 600,
    textAlign: 'center',
    border: '1px solid',
    width: '100%',
    fontSize: 'clamp(0.8rem, 1.8vw, 0.95rem)',
    boxSizing: 'border-box',
  },
  sectionContainer: {
    marginBottom: 'clamp(16px, 3vw, 28px)',
    padding: 'clamp(12px, 2.5vw, 24px)',
    background: 'rgba(247, 250, 252, 0.5)',
    borderRadius: 'clamp(12px, 2vw, 16px)',
    border: '1px solid rgba(0, 168, 171, 0.08)',
    width: '100%',
    boxSizing: 'border-box',
  },
  sectionTitle: {
    fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
    fontWeight: 700,
    color: colors.darkBlue,
    marginBottom: 'clamp(12px, 2vw, 18px)',
    paddingBottom: 'clamp(8px, 1.5vw, 10px)',
    borderBottom: '2px solid rgba(10, 112, 186, 0.08)',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 'clamp(12px, 2vw, 16px)',
    width: '100%',
    boxSizing: 'border-box',
  },
  label: {
    display: 'block',
    fontWeight: 600,
    color: colors.darkBlue,
    marginBottom: 'clamp(4px, 1vw, 6px)',
    fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
    letterSpacing: '0.3px',
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
    padding: 'clamp(10px, 2vw, 14px) clamp(14px, 3vw, 20px)',
    paddingRight: 'clamp(36px, 8vw, 48px)',
    border: '2px solid rgba(0, 168, 171, 0.20)',
    borderRadius: 'clamp(10px, 1.5vw, 14px)',
    fontSize: 'clamp(0.85rem, 2vw, 1rem)',
    transition: 'all 0.3s ease',
    background: 'rgba(255, 255, 255, 0.7)',
    boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.02)',
    boxSizing: 'border-box',
    color: '#2d3748',
    minHeight: 'clamp(40px, 6vw, 52px)',
  },
  textarea: {
    width: '100%',
    padding: 'clamp(10px, 2vw, 14px) clamp(14px, 2.5vw, 18px)',
    border: '2px solid rgba(0, 168, 171, 0.20)',
    borderRadius: 'clamp(10px, 1.5vw, 14px)',
    fontSize: 'clamp(0.85rem, 2vw, 1rem)',
    transition: 'all 0.3s ease',
    background: 'rgba(255, 255, 255, 0.7)',
    boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.02)',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
    color: '#2d3748',
    minHeight: 'clamp(60px, 8vw, 80px)',
  },
  select: {
    width: '100%',
    padding: 'clamp(10px, 2vw, 14px) clamp(14px, 2.5vw, 18px)',
    border: '2px solid rgba(0, 168, 171, 0.20)',
    borderRadius: 'clamp(10px, 1.5vw, 14px)',
    fontSize: 'clamp(0.85rem, 2vw, 1rem)',
    transition: 'all 0.3s ease',
    background: 'rgba(255, 255, 255, 0.7)',
    boxSizing: 'border-box',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234a5568' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    color: '#2d3748',
    minHeight: 'clamp(40px, 6vw, 52px)',
  },
  inputCheck: {
    position: 'absolute',
    right: 'clamp(10px, 2vw, 14px)',
    top: '50%',
    transform: 'translateY(-50%)',
    color: colors.green,
    fontWeight: 700,
    fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'clamp(10px, 2vw, 16px)',
    width: '100%',
  },
  rowItem: {
    width: '100%',
    minWidth: 0,
  },
  rowItem1: {
    width: '60%',
    minWidth: 0,
    marginLeft: 55
  },
  rowItem2: {
    width: '120%',
    minWidth: 0,
  },
  genderButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'clamp(6px, 1.5vw, 10px)',
    width: '100%',
  },
  genderBtn: {
    padding: 'clamp(8px, 1.5vw, 12px) clamp(10px, 2vw, 16px)',
    border: '2px solid',
    borderRadius: 'clamp(10px, 1.5vw, 14px)',
    fontSize: 'clamp(0.8rem, 1.8vw, 0.95rem)',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'clamp(4px, 1vw, 8px)',
    minHeight: 'clamp(38px, 5vw, 48px)',
    width: '100%',
  },
  genderIcon: {
    fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
  },
  proceedBtn: {
    width: '100%',
    padding: 'clamp(14px, 2.5vw, 18px)',
    marginTop: 'clamp(6px, 1vw, 8px)',
    marginBottom: 'clamp(12px, 2vw, 16px)',
    background: `linear-gradient(135deg, ${colors.blue}, ${colors.darkBlue})`,
    color: 'white',
    border: 'none',
    borderRadius: 'clamp(30px, 5vw, 40px)',
    fontSize: 'clamp(0.95rem, 2.2vw, 1.1rem)',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'clamp(8px, 2vw, 12px)',
    boxShadow: '0 8px 24px rgba(10, 112, 186, 0.35)',
    minHeight: 'clamp(48px, 7vw, 60px)',
  },
  proceedIcon: {
    fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
  },
  selectedCategory: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'clamp(10px, 2vw, 14px) clamp(14px, 2.5vw, 18px)',
    marginBottom: 'clamp(12px, 2vw, 16px)',
    background: 'rgba(10, 112, 186, 0.06)',
    borderRadius: 'clamp(12px, 1.5vw, 16px)',
    border: '2px solid rgba(10, 112, 186, 0.15)',
    width: '100%',
    flexWrap: 'wrap',
    gap: 'clamp(6px, 1.5vw, 10px)',
    boxSizing: 'border-box',
  },
  selectedCategoryContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(6px, 1.5vw, 10px)',
    flexWrap: 'wrap',
    flex: '1 1 auto',
  },
  selectedCategoryLabel: {
    fontWeight: 600,
    color: '#4a5568',
    fontSize: 'clamp(0.75rem, 1.8vw, 0.9rem)',
  },
  selectedCategoryName: {
    fontWeight: 700,
    color: colors.blue,
    fontSize: 'clamp(0.8rem, 2vw, 1rem)',
  },
  backBtnSmall: {
    padding: 'clamp(4px, 1vw, 6px) clamp(10px, 2vw, 14px)',
    background: 'rgba(237, 242, 247, 0.8)',
    border: '2px solid #e2e8f0',
    borderRadius: 'clamp(20px, 4vw, 30px)',
    color: '#4a5568',
    fontWeight: 600,
    fontSize: 'clamp(0.65rem, 1.5vw, 0.8rem)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    flexShrink: 0,
    minHeight: 'clamp(30px, 4vw, 40px)',
  },
  selectedEvent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'clamp(10px, 2vw, 14px) clamp(14px, 2.5vw, 18px)',
    marginBottom: 'clamp(12px, 2vw, 16px)',
    background: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 'clamp(12px, 1.5vw, 16px)',
    border: '2px solid rgba(0, 168, 171, 0.15)',
    transition: 'all 0.3s ease',
    width: '100%',
    flexWrap: 'wrap',
    gap: 'clamp(8px, 2vw, 12px)',
    boxSizing: 'border-box',
  },
  selectedEventInfo: {
    flex: '1 1 auto',
    minWidth: 'clamp(80px, 20vw, 120px)',
  },
  selectedEventLabel: {
    display: 'block',
    fontWeight: 600,
    color: '#5a6a7e',
    fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  selectedEventDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(6px, 1.5vw, 10px)',
    flexWrap: 'wrap',
  },
  selectedEventName: {
    fontWeight: 700,
    color: colors.darkBlue,
    fontSize: 'clamp(0.85rem, 2vw, 1.05rem)',
  },
  selectedEventDistance: {
    color: '#718096',
    fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)',
    background: 'rgba(237, 242, 247, 0.8)',
    padding: 'clamp(2px, 0.5vw, 4px) clamp(8px, 1.5vw, 12px)',
    borderRadius: '20px',
  },
  selectedShirtSizeDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(6px, 1.5vw, 10px)',
    marginTop: '4px',
  },
  selectedShirtSizeLabel: {
    fontWeight: 600,
    color: '#5a6a7e',
    fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)',
  },
  selectedShirtSizeValue: {
    fontWeight: 700,
    color: '#0A70BA',
    fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)',
  },
  eventActions: {
    display: 'flex',
    gap: 'clamp(6px, 1.5vw, 10px)',
    flexShrink: 0,
  },
  editBtn: {
    padding: 'clamp(6px, 1.5vw, 10px) clamp(12px, 2vw, 18px)',
    background: 'white',
    border: '2px solid',
    borderColor: colors.blue,
    borderRadius: 'clamp(20px, 4vw, 30px)',
    color: colors.blue,
    fontWeight: 700,
    fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minHeight: 'clamp(34px, 5vw, 44px)',
    whiteSpace: 'nowrap',
  },
  viewSummaryBtn: {
    padding: 'clamp(6px, 1.5vw, 10px) clamp(12px, 2vw, 18px)',
    background: 'linear-gradient(135deg, #0A70BA, #2A499B)',
    color: 'white',
    border: 'none',
    borderRadius: 'clamp(20px, 4vw, 30px)',
    fontWeight: 700,
    fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minHeight: 'clamp(34px, 5vw, 44px)',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 16px rgba(10, 112, 186, 0.25)',
  },
  footer: {
    marginTop: 'clamp(16px, 3vw, 24px)',
    paddingTop: 'clamp(12px, 2vw, 16px)',
    borderTop: '1px solid rgba(0, 168, 171, 0.08)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 'clamp(4px, 1vw, 8px)',
    position: 'relative',
    zIndex: 1,
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)',
    color: '#a0aec0',
  },
  footerDot: {
    fontSize: 'clamp(0.4rem, 1vw, 0.5rem)',
    color: '#cbd5e0',
  },
};

// CSS Keyframes and Styles
if (!document.getElementById('registration-form-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'registration-form-styles';
  styleSheet.textContent = `
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes bounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }
    
    .form-wrapper:hover {
      transform: perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(-6px) !important;
      box-shadow: 0 30px 80px rgba(42, 73, 155, 0.35), 0 0 0 2px rgba(237, 219, 11, 0.15), 0 0 0 4px rgba(104, 180, 45, 0.08) !important;
    }
    
    input:focus, textarea:focus, select:focus {
      outline: none;
      border-color: #0A70BA !important;
      box-shadow: 0 0 0 3px rgba(10, 112, 186, 0.12) !important;
      background: white !important;
    }
    
    .gender-btn:hover {
      border-color: #0A70BA !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 4px 12px rgba(10, 112, 186, 0.12) !important;
    }
    
    .proceed-btn:hover {
      transform: translateY(-3px) scale(1.02) !important;
      box-shadow: 0 12px 32px rgba(10, 112, 186, 0.45) !important;
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
    
    .view-summary-btn:hover {
      transform: scale(1.05) !important;
      box-shadow: 0 8px 24px rgba(10, 112, 186, 0.35) !important;
    }
    
    button:disabled {
      opacity: 0.6 !important;
      cursor: not-allowed !important;
      transform: none !important;
    }
    
    /* Ultra Small Phones (under 320px) */
    @media (max-width: 320px) {
      .container { padding: 4px !important; }
      .form-wrapper { padding: 12px 10px !important; border-radius: 12px !important; }
      .title { font-size: 0.9rem !important; }
      .header-icon { font-size: 1.2rem !important; }
      .row { grid-template-columns: 1fr !important; gap: 8px !important; }
      .gender-buttons { grid-template-columns: 1fr !important; }
      .input, .select, .textarea { padding: 8px 10px !important; font-size: 0.75rem !important; min-height: 32px !important; }
      .gender-btn { font-size: 0.75rem !important; padding: 6px !important; min-height: 32px !important; }
      .proceed-btn { font-size: 0.8rem !important; padding: 10px !important; min-height: 38px !important; }
      .section-container { padding: 8px !important; }
      .section-title { font-size: 0.8rem !important; }
      .edit-btn, .view-summary-btn { font-size: 0.65rem !important; padding: 4px 10px !important; min-height: 28px !important; }
      .back-btn-sm { font-size: 0.6rem !important; padding: 4px 8px !important; min-height: 26px !important; }
      .footer-text { font-size: 0.5rem !important; }
    }
    
    /* Small Phones (321px - 480px) */
    @media (min-width: 321px) and (max-width: 480px) {
      .container { padding: 6px !important; }
      .form-wrapper { padding: 16px 12px !important; border-radius: 16px !important; }
      .row { grid-template-columns: 1fr !important; gap: 10px !important; }
      .gender-buttons { grid-template-columns: 1fr 1fr !important; }
      .title { font-size: 1.1rem !important; }
      .header-icon { font-size: 1.5rem !important; }
      .input, .select, .textarea { padding: 10px 12px !important; font-size: 0.85rem !important; min-height: 38px !important; }
      .gender-btn { font-size: 0.8rem !important; padding: 8px !important; min-height: 36px !important; }
      .proceed-btn { font-size: 0.9rem !important; padding: 12px !important; min-height: 44px !important; }
      .section-container { padding: 12px !important; }
      .section-title { font-size: 0.9rem !important; }
      .selected-event { flex-direction: column !important; align-items: stretch !important; }
      .event-actions { flex-direction: column !important; width: 100% !important; }
      .edit-btn, .view-summary-btn { width: 100% !important; justify-content: center !important; }
    }
    
    /* Medium Phones (481px - 768px) */
    @media (min-width: 481px) and (max-width: 768px) {
      .container { padding: 10px !important; }
      .form-wrapper { padding: 24px 20px !important; border-radius: 20px !important; }
      .row { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
      .title { font-size: 1.3rem !important; }
      .header-icon { font-size: 1.8rem !important; }
      .input, .select, .textarea { padding: 12px 14px !important; font-size: 0.9rem !important; min-height: 42px !important; }
      .gender-btn { font-size: 0.85rem !important; padding: 10px !important; min-height: 40px !important; }
      .proceed-btn { font-size: 1rem !important; padding: 14px !important; min-height: 50px !important; }
    }
    
    /* Large Phones & Tablets (769px - 1024px) */
    @media (min-width: 769px) and (max-width: 1024px) {
      .container { padding: 16px !important; }
      .form-wrapper { padding: 32px 36px !important; border-radius: 28px !important; max-width: 700px !important; }
      .title { font-size: 1.5rem !important; }
      .input, .select, .textarea { font-size: 0.95rem !important; padding: 14px 16px !important; min-height: 48px !important; }
    }
    
    /* Desktop & Large Screens (1025px+) */
    @media (min-width: 1025px) {
      .container { padding: 20px !important; }
      .form-wrapper { padding: 40px 48px !important; border-radius: 32px !important; max-width: 800px !important; }
      .title { font-size: 1.8rem !important; }
      .input, .select, .textarea { font-size: 1rem !important; padding: 14px 18px !important; min-height: 52px !important; }
      .gender-btn { font-size: 1rem !important; padding: 12px 20px !important; min-height: 50px !important; }
      .proceed-btn { font-size: 1.1rem !important; padding: 18px !important; min-height: 56px !important; }
      .section-title { font-size: 1.2rem !important; }
    }
    
    /* Landscape Mode Optimization */
    @media (max-height: 600px) and (orientation: landscape) {
      .container { padding: 6px !important; min-height: 100vh !important; align-items: flex-start !important; }
      .form-wrapper { padding: 12px 16px !important; border-radius: 16px !important; max-width: 600px !important; }
      .header { margin-bottom: 12px !important; padding-bottom: 8px !important; }
      .header-icon { font-size: 1.2rem !important; }
      .title { font-size: 0.9rem !important; }
      .section-container { padding: 8px 12px !important; margin-bottom: 10px !important; }
      .section-title { font-size: 0.8rem !important; margin-bottom: 8px !important; padding-bottom: 6px !important; }
      .formGroup { margin-bottom: 6px !important; }
      .input, .select, .textarea { padding: 6px 10px !important; font-size: 0.75rem !important; min-height: 28px !important; }
      .gender-btn { font-size: 0.7rem !important; padding: 4px 8px !important; min-height: 28px !important; }
      .proceed-btn { font-size: 0.8rem !important; padding: 8px !important; min-height: 34px !important; margin-top: 4px !important; margin-bottom: 8px !important; }
      .row { gap: 6px !important; }
      .gender-buttons { gap: 4px !important; }
      .footer { margin-top: 8px !important; padding-top: 8px !important; }
      .footer-text { font-size: 0.5rem !important; }
      .selected-event, .selected-category { padding: 6px 10px !important; margin-bottom: 8px !important; }
      .edit-btn, .view-summary-btn { font-size: 0.65rem !important; padding: 4px 10px !important; min-height: 28px !important; }
      .back-btn-sm { font-size: 0.6rem !important; padding: 4px 8px !important; min-height: 26px !important; }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default RegistrationForm;