import React from 'react';

const AgreementModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content agreement-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>📜 Liability Waiver & Agreement</h2>
        
        <div style={styles.agreementContent}>
          <p style={styles.agreementText}>
            WAIVER AND RELEASE OF LIABILITY

I hereby certify that I am physically fit and in good health to participate in the Lilo-Wawa Half Marathon. I understand that running is a strenuous physical activity that involves inherent risks, including injury, illness, dehydration, accidents, and other unforeseen circumstances.

I acknowledge that food and refreshments may be provided during the event and accept full responsibility for any allergies, dietary restrictions, or adverse reactions resulting from their consumption.

I further understand that the organizers will have standby medical personnel and first-aid assistance available during the event. However, I acknowledge that such assistance does not eliminate all risks associated with participation, and I voluntarily assume full responsibility for my health and safety.

In consideration of my participation, I hereby release and hold harmless the organizers, sponsors, partners, volunteers, medical personnel, and the Municipality of Liloan from any liability, claims, damages, injuries, losses, or expenses arising from or related to my participation in the event, except in cases of gross negligence or willful misconduct.

By registering for the Lilo-Wawa Half Marathon, I confirm that I have read, understood, and voluntarily agreed to this waiver and release of liability.

Participant’s Name: ________________________
Signature: _______________________________
Date: __________________________________
          </p>
        </div>

        <button className="modal-close-btn" onClick={onClose}>
          I Understand
        </button>
      </div>
    </div>
  );
};

const styles = {
  agreementContent: {
    background: 'rgba(247, 250, 252, 0.8)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    border: '2px solid rgba(10, 112, 186, 0.08)',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  agreementText: {
    fontSize: '1rem',
    lineHeight: '1.8',
    color: '#2d3748',
    textAlign: 'justify',
    margin: 0,
  },
};

// CSS Global Styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .agreement-modal {
    max-width: 550px !important;
    width: 95% !important;
  }
  
  .agreement-modal .modal-close-btn {
    margin-top: 0 !important;
  }
  
  @media (max-width: 480px) {
    .agreement-modal {
      padding: 20px 16px !important;
    }
    .agreement-content {
      padding: 16px !important;
      max-height: 300px !important;
    }
    .agreement-text {
      font-size: 0.9rem !important;
      line-height: 1.6 !important;
    }
    .agreement-modal h2 {
      font-size: 1.2rem !important;
    }
  }
  
  @media (max-width: 380px) {
    .agreement-modal {
      padding: 16px 12px !important;
    }
    .agreement-content {
      padding: 12px !important;
      max-height: 250px !important;
    }
    .agreement-text {
      font-size: 0.8rem !important;
      line-height: 1.5 !important;
    }
    .agreement-modal h2 {
      font-size: 1rem !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default AgreementModal;