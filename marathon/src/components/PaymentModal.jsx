import React, { useState, useRef } from 'react';
import landbankQr from '../assets/qr-codes/landbank-qr.png';
import mayaQr from '../assets/qr-codes/maya-qr.png';
import gcashQr from '../assets/qr-codes/gcash-qr.png';

const PaymentModal = ({ isOpen, onClose, paymentMethod, onFileUpload, onSubmit }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showFullQr, setShowFullQr] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState(''); // NEW: Reference Number
  const fileInputRef = useRef(null);
  const qrImageRef = useRef(null);

  if (!isOpen) return null;

  const qrImages = {
    landbank: landbankQr,
    maya: mayaQr,
    gcash: gcashQr
  };

  const methodNames = {
    landbank: 'LANDBANK',
    maya: 'MAYA',
    gcash: 'GCASH'
  };

  // Account details for each payment method
  const accountDetails = {
    landbank: {
      name: 'JONIZA MANTILLA',
      account: 'XXXXXX8180'
    },
    maya: {
      name: 'JONIZA RHEA MANTILLA',
      account: '+63******2747'
    },
    gcash: {
      name: 'JO***A RH*A M.',
      account: '0970370****'
    }
  };

  const qrImage = qrImages[paymentMethod];
  const methodName = methodNames[paymentMethod];
  const account = accountDetails[paymentMethod];

  // Function to download QR code
  const downloadQRCode = () => {
    try {
      const link = document.createElement('a');
      link.href = qrImage;
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0];
      const fileName = `qr-code-${paymentMethod}-${dateStr}.png`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      setErrorMessage('Failed to download QR code. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Function to download QR code with watermark/text
  const downloadQRCodeWithText = () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = qrImage;
      
      img.onload = () => {
        const size = 600;
        canvas.width = size;
        canvas.height = size + 60;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const qrSize = size - 40;
        const offsetX = 20;
        const offsetY = 20;
        ctx.drawImage(img, offsetX, offsetY, qrSize, qrSize);
        
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${methodName} - Scan to Pay`, canvas.width / 2, size + 40);
        
        ctx.font = '18px Arial, sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText(account.name, canvas.width / 2, size + 65);
        
        const link = document.createElement('a');
        link.download = `qr-code-${paymentMethod}-with-details.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      
      img.onerror = () => {
        downloadQRCode();
      };
    } catch (error) {
      console.error('Download with text failed:', error);
      downloadQRCode();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select an image file (JPEG, PNG, etc.)');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('File size must be less than 5MB');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      setErrorMessage('');
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file first');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setUploading(true);
    setErrorMessage('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setUploadSuccess(true);
      
      if (onFileUpload) {
        onFileUpload({
          file: selectedFile,
          preview: previewUrl,
          paymentMethod: paymentMethod,
          referenceNumber: referenceNumber // NEW: Include reference number
        });
      }
      
    } catch (error) {
      console.error('Upload failed:', error);
      setErrorMessage('Failed to upload file. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!uploadSuccess) {
      setErrorMessage('Please upload your payment receipt first');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (!referenceNumber.trim()) {
      setErrorMessage('Please enter your reference number');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onSubmit) {
        await onSubmit({
          paymentMethod: paymentMethod,
          receiptFile: selectedFile,
          receiptPreview: previewUrl,
          referenceNumber: referenceNumber // NEW: Include reference number
        });
      }
      
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadSuccess(false);
      setReferenceNumber(''); // NEW: Reset reference number
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      onClose();
      
    } catch (error) {
      console.error('Submission failed:', error);
      setErrorMessage('Failed to submit. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadSuccess(false);
    setErrorMessage('');
    setShowFullQr(false);
    setReferenceNumber(''); // NEW: Reset reference number
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <>
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={handleClose}>×</button>
          <h2>{methodName}</h2>
          
          {/* Error Message */}
          {errorMessage && (
            <div className="error-message-modal">{errorMessage}</div>
          )}
          
          <div className="qr-container">
            <div className="qr-wrapper">
              <img 
                src={qrImage} 
                alt={`${methodName} QR Code`} 
                className="qr-code-large"
                onClick={() => setShowFullQr(true)}
                style={{ cursor: 'pointer' }}
                ref={qrImageRef}
              />
              
              <div className="qr-download-buttons">
                <button 
                  className="download-btn download-simple"
                  onClick={downloadQRCode}
                  title="Download QR Code"
                >
                  <span className="download-icon">⬇️</span>
                  Download QR
                </button>
              </div>
            </div>
            
            <div className="account-details">
              <p className="account-name">{account.name}</p>
              <p className="account-number">{account.account}</p>
            </div>
          </div>
          <div>

          </div>
          {/* NEW: Reference Number Field */}
              <div className="reference-number-container">
                <label className="reference-label">
                  <span className="reference-icon">🔢</span>
                  Reference Number
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="reference-input"
                  placeholder="Enter your payment reference number (e.g., GCASH-1234567890)"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  disabled={uploadSuccess || isSubmitting}
                />
                <p className="reference-hint">
                  Enter the reference number from your payment transaction
                </p>
              </div>

          {/* File Upload Section */}
          <div className="file-upload-section">
            <div className="upload-divider">
              <span>AND</span>
            </div>
            
            <div className="upload-container">
              <p className="upload-label">Upload Payment Receipt</p>
              
              
              
              {/* File Input */}
              <div className="file-input-wrapper">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="file-input"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="file-input-label">
                  <span className="file-icon">📁</span>
                  <span className="file-text">
                    {selectedFile ? selectedFile.name : 'Choose File'}
                  </span>
                  <span className="file-browse-btn">Browse</span>
                </label>
              </div>

              {/* Preview */}
              {previewUrl && (
                <div className="file-preview">
                  <img src={previewUrl} alt="Receipt Preview" className="preview-image" />
                  <button 
                    className="remove-file-btn"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setUploadSuccess(false);
                      setErrorMessage('');
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    ✕ Remove
                  </button>
                </div>
              )}

              {/* Upload Button */}
              {selectedFile && !uploadSuccess && (
                <button 
                  className="upload-btn" 
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner"></span>
                      Uploading...
                    </>
                  ) : (
                    '📤 Upload Receipt'
                  )}
                </button>
              )}

              {/* Upload Success Message */}
              {uploadSuccess && (
                <div className="upload-success">
                  <span className="success-icon">✅</span>
                  <span>Receipt uploaded successfully!</span>
                </div>
              )}

              {/* Supported formats */}
              <p className="supported-formats">
                Supported formats: JPEG, PNG, GIF (Max 5MB)
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="submit-section">
            <button 
              className={`submit-btn ${uploadSuccess && referenceNumber.trim() ? 'active' : 'disabled'}`}
              onClick={handleSubmit}
              disabled={!uploadSuccess || !referenceNumber.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Submitting...
                </>
              ) : (
                '✅ Submit Registration'
              )}
            </button>
            {!uploadSuccess && selectedFile && (
              <p className="submit-hint">Please click "Upload Receipt" first</p>
            )}
            {!uploadSuccess && !selectedFile && (
              <p className="submit-hint">Please select and upload your receipt</p>
            )}
            {uploadSuccess && !referenceNumber.trim() && (
              <p className="submit-hint">⚠️ Please enter your reference number</p>
            )}
          </div>

          <button className="modal-close-btn" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>

      {/* Fullscreen QR Modal */}
      {showFullQr && (
        <div className="qr-fullscreen-overlay" onClick={() => setShowFullQr(false)}>
          <div className="qr-fullscreen-content" onClick={(e) => e.stopPropagation()}>
            <img src={qrImage} alt="Full QR Code" className="qr-fullscreen-image" />
            <div className="qr-fullscreen-actions">
              <button 
                className="download-btn download-simple fullscreen-download"
                onClick={downloadQRCode}
              >
                ⬇️ Download QR
              </button>
            </div>
            <button className="qr-fullscreen-close" onClick={() => setShowFullQr(false)}>✕</button>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentModal;