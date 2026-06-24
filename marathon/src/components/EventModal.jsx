import React, { useState } from 'react';
import AgreementModal from './AgreementModal';

// Shirt size options
const SHIRT_SIZES = ['3XL', '2XL', 'XL', 'L', 'M', 'S', 'XS', '2XS'];

const EventModal = ({ 
  isOpen, 
  onClose, 
  events, 
  selectedEvent, 
  onEventSelect,
  onProceed,
  categoryName,
  isEditing = false
}) => {
  const [selectedShirtSize, setSelectedShirtSize] = useState('');
  const [localSelectedEvent, setLocalSelectedEvent] = useState(selectedEvent);
  const [errorMessage, setErrorMessage] = useState('');
  const [agreedToWaiver, setAgreedToWaiver] = useState(false);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleEventClick = (eventId) => {
    setLocalSelectedEvent(eventId);
    setErrorMessage('');
  };

  const handleShirtSizeChange = (e) => {
    setSelectedShirtSize(e.target.value);
    setErrorMessage('');
  };

  const handleAgreementCheckbox = (e) => {
    setAgreedToWaiver(e.target.checked);
    setErrorMessage('');
  };

  const handleOpenAgreement = (e) => {
    e.preventDefault();
    setIsAgreementModalOpen(true);
  };

  const handleCloseAgreement = () => {
    setIsAgreementModalOpen(false);
  };

  const handleProceed = () => {
    // Validate if event is selected
    if (!localSelectedEvent) {
      setErrorMessage('❌ Please select an event first');
      return;
    }
    // Validate if shirt size is selected
    if (!selectedShirtSize) {
      setErrorMessage('❌ Please select your shirt size');
      return;
    }
    // Validate if waiver is agreed
    if (!agreedToWaiver) {
      setErrorMessage('❌ You must agree to the Liability Waiver & Agreement');
      return;
    }

    // Call onEventSelect to update parent state
    onEventSelect(localSelectedEvent);
    // Call onProceed with shirt size data
    if (onProceed) {
      onProceed({
        eventId: localSelectedEvent,
        shirtSize: selectedShirtSize,
        agreedToWaiver: agreedToWaiver
      });
    }
    // Close modal
    onClose();
  };

  const handleClose = () => {
    // Reset local state
    setLocalSelectedEvent(selectedEvent);
    setSelectedShirtSize('');
    setAgreedToWaiver(false);
    setErrorMessage('');
    onClose();
  };

  // Get selected event details
  const getSelectedEventDetails = () => {
    return events.find(e => e.id === localSelectedEvent);
  };

  const selectedEventDetails = getSelectedEventDetails();

  return (
    <>
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content event-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={handleClose}>×</button>
          
          <h2>🎯 Race Preferences</h2>
          <p className="category-label" style={{ marginBottom: '4px' }}>
            Category: <strong>{categoryName}</strong>
          </p>
          
          {isEditing && (
            <div className="editing-indicator">
              <span>⚠️ You are changing your selected event</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="error-message-modal" style={{ marginBottom: '16px' }}>
              {errorMessage}
            </div>
          )}

          {/* Event Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.sectionLabel}>SELECT EVENT</label>
            <div className="event-list" style={{ marginBottom: '0' }}>
              {events.map((event) => (
                <button
                  key={event.id}
                  className={`event-select-btn ${localSelectedEvent === event.id ? 'active' : ''}`}
                  onClick={() => handleEventClick(event.id)}
                  style={{
                    ...styles.eventBtn,
                    borderColor: localSelectedEvent === event.id ? '#0A70BA' : 'rgba(0, 168, 171, 0.20)',
                    background: localSelectedEvent === event.id 
                      ? 'linear-gradient(135deg, #2A499B, #0A70BA)'
                      : 'rgba(255, 255, 255, 0.7)',
                    color: localSelectedEvent === event.id ? 'white' : '#4a5568',
                  }}
                >
                  <div className="event-info" style={{ flex: 1 }}>
                    <div className="event-name" style={{ 
                      fontWeight: 600, 
                      fontSize: '1rem', 
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      flexWrap: 'wrap'
                    }}>
                      {event.name}
                      {localSelectedEvent === event.id && (
                        <span className="current-selection-badge" style={{
                          fontSize: '0.7rem',
                          background: '#68B42D',
                          color: 'white',
                          padding: '2px 12px',
                          borderRadius: '20px',
                          fontWeight: 600
                        }}>✓ Selected</span>
                      )}
                    </div>
                    <div className="event-details" style={{
                      display: 'flex',
                      gap: '16px',
                      fontSize: '0.85rem',
                      opacity: 0.8,
                      flexWrap: 'wrap'
                    }}>
                      <span className="event-distance">📏 {event.distance}</span>
                      <span className="event-fee">💰 ₱{event.fee.toLocaleString()}.00</span>
                    </div>
                  </div>
                  <div className="select-indicator" style={{
                    fontSize: '1.2rem',
                    opacity: localSelectedEvent === event.id ? 1 : 0.4,
                    transition: 'all 0.25s ease'
                  }}>
                    {localSelectedEvent === event.id ? '✓' : '→'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Shirt Size Selection */}
          <div style={styles.shirtSizeContainer}>
            <label style={styles.sectionLabel}>
              👕 SHIRT SIZE
              <span style={{ color: '#e53e3e', marginLeft: '4px' }}>*</span>
            </label>
            <select
              value={selectedShirtSize}
              onChange={handleShirtSizeChange}
              style={styles.shirtSizeSelect}
            >
              <option value="">Select your shirt size</option>
              {SHIRT_SIZES.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <p style={styles.shirtSizeHint}>
              ⚠️ Please choose your preferred shirt size. Sizes are subject to availability.
            </p>
          </div>

          {/* Liability Waiver & Agreement */}
          <div style={styles.waiverContainer}>
            <label style={styles.waiverLabel}>
              <input
                type="checkbox"
                checked={agreedToWaiver}
                onChange={handleAgreementCheckbox}
                style={styles.waiverCheckbox}
              />
              <span>
                I agree to the{' '}
                <a 
                  href="#" 
                  onClick={handleOpenAgreement}
                  style={styles.waiverLink}
                >
                  Liability Waiver & Agreement
                </a>
                <span style={{ color: '#e53e3e', marginLeft: '4px' }}>*</span>
              </span>
            </label>
          </div>

          {/* Selected Event Summary */}
          {selectedEventDetails && (
            <div style={styles.summaryContainer}>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Event:</span>
                <span style={styles.summaryValue}>{selectedEventDetails.name}</span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Distance:</span>
                <span style={styles.summaryValue}>{selectedEventDetails.distance}</span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Fee:</span>
                <span style={styles.summaryValue}>₱{selectedEventDetails.fee.toLocaleString()}.00</span>
              </div>
              {selectedShirtSize && (
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Shirt Size:</span>
                  <span style={{...styles.summaryValue, fontWeight: 700, color: '#0A70BA'}}>
                    {selectedShirtSize}
                  </span>
                </div>
              )}
              {agreedToWaiver && (
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Waiver:</span>
                  <span style={{...styles.summaryValue, fontWeight: 700, color: '#68B42D'}}>
                    ✅ Agreed
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Proceed Button */}
          <button 
            className="proceed-btn"
            onClick={handleProceed}
            style={styles.proceedBtn}
          >
            <span style={styles.proceedIcon}>🚀</span>
            Proceed
          </button>

          <button className="modal-close-btn" onClick={handleClose} style={{ marginTop: '12px' }}>
            Cancel
          </button>
        </div>
      </div>

      {/* Agreement Modal */}
      <AgreementModal
        isOpen={isAgreementModalOpen}
        onClose={handleCloseAgreement}
      />
    </>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = {
  sectionLabel: {
    display: 'block',
    fontWeight: 700,
    color: '#2A499B',
    marginBottom: '10px',
    fontSize: '0.9rem',
    letterSpacing: '0.5px',
  },
  eventBtn: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    border: '2px solid',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
    textAlign: 'left',
    marginBottom: '10px',
  },
  shirtSizeContainer: {
    marginBottom: '16px',
    width: '100%',
  },
  shirtSizeSelect: {
    width: '100%',
    padding: '14px 18px',
    border: '2px solid rgba(0, 168, 171, 0.20)',
    borderRadius: '14px',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    background: 'rgba(255, 255, 255, 0.7)',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234a5568' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
    color: '#2d3748',
    minHeight: '50px',
    boxSizing: 'border-box',
  },
  shirtSizeHint: {
    fontSize: '0.75rem',
    color: '#718096',
    marginTop: '8px',
    fontStyle: 'italic',
  },
  waiverContainer: {
    marginBottom: '16px',
    padding: '14px 16px',
    background: 'rgba(247, 250, 252, 0.6)',
    borderRadius: '12px',
    border: '2px solid rgba(0, 168, 171, 0.08)',
    width: '100%',
  },
  waiverLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#2d3748',
    fontWeight: 500,
    lineHeight: '1.5',
  },
  waiverCheckbox: {
    width: '20px',
    height: '20px',
    minWidth: '20px',
    marginTop: '1px',
    cursor: 'pointer',
    accentColor: '#0A70BA',
  },
  waiverLink: {
    color: '#0A70BA',
    fontWeight: 700,
    textDecoration: 'underline',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
  },
  summaryContainer: {
    background: 'rgba(247, 250, 252, 0.8)',
    borderRadius: '14px',
    padding: '16px 20px',
    marginBottom: '20px',
    border: '1px solid rgba(0, 168, 171, 0.10)',
    width: '100%',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid rgba(0, 168, 171, 0.06)',
  },
  summaryLabel: {
    fontWeight: 600,
    color: '#4a5568',
    fontSize: '0.85rem',
  },
  summaryValue: {
    fontWeight: 500,
    color: '#2d3748',
    fontSize: '0.85rem',
  },
  proceedBtn: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #0A70BA, #2A499B)',
    color: 'white',
    border: 'none',
    borderRadius: '40px',
    fontSize: '1.05rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    boxShadow: '0 8px 24px rgba(10, 112, 186, 0.35)',
    minHeight: '54px',
  },
  proceedIcon: {
    fontSize: '1.2rem',
  },
};

// CSS Global Styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .event-modal {
    max-width: 550px !important;
    width: 95% !important;
  }
  
  .event-select-btn:hover {
    transform: translateX(6px) !important;
    box-shadow: 0 4px 16px rgba(10, 112, 186, 0.12) !important;
  }
  
  .event-select-btn.active:hover {
    transform: translateX(6px) !important;
  }
  
  .proceed-btn:hover {
    transform: translateY(-3px) scale(1.02) !important;
    box-shadow: 0 12px 32px rgba(10, 112, 186, 0.45) !important;
  }
  
  .shirt-size-select:focus {
    outline: none;
    border-color: #0A70BA !important;
    box-shadow: 0 0 0 3px rgba(10, 112, 186, 0.12) !important;
    background: white !important;
  }
  
  .waiver-link:hover {
    color: #2A499B !important;
  }
  
  .waiver-checkbox:checked {
    accent-color: #0A70BA !important;
  }
  
  @media (max-width: 480px) {
    .event-modal {
      padding: 20px 16px !important;
    }
    .event-select-btn {
      padding: 12px 14px !important;
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 8px !important;
    }
    .event-select-btn .event-name {
      font-size: 0.9rem !important;
    }
    .event-select-btn .event-details {
      flex-direction: column !important;
      gap: 4px !important;
      font-size: 0.8rem !important;
    }
    .event-select-btn .select-indicator {
      display: none !important;
    }
    .summary-row {
      flex-direction: column !important;
      gap: 2px !important;
    }
    .proceed-btn {
      font-size: 0.95rem !important;
      padding: 14px !important;
      min-height: 48px !important;
    }
    .shirt-size-select {
      padding: 12px 14px !important;
      font-size: 0.9rem !important;
      min-height: 44px !important;
    }
    .waiver-label {
      font-size: 0.85rem !important;
    }
    .waiver-checkbox {
      width: 18px !important;
      height: 18px !important;
      min-width: 18px !important;
    }
    .waiver-container {
      padding: 12px !important;
    }
  }
  
  @media (max-width: 380px) {
    .event-modal {
      padding: 16px 12px !important;
    }
    .event-select-btn {
      padding: 10px 12px !important;
    }
    .event-select-btn .event-name {
      font-size: 0.8rem !important;
    }
    .event-select-btn .event-details {
      font-size: 0.7rem !important;
    }
    .proceed-btn {
      font-size: 0.85rem !important;
      padding: 12px !important;
      min-height: 42px !important;
    }
    .shirt-size-select {
      padding: 10px 12px !important;
      font-size: 0.8rem !important;
      min-height: 38px !important;
    }
    .waiver-label {
      font-size: 0.8rem !important;
    }
    .waiver-checkbox {
      width: 16px !important;
      height: 16px !important;
      min-width: 16px !important;
    }
    .waiver-container {
      padding: 10px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default EventModal;