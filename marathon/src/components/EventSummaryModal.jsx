import React from 'react';
import FeeDisplay from './FeeDisplay';
import PaymentButtons from './PaymentButtons';

const EventSummaryModal = ({ 
  isOpen, 
  onClose, 
  selectedEvent, 
  events, 
  categoryName,
  selectedCategory,
  onPaymentSelect,
  onBackToEvent,
  isSubmitting,
  shirtSize // NEW: Added shirtSize prop
}) => {
  if (!isOpen) return null;

  const selectedEventDetails = events.find(e => e.id === selectedEvent);

  if (!selectedEventDetails) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content summary-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>📋 Registration Summary</h2>
        <p className="category-label" style={{ marginBottom: '20px' }}>
          Review your selections before proceeding to payment
        </p>

        {/* Selected Category */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>🏷️ Category</span>
            <span style={styles.summaryValue}>{categoryName}</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>🏁 Event</span>
            <span style={styles.summaryValue}>{selectedEventDetails.name}</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>📏 Distance</span>
            <span style={styles.summaryValue}>{selectedEventDetails.distance}</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>💰 Fee</span>
            <span style={styles.summaryValue}>₱{selectedEventDetails.fee.toLocaleString()}.00</span>
          </div>
          {/* NEW: Shirt Size Row */}
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>👕 Shirt Size</span>
            <span style={{...styles.summaryValue, fontWeight: 700, color: '#0A70BA'}}>
              {shirtSize || 'N/A'}
            </span>
          </div>
        </div>

        {/* Fee Display */}
        <FeeDisplay
          selectedEvent={selectedEvent}
          events={events}
        />

        {/* Payment Methods */}
        <PaymentButtons onPaymentSelect={onPaymentSelect} />

        {/* Action Buttons */}
        <div style={styles.actionButtons}>
          <button 
            style={styles.backBtn}
            onClick={onBackToEvent}
            disabled={isSubmitting}
          >
            ← Back to Event
          </button>
          <button 
            style={styles.closeBtn}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = {
  summaryCard: {
    background: 'rgba(247, 250, 252, 0.8)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    border: '2px solid rgba(10, 112, 186, 0.10)',
    width: '100%',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid rgba(0, 168, 171, 0.06)',
  },
  summaryLabel: {
    fontWeight: 600,
    color: '#4a5568',
    fontSize: '0.9rem',
  },
  summaryValue: {
    fontWeight: 700,
    color: '#2A499B',
    fontSize: '0.9rem',
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
    width: '100%',
  },
  backBtn: {
    flex: 1,
    padding: '14px 20px',
    background: 'rgba(237, 242, 247, 0.8)',
    border: '2px solid #e2e8f0',
    borderRadius: '40px',
    color: '#4a5568',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  closeBtn: {
    flex: 1,
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #0A70BA, #2A499B)',
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
};

// CSS Global Styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .summary-modal {
    max-width: 500px !important;
    width: 95% !important;
  }
  
  .back-btn:hover {
    background: #e2e8f0 !important;
    transform: translateY(-2px) !important;
  }
  
  .close-btn:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 10px 28px rgba(10, 112, 186, 0.40) !important;
  }
  
  .summary-row:last-child {
    border-bottom: none !important;
  }
  
  @media (max-width: 480px) {
    .summary-modal {
      padding: 20px 16px !important;
    }
    .action-buttons {
      flex-direction: column !important;
    }
    .back-btn, .close-btn {
      width: 100% !important;
      padding: 12px !important;
      font-size: 0.9rem !important;
    }
    .summary-row {
      flex-direction: column !important;
      gap: 4px !important;
      padding: 8px 0 !important;
    }
    .summary-card {
      padding: 14px !important;
    }
  }
  
  @media (max-width: 380px) {
    .summary-modal {
      padding: 16px 12px !important;
    }
    .back-btn, .close-btn {
      font-size: 0.85rem !important;
      padding: 10px !important;
    }
    .summary-value {
      font-size: 0.85rem !important;
    }
    .summary-label {
      font-size: 0.8rem !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default EventSummaryModal;