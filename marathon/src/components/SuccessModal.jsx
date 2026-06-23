import React, { useRef } from 'react';
import html2pdf from 'html2pdf.js';

const SuccessModal = ({ isOpen, onClose, registrationData }) => {
  const pdfContentRef = useRef(null);

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

  // Generate PDF
  const generatePDF = () => {
    const element = pdfContentRef.current;
    const opt = {
      margin:        [15, 15, 15, 15],
      filename:     `registration-${registrationData.referenceNumber || 'confirmation'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  // Get gender label
  const getGenderLabel = (gender) => {
    if (gender === 'men') return '👨 Male';
    if (gender === 'women') return '👩 Female';
    return gender || 'N/A';
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          
          {/* Success Header */}
          <div className="success-header">
            <div className="success-icon-big">🎉</div>
            <h2 className="success-title">Registration Successful!</h2>
            <p className="success-subtitle">Your registration has been confirmed</p>
          </div>

          {/* Registration Details - Hidden but used for PDF */}
          <div ref={pdfContentRef} className="pdf-content" style={{ display: 'none' }}>
            <div className="pdf-inner">
              <div className="pdf-header">
                <h1>🏃 Liloan Love the Life</h1>
                <h2>Registration Confirmation</h2>
                <div className="pdf-divider"></div>
              </div>
              
              <div className="pdf-body">
                <div className="pdf-row">
                  <span className="pdf-label">Name:</span>
                  <span className="pdf-value">{registrationData.userName || 'N/A'}</span>
                </div>
                <div className="pdf-row">
                  <span className="pdf-label">Gender:</span>
                  <span className="pdf-value">{getGenderLabel(registrationData.gender)}</span>
                </div>
                <div className="pdf-row">
                  <span className="pdf-label">Reference Number:</span>
                  <span className="pdf-value reference-number-pdf">{registrationData.referenceNumber || 'N/A'}</span>
                </div>
                <div className="pdf-row">
                  <span className="pdf-label">Date of Payment:</span>
                  <span className="pdf-value">{formatDate(registrationData.paymentDate || registrationData.registeredAt)}</span>
                </div>
                <div className="pdf-divider"></div>
                <div className="pdf-row">
                  <span className="pdf-label">Event:</span>
                  <span className="pdf-value">{registrationData.eventName || 'N/A'}</span>
                </div>
                <div className="pdf-row">
                  <span className="pdf-label">Category:</span>
                  <span className="pdf-value">{registrationData.category || 'N/A'}</span>
                </div>
                <div className="pdf-row">
                  <span className="pdf-label">Distance:</span>
                  <span className="pdf-value">{registrationData.distance || 'N/A'}</span>
                </div>
                <div className="pdf-row">
                  <span className="pdf-label">Fee:</span>
                  <span className="pdf-value fee-amount">₱{registrationData.fee?.toLocaleString() || '0'}.00</span>
                </div>
                <div className="pdf-row">
                  <span className="pdf-label">Payment Method:</span>
                  <span className="pdf-value">{registrationData.paymentMethod?.toUpperCase() || 'N/A'}</span>
                </div>
                <div className="pdf-divider"></div>
                <div className="pdf-row">
                  <span className="pdf-label">Status:</span>
                  <span className="pdf-value status-completed">✅ COMPLETED</span>
                </div>
                <div className="pdf-row">
                  <span className="pdf-label">Registration ID:</span>
                  <span className="pdf-value">{registrationData.id || 'N/A'}</span>
                </div>
              </div>
              
              <div className="pdf-footer">
                <p>Thank you for registering! 🏃</p>
                <p className="pdf-footer-small">Liloan Love the Life • 2026</p>
              </div>
            </div>
          </div>

          {/* Display Details */}
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
              <div className="detail-label">💰 Fee</div>
              <div className="detail-value fee-amount">₱{registrationData.fee?.toLocaleString() || '0'}.00</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="success-actions">
            <button className="download-pdf-btn" onClick={generatePDF}>
              <span className="pdf-icon">📄</span>
              Download PDF
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
          max-width: 500px !important;
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

        .success-icon-big {
          font-size: 4rem;
          display: block;
          animation: bounce 1s ease infinite;
          margin-bottom: 8px;
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
          gap: 12px;
          margin: 20px 0 24px 0;
        }

        .detail-card {
          background: rgba(247, 250, 252, 0.8);
          border-radius: 14px;
          padding: 12px 16px;
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
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #718096;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .detail-value {
          font-size: 0.95rem;
          font-weight: 600;
          color: #2d3748;
          word-break: break-word;
        }

        .reference-number-display {
          color: #0A70BA;
          font-family: 'Courier New', monospace;
          font-size: 0.85rem;
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

        .download-pdf-btn {
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

        .download-pdf-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 10px 30px rgba(10, 112, 186, 0.40);
        }

        .download-pdf-btn:active {
          transform: scale(0.98);
        }

        .pdf-icon {
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

        /* PDF Styles */
        .pdf-content {
          position: absolute;
          left: -9999px;
          top: 0;
          width: 210mm;
          min-height: 297mm;
          background: white;
          font-family: Arial, Helvetica, sans-serif;
        }

        .pdf-inner {
          padding: 40px 50px;
          width: 100%;
          box-sizing: border-box;
        }

        .pdf-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .pdf-header h1 {
          font-size: 24px;
          color: #2A499B;
          margin: 0 0 8px 0;
        }

        .pdf-header h2 {
          font-size: 18px;
          color: #0A70BA;
          margin: 0 0 12px 0;
          font-weight: 500;
        }

        .pdf-divider {
          border-top: 2px solid #EDDB0B;
          margin: 16px 0;
          width: 100%;
        }

        .pdf-body {
          margin: 20px 0;
        }

        .pdf-row {
          display: flex;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .pdf-label {
          flex: 0 0 160px;
          font-weight: 600;
          color: #4a5568;
          font-size: 14px;
        }

        .pdf-value {
          flex: 1;
          color: #2d3748;
          font-size: 14px;
        }

        .reference-number-pdf {
          font-family: 'Courier New', monospace;
          font-weight: 700;
          color: #0A70BA;
        }

        .fee-amount {
          font-weight: 700;
          color: #2A499B;
        }

        .status-completed {
          color: #68B42D;
          font-weight: 700;
        }

        .pdf-footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #EDDB0B;
        }

        .pdf-footer p {
          margin: 4px 0;
          color: #4a5568;
          font-size: 14px;
        }

        .pdf-footer-small {
          font-size: 12px !important;
          color: #a0aec0 !important;
        }

        /* Mobile Responsive */
        @media (max-width: 480px) {
          .success-modal {
            padding: 24px 16px !important;
            margin: 10px !important;
          }

          .success-details {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }

          .detail-card {
            padding: 10px 12px;
          }

          .detail-value {
            font-size: 0.85rem;
          }

          .success-actions {
            flex-direction: column;
          }

          .download-pdf-btn,
          .done-btn {
            width: 100%;
            padding: 12px;
          }

          .success-title {
            font-size: 1.3rem;
          }

          .success-icon-big {
            font-size: 3rem;
          }
        }

        @media (max-width: 380px) {
          .success-details {
            grid-template-columns: 1fr;
          }

          .detail-card {
            padding: 8px 12px;
          }

          .success-modal {
            padding: 20px 12px !important;
          }
        }
      `}</style>
    </>
  );
};

export default SuccessModal;