import React, { useState } from 'react';
import CategorySelector from './CategorySelector';
import EventModal from './EventModal';
import FeeDisplay from './FeeDisplay';
import PaymentButtons from './PaymentButtons';
import PaymentModal from './PaymentModal';
import { EVENT_CONFIG } from '../config/eventConfig';
import { useAuth } from '../contexts/AuthContext';

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    event: ''
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
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

  // Handle the final submission
  const handleFinalSubmit = async (paymentData) => {
    if (!currentUser || !selectedCategoryData || !selectedEvent) {
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
      
      // Show success message
      setShowSuccess(true);
      setSaveMessage('✅ Successfully Registered!');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        // Reset all form data
        setFormData({
          name: '',
          category: '',
          event: ''
        });
        setSelectedCategory(null);
        setSelectedEvent(null);
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
    <div className="registration-form">
      <h1>🏃 EVENT REGISTRATION</h1>
      
      {/* Success Message - Centered below the title */}
      {showSuccess && (
        <div className="success-message-centered">
          <div className="success-content">
            <span className="success-emoji">✅</span>
            <span className="success-text">Successfully Registered!</span>
          </div>
        </div>
      )}

      {/* Error/Save Message */}
      {saveMessage && !showSuccess && (
        <div className={`save-message ${saveMessage.includes('success') || saveMessage.includes('✅') ? 'success' : 'error'}`}>
          {saveMessage}
        </div>
      )}

      {/* User info */}
      {currentUser && (
        <div className="user-info-badge">
          <span>👤 Logged in as: {userData?.displayName || currentUser.email}</span>
        </div>
      )}

      {/* Name Input */}
      <div className="form-group">
        <label>NAME:</label>
        <input
          type="text"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleNameChange}
          className="name-input"
          disabled={isSubmitting || showSuccess}
        />
      </div>

      {!selectedCategory && !showSuccess && (
        <CategorySelector
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          categories={EVENT_CONFIG.categories}
        />
      )}

      {selectedCategory && !showSuccess && (
        <div className="selected-category-display">
          <div className="selected-category-info">
            <span className="category-label">Selected Category:</span>
            <span className="category-name">{selectedCategoryData.name}</span>
          </div>
          <button 
            className="back-btn back-btn-sm" 
            onClick={handleBackToCategory}
            title="Go back to category selection"
            disabled={isSubmitting}
          >
            ← Back
          </button>
        </div>
      )}

      {selectedCategory && selectedEventDetails && !showSuccess && (
        <>
          <div className="selected-event-display">
            <div className="selected-event-info">
              <span className="event-label">Selected Event:</span>
              <div className="event-details-display">
                <span className="event-name">{selectedEventDetails.name}</span>
                <span className="event-distance">{selectedEventDetails.distance}</span>
              </div>
            </div>
            <div className="event-actions">
              <button 
                className="edit-btn" 
                onClick={handleBackToEvent}
                title="Change selected event"
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

      {selectedCategory && selectedEventDetails && !showSuccess && (
        <div className="back-to-category-container">
          <button 
            className="back-btn back-btn-full" 
            onClick={handleBackToCategory}
            disabled={isSubmitting}
          >
            ← Change Category
          </button>
        </div>
      )}

      {selectedCategoryData && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={closeEventModal}
          events={selectedCategoryData.events}
          selectedEvent={selectedEvent}
          onEventSelect={handleEventSelect}
          categoryName={selectedCategoryData.name}
          isEditing={isEditing}
        />
      )}

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        paymentMethod={selectedPayment}
        onFileUpload={handleFileUpload}
        onSubmit={handleFinalSubmit}
      />
    </div>
  );
};

export default RegistrationForm;