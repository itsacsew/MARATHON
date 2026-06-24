import React, { useRef } from 'react';
import html2canvas from 'html2canvas';

const SuccessModal = ({ isOpen, onClose, registrationData }) => {
  const captureRef = useRef(null);

  if (!isOpen || !registrationData) return null;

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

  // Generate Image (PNG) - Captures the success details card
  const generateImage = async () => {
    const element = captureRef.current;
    if (!element) return;

    try {
      // Add a small delay to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `registration-${registrationData.referenceNumber || 'confirmation'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please try again.');
    }
  };

  // Get gender label
  const getGenderLabel = (gender) => {
    if (gender === 'male' || gender === 'Male') return '👨 Male';
    if (gender === 'female' || gender === 'Female') return '👩 Female';
    return gender || 'N/A';
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          
          {/* Success Header */}
          <div className="success-header">
            <h2 className="success-title">Registration Successful!</h2>
            <p className="success-subtitle">Your registration has been confirmed</p>
          </div>

          {/* ============================================================ */}
          {/* CAPTURE CONTENT - This will be captured as an image */}
          {/* ============================================================ */}
          <div ref={captureRef} className="capture-content">
            <div className="capture-inner">
              {/* Header */}
              <div className="capture-header">
                <h1>🏃 Liloan Love the Life</h1>
                <h2>Registration Confirmation</h2>
                <div className="capture-divider"></div>
              </div>
              
              {/* Details Grid */}
              <div className="capture-details">
                <div className="capture-row">
                  <span className="capture-label">👤 Name</span>
                  <span className="capture-value">{registrationData.userName || 'N/A'}</span>
                </div>
                <div className="capture-row">
                  <span className="capture-label">🔢 Reference Number</span>
                  <span className="capture-value reference-number">{registrationData.referenceNumber || 'N/A'}</span>
                </div>
                <div className="capture-row">
                  <span className="capture-label">📅 Date of Payment</span>
                  <span className="capture-value">{formatDate(registrationData.paymentDate || registrationData.registeredAt)}</span>
                </div>
                <div className="capture-row">
                  <span className="capture-label">⚧️ Gender</span>
                  <span className="capture-value">{getGenderLabel(registrationData.gender)}</span>
                </div>
                <div className="capture-row">
                  <span className="capture-label">🏁 Event</span>
                  <span className="capture-value">{registrationData.eventName || 'N/A'}</span>
                </div>
                <div className="capture-row">
                  <span className="capture-label">👕 Shirt Size</span>
                  <span className="capture-value shirt-size">{registrationData.shirtSize || 'N/A'}</span>
                </div>
                <div className="capture-row">
                  <span className="capture-label">💰 Fee</span>
                  <span className="capture-value fee-amount">₱{registrationData.fee?.toLocaleString() || '0'}.00</span>
                </div>
                <div className="capture-row">
                  <span className="capture-label">📊 Status</span>
                  <span className="capture-value status-completed">✅ Completed</span>
                </div>
              </div>
              
              {/* Footer */}
              <div className="capture-footer">
                <p>Thank you for registering! 🏃</p>
                <p className="capture-footer-small">Liloan Love the Life • 2026</p>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SUCCESS MODAL UI - Display Details (KEEP EXISTING) */}
          {/* ============================================================ */}
          <div className="success-details">
            <div className="detail-card">
              <div className="detail-label">👤 Name</div>
              <div className="detail-value">{registrationData.userName || 'N/A'}</div>
            </div>
            <div className="detail-card">
              <div className="detail-label">🔢 Reference Number</div>
              <div className="detail-value reference-number-display">{registrationData.referenceNumber || 'N/A'}</div>
            </div>
            <div className="detail-card">
              <div className="detail-label">📅 Date of Payment</div>
              <div className="detail-value">{formatDate(registrationData.paymentDate || registrationData.registeredAt)}</div>
            </div>
            <div className="detail-card">
              <div className="detail-label">⚧️ Gender</div>
              <div className="detail-value">{getGenderLabel(registrationData.gender)}</div>
            </div>
            <div className="detail-card">
              <div className="detail-label">🏁 Event</div>
              <div className="detail-value">{registrationData.eventName || 'N/A'}</div>
            </div>
            <div className="detail-card">
              <div className="detail-label">👕 Shirt Size</div>
              <div className="detail-value" style={{ color: '#0A70BA', fontWeight: 'bold' }}>{registrationData.shirtSize || 'N/A'}</div>
            </div>
            <div className="detail-card">
              <div className="detail-label">💰 Fee</div>
              <div className="detail-value fee-amount">₱{registrationData.fee?.toLocaleString() || '0'}.00</div>
            </div>
            <div className="detail-card">
              <div className="detail-label">📊 Status</div>
              <div className="detail-value" style={{ color: '#68B42D', fontWeight: 'bold' }}>✅ Completed</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="success-actions">
            <button className="download-image-btn" onClick={generateImage}>
              <span className="image-icon">🖼️</span>
              Download Image
            </button>
            <button className="done-btn" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>

      {/* CSS Styles */}
      <style>{`
        /* Success Modal Styles */
        .success-modal {
          max-width: 520px !important;
          width: 95% !important;
          padding: 32px 28px !important;
          border-radius: 28px !important;
          animation: successSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        }

        @keyframes successSlideIn {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(30px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .success-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .success-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: #2A499B;
          margin: 0 0 4px 0;
        }

        .success-subtitle {
          font-size: 0.95rem;
          color: #68B42D;
          margin: 0;
          font-weight: 500;
        }

        .success-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin: 16px 0 20px 0;
        }

        .detail-card {
          background: rgba(247, 250, 252, 0.8);
          border-radius: 12px;
          padding: 10px 14px;
          border: 1px solid rgba(0, 168, 171, 0.10);
          transition: all 0.3s ease;
        }

        .detail-card:hover {
          border-color: rgba(10, 112, 186, 0.20);
          background: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .detail-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #718096;
          font-weight: 600;
          margin-bottom: 3px;
        }

        .detail-value {
          font-size: 0.9rem;
          font-weight: 600;
          color: #2d3748;
          word-break: break-word;
        }

        .reference-number-display {
          color: #0A70BA;
          font-family: 'Courier New', monospace;
          font-size: 0.8rem;
          background: rgba(10, 112, 186, 0.08);
          padding: 2px 10px;
          border-radius: 6px;
          display: inline-block;
        }

        .fee-amount {
          color: #2A499B;
          font-weight: 700;
        }

        .success-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .download-image-btn {
          flex: 2;
          padding: 14px 20px;
          background: linear-gradient(135deg, #2A499B, #0A70BA);
          color: white;
          border: none;
          border-radius: 40px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 6px 20px rgba(10, 112, 186, 0.30);
        }

        .download-image-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 10px 30px rgba(10, 112, 186, 0.40);
        }

        .download-image-btn:active {
          transform: scale(0.98);
        }

        .image-icon {
          font-size: 1.2rem;
        }

        .done-btn {
          flex: 1;
          padding: 14px 20px;
          background: rgba(237, 242, 247, 0.9);
          color: #4a5568;
          border: 2px solid #e2e8f0;
          border-radius: 40px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .done-btn:hover {
          background: #e2e8f0;
          transform: translateY(-2px);
        }

        /* ============================================================ */
        /* CAPTURE STYLES - For image generation */
        /* ============================================================ */
        .capture-content {
          position: absolute;
          left: -9999px;
          top: 0;
          width: 500px;
          background: white;
          font-family: Arial, Helvetica, sans-serif;
          padding: 0;
        }

        .capture-inner {
          padding: 40px 35px;
          width: 100%;
          box-sizing: border-box;
          background: white;
        }

        .capture-header {
          text-align: center;
          margin-bottom: 25px;
        }

        .capture-header h1 {
          font-size: 22px;
          color: #2A499B;
          margin: 0 0 6px 0;
        }

        .capture-header h2 {
          font-size: 16px;
          color: #0A70BA;
          margin: 0 0 10px 0;
          font-weight: 500;
        }

        .capture-divider {
          border-top: 2px solid #EDDB0B;
          margin: 14px 0;
          width: 100%;
        }

        .capture-details {
          margin: 16px 0;
        }

        .capture-row {
          display: flex;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
          align-items: center;
        }

        .capture-row:last-child {
          border-bottom: none;
        }

        .capture-label {
          flex: 0 0 140px;
          font-weight: 600;
          color: #4a5568;
          font-size: 13px;
        }

        .capture-value {
          flex: 1;
          color: #2d3748;
          font-size: 13px;
          font-weight: 500;
        }

        .reference-number {
          font-family: 'Courier New', monospace;
          font-weight: 700;
          color: #0A70BA;
        }

        .shirt-size {
          color: #0A70BA;
          font-weight: 700;
        }

        .fee-amount {
          font-weight: 700;
          color: #2A499B;
        }

        .status-completed {
          color: #68B42D;
          font-weight: 700;
        }

        .capture-footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 16px;
          border-top: 2px solid #EDDB0B;
        }

        .capture-footer p {
          margin: 4px 0;
          color: #4a5568;
          font-size: 13px;
        }

        .capture-footer-small {
          font-size: 11px !important;
          color: #a0aec0 !important;
        }

        /* Mobile Responsive */
        @media (max-width: 480px) {
          .success-modal {
            padding: 20px 14px !important;
            margin: 8px !important;
            border-radius: 20px !important;
          }

          .success-details {
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin: 12px 0 16px 0;
          }

          .detail-card {
            padding: 8px 10px;
          }

          .detail-value {
            font-size: 0.8rem;
          }

          .detail-label {
            font-size: 0.55rem;
          }

          .success-actions {
            flex-direction: column;
            gap: 8px;
          }

          .download-image-btn,
          .done-btn {
            width: 100%;
            padding: 12px;
            font-size: 0.9rem;
          }

          .success-title {
            font-size: 1.2rem;
          }

          .success-subtitle {
            font-size: 0.85rem;
          }
        }

        @media (max-width: 380px) {
          .success-details {
            grid-template-columns: 1fr;
          }

          .detail-card {
            padding: 6px 10px;
          }

          .success-modal {
            padding: 16px 10px !important;
          }

          .download-image-btn,
          .done-btn {
            font-size: 0.85rem;
            padding: 10px;
          }

          .success-title {
            font-size: 1.1rem;
          }
        }

        /* Medium screens (481px - 768px) */
        @media (min-width: 481px) and (max-width: 768px) {
          .success-modal {
            padding: 28px 22px !important;
          }

          .success-details {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
        }
      `}</style>
    </>
  );
};

export default SuccessModal;