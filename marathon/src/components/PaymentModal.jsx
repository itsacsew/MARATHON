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
  const [referenceNumber, setReferenceNumber] = useState('');
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

  // Function to compress image
  const compressImage = (dataUrl, maxSizeKB = 150) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions to reduce size
        const maxDimension = 800;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Start with quality 0.7 and reduce until size is acceptable
        let quality = 0.7;
        let compressed = canvas.toDataURL('image/jpeg', quality);
        
        // Reduce quality until image is under maxSizeKB
        while (compressed.length > maxSizeKB * 1024 && quality > 0.1) {
          quality -= 0.1;
          compressed = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(compressed);
      };
      img.onerror = () => {
        resolve(dataUrl);
      };
    });
  };

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

  const handleFileSelect = async (e) => {
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
      reader.onloadend = async () => {
        // Compress the image before setting preview
        try {
          const compressedImage = await compressImage(reader.result, 150); // 150KB max
          setPreviewUrl(compressedImage);
        } catch (error) {
          console.error('Error compressing image:', error);
          setPreviewUrl(reader.result);
        }
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
          referenceNumber: referenceNumber
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
    console.log('🔵 PaymentModal handleSubmit called');
    
    if (!uploadSuccess) {
      console.log('❌ Upload not successful');
      setErrorMessage('Please upload your payment receipt first');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (!referenceNumber.trim()) {
      console.log('❌ No reference number');
      setErrorMessage('Please enter your reference number');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const paymentData = {
        paymentMethod: paymentMethod,
        receiptFile: selectedFile,
        receiptPreview: previewUrl,
        referenceNumber: referenceNumber
      };
      
      console.log('📤 Submitting payment data:', paymentData);
      
      // Call onSubmit and wait for it to complete
      if (onSubmit) {
        console.log('⏳ Waiting for onSubmit...');
        await onSubmit(paymentData);
        console.log('✅ onSubmit completed');
      }
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadSuccess(false);
      setReferenceNumber('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      console.log('🔄 Closing payment modal');
      // Close payment modal
      onClose();
      
    } catch (error) {
      console.error('❌ Submission failed:', error);
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
    setReferenceNumber('');
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
          {/* Reference Number Field */}
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

      {/* CSS Styles */}
      <style>{`
        /* Payment Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 28px;
          padding: 32px 28px;
          max-width: 520px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-close {
          position: absolute;
          top: 12px;
          right: 16px;
          font-size: 28px;
          background: none;
          border: none;
          cursor: pointer;
          color: #718096;
          transition: all 0.3s ease;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .modal-close:hover {
          background: #f7fafc;
          color: #2d3748;
          transform: rotate(90deg);
        }

        .modal-content h2 {
          text-align: center;
          font-size: 1.5rem;
          font-weight: 700;
          color: #2A499B;
          margin-top: 0;
          margin-bottom: 20px;
          letter-spacing: 1px;
        }

        .error-message-modal {
          background: rgba(254, 215, 215, 0.9);
          color: #c53030;
          padding: 10px 16px;
          border-radius: 10px;
          margin-bottom: 16px;
          font-weight: 600;
          font-size: 0.9rem;
          border: 1px solid #fc8181;
          text-align: center;
        }

        .qr-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
          padding: 20px;
          background: rgba(247, 250, 252, 0.5);
          border-radius: 16px;
          border: 2px solid rgba(0, 168, 171, 0.10);
        }

        .qr-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .qr-code-large {
          width: 180px;
          height: 180px;
          object-fit: contain;
          border-radius: 12px;
          transition: all 0.3s ease;
          border: 2px solid #e2e8f0;
          padding: 8px;
          background: white;
        }

        .qr-code-large:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.10);
        }

        .qr-download-buttons {
          display: flex;
          gap: 10px;
        }

        .download-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .download-simple {
          background: linear-gradient(135deg, #0A70BA, #2A499B);
          color: white;
          box-shadow: 0 4px 12px rgba(10, 112, 186, 0.30);
        }

        .download-simple:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(10, 112, 186, 0.40);
        }

        .download-icon {
          font-size: 1rem;
        }

        .account-details {
          margin-top: 12px;
          text-align: center;
          width: 100%;
        }

        .account-name {
          font-weight: 700;
          color: #2d3748;
          font-size: 1rem;
          margin: 0 0 4px 0;
        }

        .account-number {
          font-weight: 600;
          color: #0A70BA;
          font-size: 0.9rem;
          margin: 0;
          font-family: 'Courier New', monospace;
          letter-spacing: 1px;
        }

        .reference-number-container {
          margin: 16px 0 12px 0;
        }

        .reference-label {
          display: block;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 6px;
          font-size: 0.9rem;
        }

        .reference-icon {
          margin-right: 6px;
        }

        .required {
          color: #e53e3e;
          margin-left: 4px;
        }

        .reference-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid rgba(0, 168, 171, 0.20);
          border-radius: 12px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          box-sizing: border-box;
          background: rgba(255, 255, 255, 0.7);
        }

        .reference-input:focus {
          outline: none;
          border-color: #0A70BA;
          box-shadow: 0 0 0 3px rgba(10, 112, 186, 0.12);
          background: white;
        }

        .reference-hint {
          font-size: 0.75rem;
          color: #718096;
          margin: 4px 0 0 0;
        }

        .file-upload-section {
          margin: 12px 0;
        }

        .upload-divider {
          display: flex;
          align-items: center;
          margin: 16px 0;
        }

        .upload-divider::before,
        .upload-divider::after {
          content: '';
          flex: 1;
          border-top: 2px solid #e2e8f0;
        }

        .upload-divider span {
          padding: 0 12px;
          color: #a0aec0;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .upload-container {
          background: rgba(247, 250, 252, 0.5);
          border-radius: 12px;
          padding: 16px;
          border: 2px dashed rgba(0, 168, 171, 0.15);
        }

        .upload-label {
          font-weight: 600;
          color: #2d3748;
          text-align: center;
          margin: 0 0 12px 0;
          font-size: 0.95rem;
        }

        .file-input-wrapper {
          margin-bottom: 12px;
        }

        .file-input {
          position: absolute;
          width: 0.1px;
          height: 0.1px;
          opacity: 0;
          overflow: hidden;
          z-index: -1;
        }

        .file-input-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .file-input-label:hover {
          border-color: #0A70BA;
          background: #f7fafc;
        }

        .file-icon {
          font-size: 1.2rem;
          margin-right: 8px;
        }

        .file-text {
          flex: 1;
          color: #4a5568;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-browse-btn {
          padding: 6px 16px;
          background: linear-gradient(135deg, #0A70BA, #2A499B);
          color: white;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.8rem;
          transition: all 0.3s ease;
        }

        .file-browse-btn:hover {
          transform: scale(1.05);
        }

        .file-preview {
          margin: 12px 0;
          position: relative;
          display: inline-block;
          width: 100%;
        }

        .preview-image {
          width: 100%;
          max-height: 200px;
          object-fit: contain;
          border-radius: 8px;
          border: 2px solid #e2e8f0;
          background: white;
        }

        .remove-file-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(254, 215, 215, 0.9);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          cursor: pointer;
          font-size: 0.8rem;
          color: #c53030;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-file-btn:hover {
          background: #fc8181;
          color: white;
          transform: scale(1.1);
        }

        .upload-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #68B42D, #4a8c1f);
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
          box-shadow: 0 4px 16px rgba(104, 180, 45, 0.30);
        }

        .upload-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(104, 180, 45, 0.40);
        }

        .upload-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .upload-success {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          background: rgba(104, 180, 45, 0.10);
          border-radius: 8px;
          color: #276749;
          font-weight: 600;
          margin: 12px 0;
          border: 1px solid rgba(104, 180, 45, 0.20);
        }

        .success-icon {
          font-size: 1.2rem;
        }

        .supported-formats {
          font-size: 0.7rem;
          color: #a0aec0;
          text-align: center;
          margin: 8px 0 0 0;
        }

        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .submit-section {
          margin-top: 16px;
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 40px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .submit-btn.active {
          background: linear-gradient(135deg, #2A499B, #0A70BA);
          color: white;
          box-shadow: 0 6px 24px rgba(10, 112, 186, 0.35);
        }

        .submit-btn.active:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(10, 112, 186, 0.45);
        }

        .submit-btn.disabled {
          background: #e2e8f0;
          color: #a0aec0;
          cursor: not-allowed;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .submit-hint {
          font-size: 0.75rem;
          color: #718096;
          text-align: center;
          margin: 6px 0 0 0;
        }

        .modal-close-btn {
          width: 100%;
          padding: 12px;
          margin-top: 12px;
          background: rgba(237, 242, 247, 0.9);
          border: 2px solid #e2e8f0;
          border-radius: 40px;
          font-weight: 600;
          font-size: 0.95rem;
          color: #4a5568;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .modal-close-btn:hover {
          background: #e2e8f0;
        }

        /* Fullscreen QR Modal */
        .qr-fullscreen-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(12px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          padding: 20px;
        }

        .qr-fullscreen-content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .qr-fullscreen-image {
          width: auto;
          max-width: 80vw;
          max-height: 70vh;
          object-fit: contain;
          border-radius: 16px;
          background: white;
          padding: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .qr-fullscreen-actions {
          margin-top: 20px;
        }

        .fullscreen-download {
          padding: 12px 24px;
          font-size: 1rem;
        }

        .qr-fullscreen-close {
          position: absolute;
          top: -40px;
          right: -40px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 28px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qr-fullscreen-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        /* Mobile Responsive */
        @media (max-width: 480px) {
          .modal-content {
            padding: 24px 16px;
            max-width: 100%;
            border-radius: 20px;
            margin: 10px;
          }

          .modal-content h2 {
            font-size: 1.2rem;
          }

          .qr-code-large {
            width: 140px;
            height: 140px;
          }

          .qr-container {
            padding: 16px;
          }

          .account-name {
            font-size: 0.9rem;
          }

          .reference-input {
            font-size: 0.85rem;
            padding: 10px 14px;
          }

          .file-input-label {
            font-size: 0.8rem;
            padding: 10px 14px;
          }

          .upload-btn,
          .submit-btn {
            font-size: 0.85rem;
            padding: 12px;
          }

          .download-btn {
            font-size: 0.7rem;
            padding: 6px 12px;
          }

          .qr-fullscreen-close {
            top: -30px;
            right: 0;
            font-size: 22px;
            width: 40px;
            height: 40px;
          }
        }

        @media (max-width: 380px) {
          .modal-content {
            padding: 20px 12px;
          }

          .qr-code-large {
            width: 110px;
            height: 110px;
          }

          .qr-container {
            padding: 12px;
          }

          .account-name {
            font-size: 0.8rem;
          }

          .account-number {
            font-size: 0.75rem;
          }
        }

        /* Scrollbar styling */
        .modal-content::-webkit-scrollbar {
          width: 6px;
        }

        .modal-content::-webkit-scrollbar-track {
          background: #f7fafc;
          border-radius: 10px;
        }

        .modal-content::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 10px;
        }

        .modal-content::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </>
  );
};

export default PaymentModal;