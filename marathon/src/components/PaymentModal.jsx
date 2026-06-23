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
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = qrImage;
      
      // Create filename with payment method and date
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0];
      const fileName = `qr-code-${paymentMethod}-${dateStr}.png`;
      link.download = fileName;
      
      // Append to body, click, and remove
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
      // Create a canvas to add text/watermark
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Load the QR image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = qrImage;
      
      img.onload = () => {
        // Set canvas size (larger for better quality)
        const size = 600;
        canvas.width = size;
        canvas.height = size + 60; // Extra space for text
        
        // Draw white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR code (centered)
        const qrSize = size - 40;
        const offsetX = 20;
        const offsetY = 20;
        ctx.drawImage(img, offsetX, offsetY, qrSize, qrSize);
        
        // Add text below QR code
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${methodName} - Scan to Pay`, canvas.width / 2, size + 40);
        
        // Add smaller text with account name
        ctx.font = '18px Arial, sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText(account.name, canvas.width / 2, size + 65);
        
        // Convert to PNG and download
        const link = document.createElement('a');
        link.download = `qr-code-${paymentMethod}-with-details.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      
      img.onerror = () => {
        // Fallback to simple download if canvas fails
        downloadQRCode();
      };
    } catch (error) {
      console.error('Download with text failed:', error);
      // Fallback to simple download
      downloadQRCode();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select an image file (JPEG, PNG, etc.)');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }
      
      // Check file size (max 5MB)
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
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setUploadSuccess(true);
      
      if (onFileUpload) {
        onFileUpload({
          file: selectedFile,
          preview: previewUrl,
          paymentMethod: paymentMethod
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

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onSubmit) {
        await onSubmit({
          paymentMethod: paymentMethod,
          receiptFile: selectedFile,
          receiptPreview: previewUrl
        });
      }
      
      // Reset all states
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadSuccess(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Close the modal after successful submission
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
            {/* QR CODE - LARGER WITH DOWNLOAD BUTTONS */}
            <div className="qr-wrapper">
              <img 
                src={qrImage} 
                alt={`${methodName} QR Code`} 
                className="qr-code-large"
                onClick={() => setShowFullQr(true)}
                style={{ cursor: 'pointer' }}
                ref={qrImageRef}
              />
              
              {/* Download Buttons */}
              <div className="qr-download-buttons">
                <button 
                  className="download-btn download-simple"
                  onClick={downloadQRCode}
                  title="Download QR Code"
                >
                  <span className="download-icon">⬇️</span>
                  Download QR
                </button>
                <button 
                  className="download-btn download-with-details"
                  onClick={downloadQRCodeWithText}
                  title="Download QR Code with Account Details"
                >
                  <span className="download-icon">📄</span>
                  Download with Details
                </button>
              </div>
              
              <p className="qr-instruction">Tap QR code to enlarge | Click Download to save</p>
            </div>
            
            {/* Account Details */}
            <div className="account-details">
              <p className="account-name">{account.name}</p>
              <p className="account-number">{account.account}</p>
            </div>
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
              className={`submit-btn ${uploadSuccess ? 'active' : 'disabled'}`}
              onClick={handleSubmit}
              disabled={!uploadSuccess || isSubmitting}
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
              <button 
                className="download-btn download-with-details fullscreen-download"
                onClick={downloadQRCodeWithText}
              >
                📄 Download with Details
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