import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RegistrationForm from '../components/RegistrationForm';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';

const Dashboard = () => {
  const { currentUser, userData, logout, getUserRegistrations, updateRegistration } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isWaiverOpen, setIsWaiverOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptImageUrl, setReceiptImageUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptFiles, setReceiptFiles] = useState([]);
  const [receiptPreviews, setReceiptPreviews] = useState([]);
  const [compressedReceiptData, setCompressedReceiptData] = useState([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadImageUrl, setDownloadImageUrl] = useState('');
  const [downloadFileName, setDownloadFileName] = useState('');
  const [downloadType, setDownloadType] = useState('');
  const fileInputRef = useRef(null);
  const captureRef = useRef(null);
  const waiverCaptureRef = useRef(null);
  const navigate = useNavigate();

  // ✅ Event data mapping with fees
  const eventData = {
    'OPEN CATEGORY': {
      events: ['FUN RUN', 'ROAD RACE', 'HALF MARATHON'],
      distances: { 
        'FUN RUN': '6KM', 
        'ROAD RACE': '10KM', 
        'HALF MARATHON': '21KM' 
      },
      fees: {
        'FUN RUN': 500,
        'ROAD RACE': 800,
        'HALF MARATHON': 1300
      }
    },
    '40 UPPERS / MASTER CATEGORY': {
      events: ['ROAD RACE', 'HALF MARATHON'],
      distances: { 
        'ROAD RACE': '10KM', 
        'HALF MARATHON': '21KM' 
      },
      fees: {
        'ROAD RACE': 800,
        'HALF MARATHON': 1300
      }
    },
    'LILOAN ONLY CATEGORY': {
      events: ['FUN RUN'],
      distances: { 
        'FUN RUN': '6KM' 
      },
      fees: {
        'FUN RUN': 500
      }
    }
  };

  const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  // ✅ Function to fetch registrations
  const fetchRegistrations = async () => {
    if (currentUser) {
      setLoading(true);
      const userRegs = await getUserRegistrations(currentUser.uid);
      setRegistrations(userRegs);
      setLoading(false);
    }
  };

  const handleRegistrationSuccess = () => {
    fetchRegistrations();
  };

  useEffect(() => {
    fetchRegistrations();
  }, [currentUser, getUserRegistrations]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  // ✅ Function to compress image
  const compressImage = (dataUrl, maxSizeKB = 150) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
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
        
        let quality = 0.7;
        let compressed = canvas.toDataURL('image/jpeg', quality);
        
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

  // ✅ Universal download function - works on all devices including Facebook in-app browser
  const downloadImage = () => {
    if (!downloadImageUrl) return;

    // ✅ Check if iPhone or Safari or Facebook in-app
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isFacebook = navigator.userAgent.includes('FBAV') || navigator.userAgent.includes('FBAN');
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isIOS || isSafari || isFacebook) {
      // For iPhone/Safari/Facebook - use fetch to create a blob
      fetch(downloadImageUrl)
        .then(response => response.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          
          // Create a temporary anchor element
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = downloadFileName;
          link.style.display = 'none';
          
          // Add to document, click, and remove
          document.body.appendChild(link);
          link.click();
          
          // Clean up
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
          }, 200);
        })
        .catch(() => {
          // Fallback: Open in new tab with instructions
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(`
              <html>
                <head><title>Download Image</title></head>
                <body style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;font-family:Arial;background:#f7fafc;margin:0;padding:20px;">
                  <div style="background:white;border-radius:16px;padding:24px;max-width:500px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
                    <h2 style="color:#2A499B;text-align:center;margin-top:0;">📥 Download Image</h2>
                    <img src="${downloadImageUrl}" style="width:100%;height:auto;border-radius:8px;border:2px solid #e2e8f0;" />
                    <div style="margin-top:16px;text-align:center;">
                      <p style="color:#4a5568;font-size:14px;">👆 <strong>Long press</strong> the image above</p>
                      <p style="color:#4a5568;font-size:14px;margin-top:4px;">Select <strong>"Save Image"</strong> to download to your device</p>
                      <button onclick="window.close()" style="margin-top:16px;padding:12px 32px;background:linear-gradient(135deg,#2A499B,#0A70BA);color:white;border:none;border-radius:40px;font-size:16px;cursor:pointer;font-weight:600;">Close</button>
                    </div>
                  </div>
                  <script>
                    setTimeout(() => window.close(), 60000);
                  <\/script>
                </body>
              </html>
            `);
            newWindow.document.title = downloadFileName;
          } else {
            // Last resort: show alert with instructions
            alert('📸 Please allow pop-ups.\n\nLong press the image that appears and select "Save Image" to download.');
            // Open image in current window
            const img = document.createElement('img');
            img.src = downloadImageUrl;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '80vh';
            img.style.display = 'block';
            img.style.margin = '0 auto';
            document.body.innerHTML = '';
            document.body.appendChild(img);
          }
        });
    } else {
      // Standard download for other browsers
      const link = document.createElement('a');
      link.download = downloadFileName;
      link.href = downloadImageUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    // Close the download modal after a moment
    setTimeout(() => {
      setShowDownloadModal(false);
      setDownloadImageUrl('');
      setDownloadFileName('');
      setDownloadType('');
    }, 1000);
  };

  // Close download modal without downloading
  const closeDownloadModal = () => {
    setShowDownloadModal(false);
    setDownloadImageUrl('');
    setDownloadFileName('');
    setDownloadType('');
  };

  // ============================================================
  // FUNCTION 1: DOWNLOAD PAYMENT CARD
  // ============================================================
  const generatePaymentCardImage = async (registration) => {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '500px';
    tempDiv.style.maxWidth = '500px';
    tempDiv.style.background = 'white';
    tempDiv.style.fontFamily = 'Segoe UI, Arial, Helvetica, sans-serif';
    tempDiv.style.padding = '0';
    tempDiv.style.boxSizing = 'border-box';
    
    tempDiv.innerHTML = `
      <div style="padding: 30px 35px 25px; width: 100%; box-sizing: border-box; background: white;">
        <div style="text-align: center; margin-bottom: 18px;">
          <h1 style="font-size: 22px; color: #2A499B; margin: 0 0 4px 0; font-weight: 700;">🏃 Liloan Love the Life</h1>
          <h2 style="font-size: 16px; color: #0A70BA; margin: 0 0 8px 0; font-weight: 500;">Registration Confirmation</h2>
          <div style="border-top: 2px solid #EDDB0B; margin: 10px 0; width: 100%;"></div>
        </div>
        
        <div style="margin: 10px 0; flex: 1;">
          <div style="display: flex; padding: 6px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Name</span>
            <span style="flex: 1; color: #2d3748; font-size: 13px; font-weight: 500;">${registration.userName || 'N/A'}</span>
          </div>
          <div style="display: flex; padding: 6px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Reference Number</span>
            <span style="flex: 1; color: #0A70BA; font-size: 13px; font-weight: 700; font-family: 'Courier New', monospace;">${registration.referenceNumber || 'N/A'}</span>
          </div>
          <div style="display: flex; padding: 6px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Event</span>
            <span style="flex: 1; color: #2d3748; font-size: 13px; font-weight: 500;">${registration.eventName || 'N/A'}</span>
          </div>
          <div style="display: flex; padding: 6px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Category</span>
            <span style="flex: 1; color: #2d3748; font-size: 13px; font-weight: 500;">${registration.category || 'N/A'}</span>
          </div>
          <div style="display: flex; padding: 6px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Shirt Size</span>
            <span style="flex: 1; color: #0A70BA; font-size: 13px; font-weight: 700;">${registration.shirtSize || 'N/A'}</span>
          </div>
          <div style="display: flex; padding: 6px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Fee</span>
            <span style="flex: 1; color: #2A499B; font-size: 13px; font-weight: 700;">₱${registration.fee?.toLocaleString() || '0'}.00</span>
          </div>
          <div style="display: flex; padding: 6px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Status</span>
            <span style="flex: 1; color: #68B42D; font-size: 13px; font-weight: 700;">✔ Completed</span>
          </div>
          <div style="display: flex; padding: 6px 0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Payment Date</span>
            <span style="flex: 1; color: #2d3748; font-size: 13px; font-weight: 500;">${new Date(registration.paymentDate || registration.registeredAt).toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding-top: 14px; border-top: 2px solid #EDDB0B;">
          <p style="margin: 3px 0; color: #4a5568; font-size: 13px; font-weight: 500;">Thank you for registering</p>
          <p style="margin: 3px 0; font-size: 11px; color: #a0aec0; font-weight: 400;">Liloan Love the Life • 2026</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(tempDiv);

    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // ✅ Force reflow to ensure proper rendering
      const forceReflow = tempDiv.offsetHeight;
      // eslint-disable-next-line no-unused-expressions
      forceReflow;
      
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        width: 500,
        height: tempDiv.scrollHeight,
        windowWidth: 500,
        windowHeight: tempDiv.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[style*="left: -9999px"]');
          if (clonedElement) {
            clonedElement.style.width = '500px';
            clonedElement.style.maxWidth = '500px';
          }
        }
      });

      const imageData = canvas.toDataURL('image/png');
      const fileName = `payment-${registration.referenceNumber || 'confirmation'}.png`;
      
      setDownloadImageUrl(imageData);
      setDownloadFileName(fileName);
      setDownloadType('payment');
      setShowDownloadModal(true);

    } catch (error) {
      console.error('Error generating payment image:', error);
      alert('Failed to generate payment image. Please try again.');
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  // ============================================================
  // FUNCTION 2: DOWNLOAD FULL REGISTRATION FORM
  // ============================================================
  const generateFullRegistrationImage = async (registration) => {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '550px';
    tempDiv.style.maxWidth = '550px';
    tempDiv.style.background = 'white';
    tempDiv.style.fontFamily = 'Segoe UI, Arial, Helvetica, sans-serif';
    tempDiv.style.padding = '0';
    tempDiv.style.boxSizing = 'border-box';
    
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    const formatDateWithTime = (dateString) => {
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

    const getGenderLabel = (gender) => {
      if (gender === 'male' || gender === 'Male') return '☑ Male';
      if (gender === 'female' || gender === 'Female') return '☑ Female';
      return gender || 'N/A';
    };

    tempDiv.innerHTML = `
      <div style="padding: 30px 35px 25px; width: 100%; box-sizing: border-box; background: white;">
        <div style="text-align: center; margin-bottom: 18px;">
          <h1 style="font-size: 22px; color: #2A499B; margin: 0 0 4px 0; font-weight: 700;">🏃 Liloan Love the Life</h1>
          <h2 style="font-size: 16px; color: #0A70BA; margin: 0 0 8px 0; font-weight: 500;">Registration Confirmation</h2>
          <div style="border-top: 2px solid #EDDB0B; margin: 10px 0; width: 100%;"></div>
        </div>

        <!-- Personal Information -->
        <div style="margin-bottom: 10px;">
          <h3 style="font-size: 14px; font-weight: 700; color: #2A499B; margin: 0 0 6px 0;">Personal Information</h3>
          <div style="display: flex; padding: 5px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Name</span>
            <span style="flex: 1; color: #2d3748; font-size: 13px; font-weight: 500;">${registration.userName || 'N/A'}</span>
          </div>
          <div style="display: flex; padding: 5px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Birthdate</span>
            <span style="flex: 1; color: #2d3748; font-size: 13px; font-weight: 500;">${formatDate(registration.birthdate) || 'N/A'}</span>
          </div>
          <div style="display: flex; padding: 5px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Age</span>
            <span style="flex: 1; color: #2d3748; font-size: 13px; font-weight: 500;">${registration.age || 'N/A'}</span>
          </div>
          <div style="display: flex; padding: 5px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Gender</span>
            <span style="flex: 1; color: #2d3748; font-size: 13px; font-weight: 500;">${getGenderLabel(registration.gender)}</span>
          </div>
          <div style="display: flex; padding: 5px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Blood Type</span>
            <span style="flex: 1; color: #2d3748; font-size: 13px; font-weight: 500;">${registration.bloodType || 'N/A'}</span>
          </div>
          <div style="display: flex; padding: 5px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Mobile Number</span>
            <span style="flex: 1; color: #2d3748; font-size: 13px; font-weight: 500;">${registration.mobileNumber || 'N/A'}</span>
          </div>
          <div style="display: flex; padding: 5px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Email</span>
            <span style="flex: 1; color: #2d3748; font-size: 13px; font-weight: 500;">${registration.email || 'N/A'}</span>
          </div>
          <div style="display: flex; padding: 5px 0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Home Address</span>
            <span style="flex: 1; color: #2d3748; font-size: 13px; font-weight: 500;">${registration.homeAddress || 'N/A'}</span>
          </div>
        </div>

        <div style="border-top: 2px solid #EDDB0B; margin: 10px 0;"></div>

        <!-- Emergency Contact -->
        <div style="margin-bottom: 10px;">
          <h3 style="font-size: 14px; font-weight: 700; color: #2A499B; margin: 0 0 6px 0;">Emergency Contact</h3>
          <div style="display: flex; padding: 5px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Contact Person</span>
            <span style="flex: 1; color: #2d3748; font-size: 13px; font-weight: 500;">${registration.emergencyContact || 'N/A'}</span>
          </div>
          <div style="display: flex; padding: 5px 0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Contact Number</span>
            <span style="flex: 1; color: #2d3748; font-size: 13px; font-weight: 500;">${registration.emergencyNumber || 'N/A'}</span>
          </div>
        </div>

        <div style="border-top: 2px solid #EDDB0B; margin: 10px 0;"></div>

        <!-- Event Details -->
        <div style="margin-bottom: 10px;">
          <h3 style="font-size: 14px; font-weight: 700; color: #2A499B; margin: 0 0 6px 0;">Event Details</h3>
          <div style="display: flex; padding: 5px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Event</span>
            <span style="flex: 1; color: #2d3748; font-size: 13px; font-weight: 500;">${registration.eventName || 'N/A'}</span>
          </div>
          <div style="display: flex; padding: 5px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Category</span>
            <span style="flex: 1; color: #2d3748; font-size: 13px; font-weight: 500;">${registration.category || 'N/A'}</span>
          </div>
          <div style="display: flex; padding: 5px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Distance</span>
            <span style="flex: 1; color: #2d3748; font-size: 13px; font-weight: 500;">${registration.distance || 'N/A'}</span>
          </div>
          <div style="display: flex; padding: 5px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Shirt Size</span>
            <span style="flex: 1; color: #0A70BA; font-size: 13px; font-weight: 700;">${registration.shirtSize || 'N/A'}</span>
          </div>
          <div style="display: flex; padding: 5px 0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Fee</span>
            <span style="flex: 1; color: #2A499B; font-size: 13px; font-weight: 700;">₱${registration.fee?.toLocaleString() || '0'}.00</span>
          </div>
        </div>

        <div style="border-top: 2px solid #EDDB0B; margin: 10px 0;"></div>

        <!-- Payment Details -->
        <div style="margin-bottom: 10px;">
          <h3 style="font-size: 14px; font-weight: 700; color: #2A499B; margin: 0 0 6px 0;">Payment Details</h3>
          <div style="display: flex; padding: 5px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Payment Method</span>
            <span style="flex: 1; color: #2d3748; font-size: 13px; font-weight: 500;">${registration.paymentMethod?.toUpperCase() || 'N/A'}</span>
          </div>
          <div style="display: flex; padding: 5px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Reference Number</span>
            <span style="flex: 1; color: #0A70BA; font-size: 13px; font-weight: 700; font-family: 'Courier New', monospace;">${registration.referenceNumber || 'N/A'}</span>
          </div>
          <div style="display: flex; padding: 5px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Payment Date</span>
            <span style="flex: 1; color: #2d3748; font-size: 13px; font-weight: 500;">${formatDateWithTime(registration.paymentDate || registration.registeredAt)}</span>
          </div>
          <div style="display: flex; padding: 5px 0; align-items: center;">
            <span style="flex: 0 0 140px; font-weight: 600; color: #4a5568; font-size: 13px;">Status</span>
            <span style="flex: 1; color: #68B42D; font-size: 13px; font-weight: 700;">✔ Completed</span>
          </div>
        </div>

        <div style="border-top: 2px solid #EDDB0B; margin: 10px 0;"></div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 10px; padding-top: 12px;">
          <p style="margin: 3px 0; color: #4a5568; font-size: 13px; font-weight: 500;">Thank you for registering</p>
          <p style="margin: 3px 0; font-size: 11px; color: #a0aec0; font-weight: 400;">Liloan Love the Life • 2026</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(tempDiv);

    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // ✅ Force reflow
      const forceReflow = tempDiv.offsetHeight;
      // eslint-disable-next-line no-unused-expressions
      forceReflow;
      
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        width: 550,
        height: tempDiv.scrollHeight,
        windowWidth: 550,
        windowHeight: tempDiv.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[style*="left: -9999px"]');
          if (clonedElement) {
            clonedElement.style.width = '550px';
            clonedElement.style.maxWidth = '550px';
          }
        }
      });

      const imageData = canvas.toDataURL('image/png');
      const fileName = `registration-form-${registration.referenceNumber || 'confirmation'}.png`;
      
      setDownloadImageUrl(imageData);
      setDownloadFileName(fileName);
      setDownloadType('registration');
      setShowDownloadModal(true);

    } catch (error) {
      console.error('Error generating registration form image:', error);
      alert('Failed to generate registration form image. Please try again.');
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  // ============================================================
  // FUNCTION 3: DOWNLOAD WAIVER
  // ============================================================
  const generateWaiverImageFromCard = async (registration) => {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '550px';
    tempDiv.style.maxWidth = '550px';
    tempDiv.style.background = 'white';
    tempDiv.style.fontFamily = 'Segoe UI, Arial, Helvetica, sans-serif';
    tempDiv.style.padding = '0';
    tempDiv.style.boxSizing = 'border-box';
    
    tempDiv.innerHTML = `
      <div style="padding: 35px 35px 25px; width: 100%; box-sizing: border-box; background: white; display: flex; flex-direction: column; min-height: 100%;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="font-size: 22px; color: #2A499B; margin: 0 0 4px 0; font-weight: 700;">🏃 Liloan Love the Life</h1>
          <h2 style="font-size: 17px; color: #0A70BA; margin: 0 0 8px 0; font-weight: 600;">WAIVER AND RELEASE OF LIABILITY</h2>
          <div style="border-top: 2px solid #EDDB0B; margin: 10px 0; width: 100%;"></div>
        </div>

        <div style="margin: 12px 0; flex: 1;">
          <p style="font-size: 13px; line-height: 1.8; color: #2d3748; margin-bottom: 14px; text-align: justify;">
            I hereby certify that I am physically fit and in good health to participate in the Lilo-Wawa Half Marathon. I understand that running is a strenuous physical activity that involves inherent risks, including injury, illness, dehydration, accidents, and other unforeseen circumstances.
          </p>

          <p style="font-size: 13px; line-height: 1.8; color: #2d3748; margin-bottom: 14px; text-align: justify;">
            I acknowledge that food and refreshments may be provided during the event and accept full responsibility for any allergies, dietary restrictions, or adverse reactions resulting from their consumption.
          </p>

          <p style="font-size: 13px; line-height: 1.8; color: #2d3748; margin-bottom: 14px; text-align: justify;">
            I further understand that the organizers will have standby medical personnel and first-aid assistance available during the event. However, I acknowledge that such assistance does not eliminate all risks associated with participation, and I voluntarily assume full responsibility for my health and safety.
          </p>

          <p style="font-size: 13px; line-height: 1.8; color: #2d3748; margin-bottom: 14px; text-align: justify;">
            In consideration of my participation, I hereby release and hold harmless the organizers, sponsors, partners, volunteers, medical personnel, and the Municipality of Liloan from any liability, claims, damages, injuries, losses, or expenses arising from or related to my participation in the event, except in cases of gross negligence or willful misconduct.
          </p>

          <p style="font-size: 13px; line-height: 1.8; color: #2d3748; margin-bottom: 14px; text-align: justify;">
            By registering for the Lilo-Wawa Half Marathon, I confirm that I have read, understood, and voluntarily agreed to this waiver and release of liability.
          </p>

          <div style="margin-top: 20px; padding-top: 14px; border-top: 2px solid #EDDB0B;">
            <div style="display: flex; align-items: center; gap: 12px; padding: 6px 0;">
              <span style="font-weight: 600; color: #4a5568; font-size: 13px; min-width: 150px;">Participant's Name:</span>
              <span style="color: #2d3748; font-size: 13px; border-bottom: 1px solid #cbd5e0; padding: 2px 8px; flex: 1;">${registration.userName || '________________________'}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; padding: 6px 0;">
              <span style="font-weight: 600; color: #4a5568; font-size: 13px; min-width: 150px;">Signature:</span>
              <span style="color: #2d3748; font-size: 13px; border-bottom: 1px solid #cbd5e0; padding: 2px 8px; flex: 1;">_______________________________</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; padding: 6px 0;">
              <span style="font-weight: 600; color: #4a5568; font-size: 13px; min-width: 150px;">Date:</span>
              <span style="color: #2d3748; font-size: 13px; border-bottom: 1px solid #cbd5e0; padding: 2px 8px; flex: 1;">${new Date().toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 18px; padding-top: 12px; border-top: 2px solid #EDDB0B;">
          <p style="font-size: 12px; color: #a0aec0;">Liloan Love the Life • 2026</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(tempDiv);

    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // ✅ Force reflow
      const forceReflow = tempDiv.offsetHeight;
      // eslint-disable-next-line no-unused-expressions
      forceReflow;
      
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        width: 550,
        height: tempDiv.scrollHeight,
        windowWidth: 550,
        windowHeight: tempDiv.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[style*="left: -9999px"]');
          if (clonedElement) {
            clonedElement.style.width = '550px';
            clonedElement.style.maxWidth = '550px';
          }
        }
      });

      const imageData = canvas.toDataURL('image/png');
      const fileName = `waiver-${registration.userName || 'participant'}.png`;
      
      setDownloadImageUrl(imageData);
      setDownloadFileName(fileName);
      setDownloadType('waiver');
      setShowDownloadModal(true);

    } catch (error) {
      console.error('Error generating waiver image:', error);
      alert('Failed to generate waiver image. Please try again.');
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  // ✅ HANDLE EDIT - Populate edit form with registration data
  const handleEditClick = () => {
    setIsEditing(true);
    setEditFormData({
      userName: selectedRegistration?.userName || '',
      birthdate: selectedRegistration?.birthdate || '',
      age: selectedRegistration?.age || '',
      gender: selectedRegistration?.gender || '',
      bloodType: selectedRegistration?.bloodType || '',
      mobileNumber: selectedRegistration?.mobileNumber || '',
      email: selectedRegistration?.email || '',
      homeAddress: selectedRegistration?.homeAddress || '',
      emergencyContact: selectedRegistration?.emergencyContact || '',
      emergencyNumber: selectedRegistration?.emergencyNumber || '',
      referenceNumber: selectedRegistration?.referenceNumber || '',
      category: selectedRegistration?.category || '',
      eventName: selectedRegistration?.eventName || '',
      distance: selectedRegistration?.distance || '',
      shirtSize: selectedRegistration?.shirtSize || '',
      fee: selectedRegistration?.fee || '',
    });
    setReceiptFiles([]);
    setReceiptPreviews([]);
    setCompressedReceiptData([]);
    setUploadSuccess(false);
    setSaveSuccess('');
    setSaveError('');
  };

  // ✅ HANDLE CANCEL EDIT
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({});
    setReceiptFiles([]);
    setReceiptPreviews([]);
    setCompressedReceiptData([]);
    setUploadSuccess(false);
    setSaveSuccess('');
    setSaveError('');
  };

  // ✅ HANDLE INPUT CHANGE IN EDIT MODE
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ HANDLE BIRTHDATE CHANGE - Auto calculate age
  const handleEditBirthdateChange = (e) => {
    const birthdate = e.target.value;
    const age = calculateAge(birthdate);
    setEditFormData(prev => ({
      ...prev,
      birthdate: birthdate,
      age: age
    }));
  };

  // ✅ HANDLE CATEGORY CHANGE - Auto update event options, reset event/distance/fee
  const handleCategoryChange = (e) => {
    const category = e.target.value;
    const events = eventData[category]?.events || [];
    const firstEvent = events.length > 0 ? events[0] : '';
    const distance = firstEvent ? eventData[category]?.distances[firstEvent] || '' : '';
    const fee = firstEvent ? eventData[category]?.fees[firstEvent] || '' : '';
    
    setEditFormData(prev => ({
      ...prev,
      category: category,
      eventName: firstEvent,
      distance: distance,
      fee: fee
    }));
  };

  // ✅ HANDLE EVENT CHANGE - Auto update distance and fee
  const handleEventChange = (e) => {
    const eventName = e.target.value;
    const category = editFormData.category;
    const distance = eventData[category]?.distances[eventName] || '';
    const fee = eventData[category]?.fees[eventName] || '';
    
    setEditFormData(prev => ({
      ...prev,
      eventName: eventName,
      distance: distance,
      fee: fee
    }));
  };

  // ✅ Calculate age helper
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

  // ✅ Handle receipt file selection - compress immediately
  const handleReceiptFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setSaveError('Please select image files (JPEG, PNG, etc.)');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }

    for (const file of imageFiles) {
      if (file.size > 5 * 1024 * 1024) {
        setSaveError('File size must be less than 5MB each');
        setTimeout(() => setSaveError(''), 3000);
        return;
      }
    }

    setSaveError('');
    setUploadSuccess(false);

    const newReceiptFiles = [...receiptFiles];
    const newReceiptPreviews = [...receiptPreviews];
    const newCompressedData = [...compressedReceiptData];

    for (const file of imageFiles) {
      newReceiptFiles.push(file);
      
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      try {
        const compressedImage = await compressImage(dataUrl, 150);
        newReceiptPreviews.push(compressedImage);
        newCompressedData.push(compressedImage);
      } catch (error) {
        console.error('Error compressing image:', error);
        newReceiptPreviews.push(dataUrl);
        newCompressedData.push(dataUrl);
      }
    }

    setReceiptFiles(newReceiptFiles);
    setReceiptPreviews(newReceiptPreviews);
    setCompressedReceiptData(newCompressedData);
    
    if (newCompressedData.length > 0) {
      setUploadSuccess(true);
      setSaveSuccess(`✅ ${newCompressedData.length} new receipt(s) ready to save! Click "Save Changes" to update.`);
      setTimeout(() => setSaveSuccess(''), 3000);
    }
  };

  // ✅ Remove a NEW receipt
  const handleRemoveNewReceipt = (index) => {
    const newFiles = [...receiptFiles];
    const newPreviews = [...receiptPreviews];
    const newCompressed = [...compressedReceiptData];
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    newCompressed.splice(index, 1);
    
    setReceiptFiles(newFiles);
    setReceiptPreviews(newPreviews);
    setCompressedReceiptData(newCompressed);
    
    if (newCompressed.length === 0) {
      setUploadSuccess(false);
    }
  };

  // ✅ Check if save button should be enabled
  const isSaveEnabled = () => {
    const eventChanged = 
      editFormData.category !== selectedRegistration?.category ||
      editFormData.eventName !== selectedRegistration?.eventName ||
      editFormData.distance !== selectedRegistration?.distance ||
      editFormData.shirtSize !== selectedRegistration?.shirtSize ||
      editFormData.fee !== selectedRegistration?.fee;
    
    const otherFieldsChanged =
      editFormData.userName !== selectedRegistration?.userName ||
      editFormData.birthdate !== selectedRegistration?.birthdate ||
      editFormData.gender !== selectedRegistration?.gender ||
      editFormData.bloodType !== selectedRegistration?.bloodType ||
      editFormData.mobileNumber !== selectedRegistration?.mobileNumber ||
      editFormData.email !== selectedRegistration?.email ||
      editFormData.homeAddress !== selectedRegistration?.homeAddress ||
      editFormData.emergencyContact !== selectedRegistration?.emergencyContact ||
      editFormData.emergencyNumber !== selectedRegistration?.emergencyNumber ||
      editFormData.referenceNumber !== selectedRegistration?.referenceNumber;
    
    const hasNewReceipts = compressedReceiptData.length > 0;
    
    return (eventChanged && hasNewReceipts) || otherFieldsChanged || hasNewReceipts;
  };

  // ✅ HANDLE SAVE EDIT - UPDATED to handle both receipt formats
  const handleSaveEdit = async () => {
    if (!selectedRegistration || !currentUser) return;

    if (!editFormData.userName?.trim()) {
      setSaveError('❌ Please enter your full name');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }
    if (!editFormData.birthdate) {
      setSaveError('❌ Please enter your birthdate');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }
    if (!editFormData.gender) {
      setSaveError('❌ Please select your gender');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }
    if (!editFormData.bloodType) {
      setSaveError('❌ Please select your blood type');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }
    if (!editFormData.mobileNumber?.trim()) {
      setSaveError('❌ Please enter your mobile number');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }
    if (!editFormData.email?.trim()) {
      setSaveError('❌ Please enter your email address');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }
    if (!editFormData.homeAddress?.trim()) {
      setSaveError('❌ Please enter your home address');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }
    if (!editFormData.emergencyContact?.trim()) {
      setSaveError('❌ Please enter emergency contact person');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }
    if (!editFormData.emergencyNumber?.trim()) {
      setSaveError('❌ Please enter emergency contact number');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }
    if (!editFormData.referenceNumber?.trim()) {
      setSaveError('❌ Please enter reference number');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }
    if (!editFormData.category) {
      setSaveError('❌ Please select a category');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }
    if (!editFormData.eventName) {
      setSaveError('❌ Please select an event');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }
    if (!editFormData.shirtSize) {
      setSaveError('❌ Please select a shirt size');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }

    setUploadingReceipt(true);

    try {
      const updateData = {
        userName: editFormData.userName,
        birthdate: editFormData.birthdate,
        age: editFormData.age,
        gender: editFormData.gender,
        bloodType: editFormData.bloodType,
        mobileNumber: editFormData.mobileNumber,
        email: editFormData.email,
        homeAddress: editFormData.homeAddress,
        emergencyContact: editFormData.emergencyContact,
        emergencyNumber: editFormData.emergencyNumber,
        referenceNumber: editFormData.referenceNumber.trim(),
        category: editFormData.category,
        eventName: editFormData.eventName,
        distance: editFormData.distance,
        shirtSize: editFormData.shirtSize,
        fee: editFormData.fee,
        updatedAt: new Date().toISOString()
      };

      // ✅ Get existing receipts (support both formats)
      let existingReceipts = [];
      
      if (selectedRegistration.receiptPreviews && Array.isArray(selectedRegistration.receiptPreviews) && selectedRegistration.receiptPreviews.length > 0) {
        existingReceipts = selectedRegistration.receiptPreviews;
      } else if (selectedRegistration.receiptPreview && typeof selectedRegistration.receiptPreview === 'string') {
        existingReceipts = [selectedRegistration.receiptPreview];
      }

      if (compressedReceiptData.length > 0) {
        const allReceipts = [...existingReceipts, ...compressedReceiptData];
        updateData.receiptPreviews = allReceipts;
        updateData.hasReceipts = true;
        if (selectedRegistration.receiptPreview) {
          updateData.receiptPreview = null;
        }
        const existingFileNames = selectedRegistration.receiptFileNames || [];
        const newFileNames = receiptFiles.map(f => f.name);
        updateData.receiptFileNames = [...existingFileNames, ...newFileNames];
        updateData.receiptUploadedAt = new Date().toISOString();
      } else {
        if (existingReceipts.length > 0) {
          updateData.receiptPreviews = existingReceipts;
          updateData.hasReceipts = true;
          if (selectedRegistration.receiptPreview) {
            updateData.receiptPreview = null;
          }
        }
      }

      await updateRegistration(currentUser.uid, selectedRegistration.id, updateData);

      const updatedRegistration = {
        ...selectedRegistration,
        ...updateData
      };
      
      setSelectedRegistration(updatedRegistration);

      setRegistrations(prev => prev.map(reg => 
        reg.id === selectedRegistration.id 
          ? updatedRegistration
          : reg
      ));

      setIsEditing(false);
      setReceiptFiles([]);
      setReceiptPreviews([]);
      setCompressedReceiptData([]);
      setUploadSuccess(false);
      setSaveSuccess('✅ Registration updated successfully!');
      setTimeout(() => setSaveSuccess(''), 3000);

    } catch (error) {
      console.error('Error updating registration:', error);
      setSaveError('❌ Failed to update registration. Please try again.');
      setTimeout(() => setSaveError(''), 3000);
    } finally {
      setUploadingReceipt(false);
    }
  };

  // ✅ Handle receipt click - open receipt modal
  const handleReceiptClick = (imageUrl) => {
    setReceiptImageUrl(imageUrl);
    setShowReceiptModal(true);
  };

  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
    setReceiptImageUrl('');
  };

  const GENDER_OPTIONS = [
    { id: 'Male', label: '☑ Male' },
    { id: 'Female', label: '☑ Female' }
  ];

  const BLOOD_TYPE_OPTIONS = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'
  ];

  const CATEGORY_OPTIONS = ['OPEN CATEGORY', '40 UPPERS / MASTER CATEGORY', 'LILOAN ONLY CATEGORY'];

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateWithTime = (dateString) => {
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

  const getGenderLabel = (gender) => {
    if (gender === 'male' || gender === 'Male') return '☑ Male';
    if (gender === 'female' || gender === 'Female') return '☑ Female';
    return gender || 'N/A';
  };

  const getInitials = (name) => {
    if (!name) return '👤';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ['#EDDB0B', '#68B42D', '#00A8AB', '#0A70BA', '#2A499B'];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleViewRegistration = (registration) => {
    setSelectedRegistration(registration);
    setIsViewModalOpen(true);
    setIsWaiverOpen(false);
    setIsEditing(false);
    setEditFormData({});
    setReceiptFiles([]);
    setReceiptPreviews([]);
    setCompressedReceiptData([]);
    setUploadSuccess(false);
    setSaveSuccess('');
    setSaveError('');
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedRegistration(null);
    setIsWaiverOpen(false);
    setIsEditing(false);
    setEditFormData({});
    setReceiptFiles([]);
    setReceiptPreviews([]);
    setCompressedReceiptData([]);
    setUploadSuccess(false);
    setSaveSuccess('');
    setSaveError('');
  };

  const toggleWaiver = () => {
    setIsWaiverOpen(!isWaiverOpen);
  };

  // ============================================================
  // RETURN JSX
  // ============================================================
  return (
    <div style={styles.dashboard}>
      <div style={styles.backgroundEffects}>
        <div style={styles.glow1}></div>
        <div style={styles.glow2}></div>
        <div style={styles.glow3}></div>
      </div>

      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.userSection}>
            <div style={styles.avatarWrapper}>
              <div style={{
                ...styles.avatar,
                background: getAvatarColor(userData?.displayName || currentUser.email)
              }}>
                {getInitials(userData?.displayName || currentUser.email)}
              </div>
              <div style={styles.onlineDot}></div>
            </div>
            <div style={styles.userInfo}>
              <h2 style={styles.welcomeText}>
                Welcome back, <span style={styles.userName}>{userData?.displayName || 'User'}!</span>
              </h2>
              <p style={styles.userEmail}>
                <span style={styles.emailIcon}>✉️</span> {currentUser.email}
              </p>
              <div style={styles.userBadge}>
                <span style={styles.badgeIcon}>🏆</span>
                <span style={styles.badgeText}>
                  {registrations.length} {registrations.length === 1 ? 'Registration' : 'Registrations'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <span style={styles.logoutIcon}>🚪</span>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.content}>
        <RegistrationForm onRegistrationSuccess={handleRegistrationSuccess} />
        
        {registrations.length > 0 && (
          <div style={styles.historySection}>
            <div style={styles.historyHeader}>
              <h3 style={styles.historyTitle}>
                <span style={styles.historyIcon}>📋</span>
                Your Registrations
              </h3>
              <span style={styles.historyCount}>
                {registrations.length} entries
              </span>
            </div>
            <div style={styles.registrationsGrid}>
              {registrations.map((reg, index) => (
                <div key={reg.id || index} style={styles.registrationCard}>
                  <div style={styles.cardHeader}>
                    <div style={styles.cardBadge}>
                      <span style={{
                        ...styles.categoryBadge,
                        background: reg.category === 'OPEN CATEGORY' ? '#0A70BA' :
                                   reg.category === '40 UPPERS / MASTER CATEGORY' ? '#2A499B' : '#68B42D'
                      }}>
                        {reg.category || 'N/A'}
                      </span>
                      <span style={{
                        ...styles.statusBadge,
                        background: reg.status === 'completed' ? '#68B42D' :
                                   reg.status === 'pending' ? '#EDDB0B' : '#ff6b6b'
                      }}>
                        {reg.status || 'N/A'}
                      </span>
                    </div>
                    <span style={styles.cardDate}>
                      {formatDate(reg.registeredAt)}
                    </span>
                  </div>
                  
                  <div style={styles.cardBody}>
                    <h4 style={styles.eventName}>{reg.eventName || 'N/A'}</h4>
                    <div style={styles.eventDetails}>
                      <span style={styles.detailTag}>
                        <span style={styles.tagIcon}>📏</span>
                        {reg.distance || 'N/A'}
                      </span>
                      <span style={styles.detailTag}>
                        <span style={styles.tagIcon}>💰</span>
                        ₱{reg.fee?.toLocaleString() || '0'}
                      </span>
                      <span style={styles.detailTag}>
                        <span style={styles.tagIcon}>💳</span>
                        {reg.paymentMethod?.toUpperCase() || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={styles.cardFooter}>
                    <div style={styles.cardActions}>
                      <button 
                        style={styles.viewBtn}
                        onClick={() => handleViewRegistration(reg)}
                      >
                        <span style={styles.viewIcon}>👁️</span>
                        View Details
                      </button>
                      <button 
                        style={styles.downloadPaymentBtn}
                        onClick={() => generatePaymentCardImage(reg)}
                        title="Download Payment Card"
                      >
                        <span style={styles.imageIcon}>🖼️</span>
                        Download Payment
                      </button>
                      <button 
                        style={styles.downloadImageBtn}
                        onClick={() => generateFullRegistrationImage(reg)}
                        title="Download Full Registration Form"
                      >
                        <span style={styles.imageIcon}>🖼️</span>
                        Download Registration No.
                      </button>
                      <button 
                        style={styles.downloadWaiverBtn}
                        onClick={() => generateWaiverImageFromCard(reg)}
                        title="Download Waiver"
                      >
                        <span style={styles.imageIcon}>🖼️</span>
                        Download Waiver
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* VIEW MODAL */}
      {isViewModalOpen && selectedRegistration && (
        <div style={styles.modalOverlay} onClick={closeViewModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={closeViewModal}>×</button>

            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>📋 Registration Details</h2>
              <p style={styles.modalSubtitle}>
                {isEditing ? '✏️ Edit your information' : 'Complete registration information'}
              </p>
              {saveSuccess && (
                <div style={{...styles.saveMessage, background: 'rgba(104, 180, 45, 0.12)', borderColor: '#68B42D', color: '#276749'}}>
                  {saveSuccess}
                </div>
              )}
              {saveError && (
                <div style={{...styles.saveMessage, background: 'rgba(254, 215, 215, 0.9)', borderColor: '#fc8181', color: '#c53030'}}>
                  {saveError}
                </div>
              )}
              {uploadingReceipt && (
                <div style={{...styles.saveMessage, background: 'rgba(10, 112, 186, 0.12)', borderColor: '#0A70BA', color: '#2A499B'}}>
                  <span className="spinner-small"></span> Saving...
                </div>
              )}
            </div>

            {/* CAPTURE CONTENT for modal image */}
            <div id="capture-content-dashboard" ref={captureRef} style={styles.captureContent}>
              <div style={styles.captureInner}>
                <div style={styles.captureHeader}>
                  <h1 style={styles.captureHeaderH1}>🏃 Liloan Love the Life</h1>
                  <h2 style={styles.captureHeaderH2}>Registration Confirmation</h2>
                  <div style={styles.captureDivider}></div>
                </div>

                <div style={styles.captureSection}>
                  <h3 style={styles.captureSectionTitle}>Personal Information</h3>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Name</span>
                    <span style={styles.captureValue}>{selectedRegistration.userName || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Birthdate</span>
                    <span style={styles.captureValue}>{formatDate(selectedRegistration.birthdate) || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Age</span>
                    <span style={styles.captureValue}>{selectedRegistration.age || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Gender</span>
                    <span style={styles.captureValue}>{getGenderLabel(selectedRegistration.gender)}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Blood Type</span>
                    <span style={styles.captureValue}>{selectedRegistration.bloodType || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Mobile Number</span>
                    <span style={styles.captureValue}>{selectedRegistration.mobileNumber || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Email</span>
                    <span style={styles.captureValue}>{selectedRegistration.email || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Home Address</span>
                    <span style={styles.captureValue}>{selectedRegistration.homeAddress || 'N/A'}</span>
                  </div>
                </div>

                <div style={styles.captureDivider}></div>

                <div style={styles.captureSection}>
                  <h3 style={styles.captureSectionTitle}>Emergency Contact</h3>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Contact Person</span>
                    <span style={styles.captureValue}>{selectedRegistration.emergencyContact || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Contact Number</span>
                    <span style={styles.captureValue}>{selectedRegistration.emergencyNumber || 'N/A'}</span>
                  </div>
                </div>

                <div style={styles.captureDivider}></div>

                <div style={styles.captureSection}>
                  <h3 style={styles.captureSectionTitle}>Event Details</h3>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Event</span>
                    <span style={styles.captureValue}>{selectedRegistration.eventName || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Category</span>
                    <span style={styles.captureValue}>{selectedRegistration.category || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Distance</span>
                    <span style={styles.captureValue}>{selectedRegistration.distance || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Shirt Size</span>
                    <span style={{...styles.captureValue, color: '#0A70BA', fontWeight: 'bold'}}>{selectedRegistration.shirtSize || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Fee</span>
                    <span style={{...styles.captureValue, color: '#2A499B', fontWeight: 'bold'}}>₱{selectedRegistration.fee?.toLocaleString() || '0'}.00</span>
                  </div>
                </div>

                <div style={styles.captureDivider}></div>

                <div style={styles.captureSection}>
                  <h3 style={styles.captureSectionTitle}>Payment Details</h3>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Payment Method</span>
                    <span style={styles.captureValue}>{selectedRegistration.paymentMethod?.toUpperCase() || 'N/A'}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Reference Number</span>
                    <span style={{...styles.captureValue, color: '#0A70BA', fontFamily: 'Courier New, monospace', fontWeight: 'bold'}}>
                      {selectedRegistration.referenceNumber || 'N/A'}
                    </span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Payment Date</span>
                    <span style={styles.captureValue}>{formatDateWithTime(selectedRegistration.paymentDate || selectedRegistration.registeredAt)}</span>
                  </div>
                  <div style={styles.captureRow}>
                    <span style={styles.captureLabel}>Status</span>
                    <span style={{...styles.captureValue, color: '#68B42D', fontWeight: 'bold'}}>✔ Completed</span>
                  </div>
                </div>

                <div style={styles.captureDivider}></div>

                <div style={styles.captureFooter}>
                  <p>Thank you for registering</p>
                  <p style={styles.captureFooterSmall}>Liloan Love the Life • 2026</p>
                </div>
              </div>
            </div>

            {/* WAIVER CAPTURE CONTENT */}
            <div id="waiver-capture-content" ref={waiverCaptureRef} style={styles.waiverCaptureContent}>
              <div style={styles.waiverCaptureInner}>
                <div style={styles.waiverCaptureHeader}>
                  <h1 style={styles.waiverCaptureTitle}>🏃 Liloan Love the Life</h1>
                  <h2 style={styles.waiverCaptureSubtitle}>WAIVER AND RELEASE OF LIABILITY</h2>
                  <div style={styles.captureDivider}></div>
                </div>

                <div style={styles.waiverCaptureBody}>
                  <p style={styles.waiverCaptureText}>
                    I hereby certify that I am physically fit and in good health to participate in the Lilo-Wawa Half Marathon. I understand that running is a strenuous physical activity that involves inherent risks, including injury, illness, dehydration, accidents, and other unforeseen circumstances.
                  </p>
                  <p style={styles.waiverCaptureText}>
                    I acknowledge that food and refreshments may be provided during the event and accept full responsibility for any allergies, dietary restrictions, or adverse reactions resulting from their consumption.
                  </p>
                  <p style={styles.waiverCaptureText}>
                    I further understand that the organizers will have standby medical personnel and first-aid assistance available during the event. However, I acknowledge that such assistance does not eliminate all risks associated with participation, and I voluntarily assume full responsibility for my health and safety.
                  </p>
                  <p style={styles.waiverCaptureText}>
                    In consideration of my participation, I hereby release and hold harmless the organizers, sponsors, partners, volunteers, medical personnel, and the Municipality of Liloan from any liability, claims, damages, injuries, losses, or expenses arising from or related to my participation in the event, except in cases of gross negligence or willful misconduct.
                  </p>
                  <p style={styles.waiverCaptureText}>
                    By registering for the Lilo-Wawa Half Marathon, I confirm that I have read, understood, and voluntarily agreed to this waiver and release of liability.
                  </p>

                  <div style={styles.waiverCaptureSignature}>
                    <div style={styles.waiverCaptureField}>
                      <span style={styles.waiverCaptureFieldLabel}>Participant's Name:</span>
                      <span style={styles.waiverCaptureFieldValue}>{selectedRegistration?.userName || '________________________'}</span>
                    </div>
                    <div style={styles.waiverCaptureField}>
                      <span style={styles.waiverCaptureFieldLabel}>Signature:</span>
                      <span style={styles.waiverCaptureFieldValue}>_______________________________</span>
                    </div>
                    <div style={styles.waiverCaptureField}>
                      <span style={styles.waiverCaptureFieldLabel}>Date:</span>
                      <span style={styles.waiverCaptureFieldValue}>{formatDateWithTime(new Date().toISOString())}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.captureDivider}></div>
                <div style={styles.waiverCaptureFooter}>
                  <p style={styles.waiverCaptureFooterText}>Liloan Love the Life • 2026</p>
                </div>
              </div>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalSection}>
                <div style={styles.sectionHeader}>
                  <h3 style={styles.modalSectionTitle}>👤 Personal Information</h3>
                  {!isEditing && (
                    <button style={styles.editBtnSmall} onClick={handleEditClick}>
                      ✏️ Edit
                    </button>
                  )}
                </div>
                <div style={styles.modalGrid}>
                  {isEditing ? (
                    <>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Name <span style={styles.required}>*</span></span>
                        <input
                          type="text"
                          name="userName"
                          value={editFormData.userName || ''}
                          onChange={handleEditInputChange}
                          style={styles.editInput}
                        />
                      </div>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Birthdate <span style={styles.required}>*</span></span>
                        <input
                          type="date"
                          name="birthdate"
                          value={editFormData.birthdate || ''}
                          onChange={handleEditBirthdateChange}
                          style={styles.editInput}
                        />
                      </div>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Age</span>
                        <input
                          type="text"
                          name="age"
                          value={editFormData.age || ''}
                          style={{...styles.editInput, background: '#f7fafc'}}
                          disabled
                        />
                      </div>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Gender <span style={styles.required}>*</span></span>
                        <div style={styles.genderEditGroup}>
                          {GENDER_OPTIONS.map((gender) => (
                            <button
                              key={gender.id}
                              style={{
                                ...styles.genderEditBtn,
                                borderColor: editFormData.gender === gender.id ? '#0A70BA' : 'rgba(0, 168, 171, 0.20)',
                                background: editFormData.gender === gender.id 
                                  ? 'linear-gradient(135deg, #0A70BA, #2A499B)'
                                  : 'rgba(255, 255, 255, 0.7)',
                                color: editFormData.gender === gender.id ? 'white' : '#4a5568',
                              }}
                              onClick={() => setEditFormData(prev => ({ ...prev, gender: gender.id }))}
                            >
                              {gender.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Blood Type <span style={styles.required}>*</span></span>
                        <select
                          name="bloodType"
                          value={editFormData.bloodType || ''}
                          onChange={handleEditInputChange}
                          style={styles.editSelect}
                        >
                          <option value="">Select Blood Type</option>
                          {BLOOD_TYPE_OPTIONS.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Mobile Number <span style={styles.required}>*</span></span>
                        <input
                          type="tel"
                          name="mobileNumber"
                          value={editFormData.mobileNumber || ''}
                          onChange={handleEditInputChange}
                          style={styles.editInput}
                        />
                      </div>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Email <span style={styles.required}>*</span></span>
                        <input
                          type="email"
                          name="email"
                          value={editFormData.email || ''}
                          onChange={handleEditInputChange}
                          style={styles.editInput}
                        />
                      </div>
                      <div style={{...styles.modalItem, gridColumn: '1 / -1'}}>
                        <span style={styles.modalLabel}>Home Address <span style={styles.required}>*</span></span>
                        <textarea
                          name="homeAddress"
                          value={editFormData.homeAddress || ''}
                          onChange={handleEditInputChange}
                          style={styles.editTextarea}
                          rows="2"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Name</span>
                        <span style={styles.modalValue}>{selectedRegistration.userName || 'N/A'}</span>
                      </div>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Birthdate</span>
                        <span style={styles.modalValue}>{formatDateWithTime(selectedRegistration.birthdate) || 'N/A'}</span>
                      </div>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Age</span>
                        <span style={styles.modalValue}>{selectedRegistration.age || 'N/A'}</span>
                      </div>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Gender</span>
                        <span style={styles.modalValue}>{getGenderLabel(selectedRegistration.gender)}</span>
                      </div>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Blood Type</span>
                        <span style={styles.modalValue}>{selectedRegistration.bloodType || 'N/A'}</span>
                      </div>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Mobile Number</span>
                        <span style={styles.modalValue}>{selectedRegistration.mobileNumber || 'N/A'}</span>
                      </div>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Email</span>
                        <span style={styles.modalValue}>{selectedRegistration.email || 'N/A'}</span>
                      </div>
                      <div style={{...styles.modalItem, gridColumn: '1 / -1'}}>
                        <span style={styles.modalLabel}>Home Address</span>
                        <span style={styles.modalValue}>{selectedRegistration.homeAddress || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div style={styles.modalSection}>
                <div style={styles.sectionHeader}>
                  <h3 style={styles.modalSectionTitle}>🚨 Emergency Contact</h3>
                </div>
                <div style={styles.modalGrid}>
                  {isEditing ? (
                    <>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Contact Person <span style={styles.required}>*</span></span>
                        <input
                          type="text"
                          name="emergencyContact"
                          value={editFormData.emergencyContact || ''}
                          onChange={handleEditInputChange}
                          style={styles.editInput}
                        />
                      </div>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Contact Number <span style={styles.required}>*</span></span>
                        <input
                          type="tel"
                          name="emergencyNumber"
                          value={editFormData.emergencyNumber || ''}
                          onChange={handleEditInputChange}
                          style={styles.editInput}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Contact Person</span>
                        <span style={styles.modalValue}>{selectedRegistration.emergencyContact || 'N/A'}</span>
                      </div>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Contact Number</span>
                        <span style={styles.modalValue}>{selectedRegistration.emergencyNumber || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ✅ Event Details */}
              <div style={styles.modalSection}>
                <div style={styles.sectionHeader}>
                  <h3 style={styles.modalSectionTitle}>🏁 Event Details</h3>
                  {!isEditing && (
                    <button style={styles.editBtnSmall} onClick={handleEditClick}>
                      ✏️ Edit
                    </button>
                  )}
                </div>
                <div style={styles.modalGrid}>
                  {isEditing ? (
                    <>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Category <span style={styles.required}>*</span></span>
                        <div style={styles.selectWrapper}>
                          <select
                            name="category"
                            value={editFormData.category || ''}
                            onChange={handleCategoryChange}
                            style={styles.editSelect}
                          >
                            <option value="">Select Category</option>
                            {CATEGORY_OPTIONS.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <span style={styles.selectArrow}>▼</span>
                        </div>
                      </div>

                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Event <span style={styles.required}>*</span></span>
                        <div style={styles.selectWrapper}>
                          <select
                            name="eventName"
                            value={editFormData.eventName || ''}
                            onChange={handleEventChange}
                            style={styles.editSelect}
                            disabled={!editFormData.category}
                          >
                            <option value="">Select Event</option>
                            {editFormData.category && eventData[editFormData.category]?.events.map((evt) => (
                              <option key={evt} value={evt}>{evt}</option>
                            ))}
                          </select>
                          <span style={styles.selectArrow}>▼</span>
                        </div>
                      </div>

                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Distance</span>
                        <input
                          type="text"
                          name="distance"
                          value={editFormData.distance || ''}
                          style={{...styles.editInput, background: '#f7fafc'}}
                          disabled
                        />
                      </div>

                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Shirt Size <span style={styles.required}>*</span></span>
                        <div style={styles.selectWrapper}>
                          <select
                            name="shirtSize"
                            value={editFormData.shirtSize || ''}
                            onChange={handleEditInputChange}
                            style={styles.editSelect}
                          >
                            <option value="">Select Shirt Size</option>
                            {SHIRT_SIZES.map((size) => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                          <span style={styles.selectArrow}>▼</span>
                        </div>
                      </div>

                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Fee</span>
                        <input
                          type="text"
                          value={editFormData.fee ? `₱${editFormData.fee.toLocaleString()}.00` : '₱0.00'}
                          style={{...styles.editInput, background: '#f7fafc', fontWeight: 'bold', color: '#2A499B'}}
                          disabled
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Event</span>
                        <span style={styles.modalValue}>{selectedRegistration.eventName || 'N/A'}</span>
                      </div>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Category</span>
                        <span style={styles.modalValue}>{selectedRegistration.category || 'N/A'}</span>
                      </div>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Distance</span>
                        <span style={styles.modalValue}>{selectedRegistration.distance || 'N/A'}</span>
                      </div>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Shirt Size</span>
                        <span style={{...styles.modalValue, color: '#0A70BA', fontWeight: 'bold'}}>{selectedRegistration.shirtSize || 'N/A'}</span>
                      </div>
                      <div style={styles.modalItem}>
                        <span style={styles.modalLabel}>Fee</span>
                        <span style={{...styles.modalValue, color: '#2A499B', fontWeight: 'bold'}}>₱{selectedRegistration.fee?.toLocaleString() || '0'}.00</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* PAYMENT DETAILS SECTION */}
              <div style={styles.modalSection}>
                <h3 style={styles.modalSectionTitle}>💳 Payment Details</h3>
                <div style={styles.modalGrid}>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Payment Method</span>
                    <span style={styles.modalValue}>{selectedRegistration.paymentMethod?.toUpperCase() || 'N/A'}</span>
                  </div>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Reference Number</span>
                    {isEditing ? (
                      <input
                        type="text"
                        name="referenceNumber"
                        value={editFormData.referenceNumber || ''}
                        onChange={handleEditInputChange}
                        style={styles.editInput}
                        placeholder="Enter reference number"
                      />
                    ) : (
                      <span style={{...styles.modalValue, color: '#0A70BA', fontFamily: 'Courier New, monospace', fontWeight: 'bold'}}>
                        {selectedRegistration.referenceNumber || 'N/A'}
                      </span>
                    )}
                  </div>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Payment Date</span>
                    <span style={styles.modalValue}>{formatDateWithTime(selectedRegistration.paymentDate || selectedRegistration.registeredAt)}</span>
                  </div>
                  <div style={styles.modalItem}>
                    <span style={styles.modalLabel}>Status</span>
                    <span style={{...styles.modalValue, color: '#68B42D', fontWeight: 'bold'}}>✅ Completed</span>
                  </div>
                </div>

                {/* RECEIPT SECTION */}
                <div style={styles.receiptSection}>
                  <div style={styles.receiptDivider}>
                    <span>RECEIPTS</span>
                  </div>
                  
                  <div style={styles.receiptContainer}>
                    {isEditing ? (
                      <>
                        {(() => {
                          let existingReceipts = [];
                          if (selectedRegistration.receiptPreviews && Array.isArray(selectedRegistration.receiptPreviews) && selectedRegistration.receiptPreviews.length > 0) {
                            existingReceipts = selectedRegistration.receiptPreviews;
                          } else if (selectedRegistration.receiptPreview && typeof selectedRegistration.receiptPreview === 'string') {
                            existingReceipts = [selectedRegistration.receiptPreview];
                          }
                          
                          return existingReceipts.length > 0 ? (
                            <div style={styles.receiptGrid}>
                              {existingReceipts.map((img, idx) => (
                                <div 
                                  key={`existing-${idx}`} 
                                  style={styles.receiptPreviewContainer}
                                  onClick={() => handleReceiptClick(img)}
                                >
                                  <img 
                                    src={img} 
                                    alt={`Receipt ${idx + 1}`} 
                                    style={styles.receiptPreviewImage}
                                  />
                                  <div style={styles.receiptClickHint}>🔍 Click to enlarge</div>
                                </div>
                              ))}
                            </div>
                          ) : null;
                        })()}
                        
                        {receiptPreviews.length > 0 && (
                          <div style={styles.receiptGrid}>
                            {receiptPreviews.map((preview, idx) => (
                              <div key={`new-${idx}`} style={styles.receiptPreviewContainer}>
                                <img 
                                  src={preview} 
                                  alt={`New Receipt ${idx + 1}`} 
                                  style={styles.receiptPreviewImage}
                                />
                                <button 
                                  style={styles.receiptRemoveBtn}
                                  onClick={() => handleRemoveNewReceipt(idx)}
                                >
                                  ✕
                                </button>
                                <div style={styles.receiptClickHint}>📄 New</div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div style={styles.fileInputWrapper}>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleReceiptFileSelect}
                            accept="image/*"
                            multiple
                            style={styles.fileInputHidden}
                            id="receipt-upload-dashboard"
                          />
                          <label htmlFor="receipt-upload-dashboard" style={styles.fileInputLabel}>
                            <span style={styles.fileIcon}>📁</span>
                            <span style={styles.fileText}>
                              {receiptFiles.length > 0 
                                ? `${receiptFiles.length} new file(s) selected` 
                                : 'Choose New File'}
                            </span>
                            <span style={styles.fileBrowseBtn}>Browse</span>
                          </label>
                        </div>

                        {receiptFiles.length > 0 && (
                          <div style={styles.uploadSuccessMsg}>
                            <span style={styles.successIcon}>✅</span>
                            <span>{receiptFiles.length} new file(s) ready to save</span>
                          </div>
                        )}

                        <p style={styles.supportedFormats}>
                          Supported formats: JPEG, PNG, GIF (Max 5MB each) - Auto compressed to ~150KB
                        </p>

                        {(() => {
                          let hasExisting = false;
                          if (selectedRegistration.receiptPreviews && Array.isArray(selectedRegistration.receiptPreviews) && selectedRegistration.receiptPreviews.length > 0) {
                            hasExisting = true;
                          } else if (selectedRegistration.receiptPreview && typeof selectedRegistration.receiptPreview === 'string') {
                            hasExisting = true;
                          }
                          
                          return (!hasExisting && receiptFiles.length === 0) ? (
                            <div style={styles.noReceiptText}>No receipts uploaded</div>
                          ) : null;
                        })()}

                        {!isSaveEnabled() && (
                          <div style={styles.saveDisabledMsg}>
                            ⚠️ No changes detected or Upload new payment if Event Details section has updates.
                          </div>
                        )}
                      </>
                    ) : (
                      (() => {
                        let existingReceipts = [];
                        if (selectedRegistration.receiptPreviews && Array.isArray(selectedRegistration.receiptPreviews) && selectedRegistration.receiptPreviews.length > 0) {
                          existingReceipts = selectedRegistration.receiptPreviews;
                        } else if (selectedRegistration.receiptPreview && typeof selectedRegistration.receiptPreview === 'string') {
                          existingReceipts = [selectedRegistration.receiptPreview];
                        }
                        
                        return existingReceipts.length > 0 ? (
                          <div style={styles.receiptGrid}>
                            {existingReceipts.map((img, idx) => (
                              <div 
                                key={`view-${idx}`} 
                                style={styles.receiptPreviewContainer}
                                onClick={() => handleReceiptClick(img)}
                              >
                                <img 
                                  src={img} 
                                  alt={`Receipt ${idx + 1}`} 
                                  style={styles.receiptPreviewImage}
                                />
                                <div style={styles.receiptClickHint}>🔍 Click to enlarge</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={styles.modalValue}>No receipts uploaded</span>
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>

              <div style={styles.waiverToggleSection}>
                <div style={styles.waiverToggleHeader} onClick={toggleWaiver}>
                  <h3 style={styles.waiverToggleTitle}>
                    📄 Terms & Conditions (Waiver)
                  </h3>
                  <span style={{
                    ...styles.waiverToggleArrow,
                    transform: isWaiverOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                
                {isWaiverOpen && (
                  <div style={styles.waiverDisplay}>
                    <div style={styles.waiverDisplayHeader}>
                      <h4 style={styles.waiverDisplayTitle}>WAIVER AND RELEASE OF LIABILITY</h4>
                    </div>
                    <div style={styles.waiverDisplayBody}>
                      <p style={styles.waiverDisplayText}>
                        I hereby certify that I am physically fit and in good health to participate in the Lilo-Wawa Half Marathon. I understand that running is a strenuous physical activity that involves inherent risks, including injury, illness, dehydration, accidents, and other unforeseen circumstances.
                      </p>
                      <p style={styles.waiverDisplayText}>
                        I acknowledge that food and refreshments may be provided during the event and accept full responsibility for any allergies, dietary restrictions, or adverse reactions resulting from their consumption.
                      </p>
                      <p style={styles.waiverDisplayText}>
                        I further understand that the organizers will have standby medical personnel and first-aid assistance available during the event. However, I acknowledge that such assistance does not eliminate all risks associated with participation, and I voluntarily assume full responsibility for my health and safety.
                      </p>
                      <p style={styles.waiverDisplayText}>
                        In consideration of my participation, I hereby release and hold harmless the organizers, sponsors, partners, volunteers, medical personnel, and the Municipality of Liloan from any liability, claims, damages, injuries, losses, or expenses arising from or related to my participation in the event, except in cases of gross negligence or willful misconduct.
                      </p>
                      <p style={styles.waiverDisplayText}>
                        By registering for the Lilo-Wawa Half Marathon, I confirm that I have read, understood, and voluntarily agreed to this waiver and release of liability.
                      </p>

                      <div style={styles.waiverDisplaySignature}>
                        <div style={styles.waiverDisplayField}>
                          <span style={styles.waiverDisplayFieldLabel}>Participant's Name:</span>
                          <span style={styles.waiverDisplayFieldValue}>{selectedRegistration?.userName || '________________________'}</span>
                        </div>
                        <div style={styles.waiverDisplayField}>
                          <span style={styles.waiverDisplayFieldLabel}>Signature:</span>
                          <span style={styles.waiverDisplayFieldValue}>_______________________________</span>
                        </div>
                        <div style={styles.waiverDisplayField}>
                          <span style={styles.waiverDisplayFieldLabel}>Date:</span>
                          <span style={styles.waiverDisplayFieldValue}>{formatDateWithTime(new Date().toISOString())}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div style={styles.waiverToggleTitle1}>
                Note: Please print both the registration form and the waiver before arriving.
              </div>
            </div>

            <div style={styles.modalActions}>
              {isEditing ? (
                <>
                  <button 
                    style={{
                      ...styles.saveEditBtn,
                      opacity: isSaveEnabled() ? 1 : 0.5,
                      cursor: isSaveEnabled() ? 'pointer' : 'not-allowed'
                    }} 
                    onClick={handleSaveEdit}
                    disabled={!isSaveEnabled() || uploadingReceipt}
                  >
                    {uploadingReceipt ? '⏳ Saving...' : '💾 Save Changes'}
                  </button>
                  <button style={styles.cancelEditBtn} onClick={handleCancelEdit}>
                    ❌ Cancel
                  </button>
                </>
              ) : (
                <button style={styles.closeModalBtn} onClick={closeViewModal}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {showReceiptModal && receiptImageUrl && (
        <div style={styles.modalOverlay} onClick={handleCloseReceiptModal}>
          <div style={styles.receiptModalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={handleCloseReceiptModal}>×</button>
            <h2 style={styles.receiptModalTitle}>📷 Receipt Preview</h2>
            <div style={styles.receiptFullContainer}>
              <img 
                src={receiptImageUrl} 
                alt="Receipt Full View" 
                style={styles.receiptFullImage}
              />
            </div>
            <button style={styles.receiptCloseBtn} onClick={handleCloseReceiptModal}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DOWNLOAD MODAL - Shows image preview with download button */}
      {/* ============================================================ */}
      {showDownloadModal && downloadImageUrl && (
        <div style={styles.downloadModalOverlay} onClick={closeDownloadModal}>
          <div style={styles.downloadModalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.downloadModalClose} onClick={closeDownloadModal}>×</button>
            <h3 style={styles.downloadModalTitle}>
              📥 Download {downloadType === 'payment' ? 'Payment' : downloadType === 'waiver' ? 'Waiver' : 'Registration'}
            </h3>
            <p style={styles.downloadModalSubtitle}>Preview your image before downloading</p>
            
            <div style={styles.downloadModalImageContainer}>
              <img src={downloadImageUrl} alt="Download Preview" style={styles.downloadModalImage} />
            </div>
            
            <div style={styles.downloadModalActions}>
              <button style={styles.downloadModalDownloadBtn} onClick={downloadImage}>
                <span style={styles.downloadIcon}>⬇️</span>
                Download Now
              </button>
              <button style={styles.downloadModalCloseBtn} onClick={closeDownloadModal}>
                Cancel
              </button>
            </div>
            
            <p style={styles.downloadModalHint}>
              💡 If download doesn't start automatically, long press the image and select "Save Image"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// STYLES - Keeping all styles
// ============================================================

const colors = {
  yellow: '#EDDB0B',
  green: '#68B42D',
  teal: '#00A8AB',
  blue: '#0A70BA',
  darkBlue: '#2A499B',
};

const styles = {
  dashboard: {
    width: '100%',
    maxWidth: '720px',
    position: 'relative',
    padding: '20px',
    fontFamily: 'Segoe UI, Roboto, sans-serif',
  },
  backgroundEffects: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute',
    top: '-10%',
    right: '-5%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${colors.yellow}30, transparent 70%)`,
    animation: 'floatGlow 8s ease-in-out infinite',
  },
  glow2: {
    position: 'absolute',
    bottom: '-10%',
    left: '-5%',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${colors.teal}30, transparent 70%)`,
    animation: 'floatGlow 10s ease-in-out infinite reverse',
  },
  glow3: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${colors.blue}20, transparent 70%)`,
    animation: 'pulseGlow 6s ease-in-out infinite',
  },
  header: {
    position: 'relative',
    zIndex: 10,
    background: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(20px) saturate(1.2)',
    borderRadius: '24px',
    padding: '24px 32px',
    marginBottom: '28px',
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
    boxShadow: '0 20px 60px rgba(42, 73, 155, 0.30), 0 8px 24px rgba(0, 168, 171, 0.15), inset 0 1px 0 rgba(255,255,255,0.5)',
    border: '1px solid rgba(255,255,255,0.3)',
    transform: 'perspective(1000px) rotateX(1deg)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 700,
    color: 'white',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    transition: 'transform 0.3s ease',
  },
  onlineDot: {
    position: 'absolute',
    bottom: '2px',
    right: '2px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    background: '#68B42D',
    border: '3px solid white',
    boxShadow: '0 2px 8px rgba(104, 180, 45, 0.4)',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  welcomeText: {
    fontSize: '1.4rem',
    fontWeight: 600,
    color: '#2d3748',
    margin: 0,
  },
  waiverToggleTitle1: {
    fontSize: '.9rem',
    fontWeight: 500,
    color: colors.blue,
    margin: 0,
  },
  userName: {
    background: `linear-gradient(135deg, ${colors.darkBlue}, ${colors.blue})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  userEmail: {
    fontSize: '0.9rem',
    color: '#4a5568',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  emailIcon: {
    fontSize: '0.9rem',
  },
  userBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 16px',
    background: `linear-gradient(135deg, ${colors.yellow}30, ${colors.green}30)`,
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: colors.darkBlue,
    marginTop: '4px',
  },
  badgeIcon: {
    fontSize: '0.9rem',
  },
  badgeText: {
    fontSize: '0.8rem',
  },
  logoutBtn: {
    padding: '12px 28px',
    background: `linear-gradient(145deg, #fc8181, #f56565)`,
    color: 'white',
    border: 'none',
    borderRadius: '40px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 6px 20px rgba(245, 101, 101, 0.30)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.95rem',
  },
  logoutIcon: {
    fontSize: '1.1rem',
  },
  content: {
    position: 'relative',
    zIndex: 10,
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '28px',
  },
  historySection: {
    background: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(20px) saturate(1.2)',
    borderRadius: '28px',
    padding: '32px',
    border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 20px 60px rgba(42, 73, 155, 0.25), 0 8px 24px rgba(0, 168, 171, 0.12), inset 0 1px 0 rgba(255,255,255,0.5)',
    transform: 'perspective(1200px) rotateX(1deg)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '2px solid rgba(0, 168, 171, 0.10)',
  },
  historyTitle: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: colors.darkBlue,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: 0,
  },
  historyIcon: {
    fontSize: '1.3rem',
  },
  historyCount: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#4a5568',
    background: 'rgba(10, 112, 186, 0.08)',
    padding: '4px 16px',
    borderRadius: '20px',
  },
  registrationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  registrationCard: {
    background: 'rgba(255, 255, 255, 0.6)',
    borderRadius: '16px',
    padding: '18px 20px',
    border: '1px solid rgba(0, 168, 171, 0.08)',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  cardBadge: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  categoryBadge: {
    padding: '2px 12px',
    borderRadius: '12px',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  statusBadge: {
    padding: '2px 12px',
    borderRadius: '12px',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  cardDate: {
    fontSize: '0.75rem',
    color: '#718096',
  },
  cardBody: {
    marginBottom: '12px',
  },
  eventName: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: colors.darkBlue,
    margin: '0 0 8px 0',
  },
  eventDetails: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  detailTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.8rem',
    color: '#4a5568',
    background: 'rgba(247, 250, 252, 0.8)',
    padding: '2px 12px',
    borderRadius: '12px',
  },
  tagIcon: {
    fontSize: '0.8rem',
  },
  cardFooter: {
    marginTop: '8px',
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  viewBtn: {
    padding: '6px 16px',
    background: `linear-gradient(135deg, ${colors.blue}, ${colors.darkBlue})`,
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(10, 112, 186, 0.25)',
  },
  downloadPaymentBtn: {
    padding: '6px 16px',
    background: `linear-gradient(135deg, ${colors.darkBlue}, ${colors.blue})`,
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(10, 112, 186, 0.25)',
  },
  downloadImageBtn: {
    padding: '6px 16px',
    background: `linear-gradient(135deg, ${colors.teal}, ${colors.blue})`,
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(0, 168, 171, 0.25)',
  },
  downloadWaiverBtn: {
    padding: '6px 16px',
    background: `linear-gradient(135deg, ${colors.yellow}, #f5a623)`,
    color: colors.darkBlue,
    border: 'none',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(237, 219, 11, 0.25)',
  },
  viewIcon: {
    fontSize: '0.8rem',
  },
  imageIcon: {
    fontSize: '0.8rem',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(255,255,255,0.2)',
    borderTop: `4px solid ${colors.yellow}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: 500,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
    animation: 'fadeIn 0.3s ease',
  },
  modalContent: {
    background: 'white',
    borderRadius: '28px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    padding: '32px',
    position: 'relative',
    boxShadow: '0 40px 80px rgba(0,0,0,0.4), 0 0 0 4px rgba(237, 219, 11, 0.3)',
    animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  modalClose: {
    position: 'absolute',
    top: '16px',
    right: '20px',
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: '#4a5568',
    transition: 'all 0.3s ease',
    padding: '4px 12px',
    borderRadius: '8px',
    zIndex: 10,
  },
  modalHeader: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  modalTitle: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: colors.darkBlue,
    margin: 0,
  },
  modalSubtitle: {
    fontSize: '0.95rem',
    color: '#4a5568',
    margin: '4px 0 0 0',
  },
  saveMessage: {
    padding: '10px 16px',
    borderRadius: '8px',
    marginTop: '8px',
    fontWeight: 600,
    textAlign: 'center',
    border: '1px solid',
    fontSize: '0.9rem',
  },
  modalBody: {
    marginBottom: '24px',
  },
  modalSection: {
    marginBottom: '20px',
    padding: '16px',
    background: 'rgba(247, 250, 252, 0.6)',
    borderRadius: '16px',
    border: '1px solid rgba(0, 168, 171, 0.08)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  modalSectionTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: colors.darkBlue,
    margin: 0,
  },
  editBtnSmall: {
    padding: '4px 16px',
    background: `linear-gradient(135deg, ${colors.blue}, ${colors.darkBlue})`,
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(10, 112, 186, 0.25)',
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px 16px',
  },
  modalItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  modalLabel: {
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#718096',
    fontWeight: 600,
  },
  modalValue: {
    fontSize: '0.95rem',
    fontWeight: 500,
    color: '#2d3748',
    wordBreak: 'break-word',
  },
  required: {
    color: '#e53e3e',
  },
  selectWrapper: {
    position: 'relative',
    width: '100%',
  },
  selectArrow: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#4a5568',
    fontSize: '0.8rem',
    pointerEvents: 'none',
    transition: 'all 0.3s ease',
  },
  editInput: {
    padding: '8px 12px',
    border: '2px solid rgba(0, 168, 171, 0.20)',
    borderRadius: '8px',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    background: 'white',
    width: '100%',
    boxSizing: 'border-box',
  },
  editSelect: {
    padding: '8px 36px 8px 12px',
    border: '2px solid rgba(0, 168, 171, 0.20)',
    borderRadius: '8px',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    background: 'white',
    width: '100%',
    boxSizing: 'border-box',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    cursor: 'pointer',
  },
  editTextarea: {
    padding: '8px 12px',
    border: '2px solid rgba(0, 168, 171, 0.20)',
    borderRadius: '8px',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    background: 'white',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  genderEditGroup: {
    display: 'flex',
    gap: '8px',
  },
  genderEditBtn: {
    padding: '6px 14px',
    border: '2px solid',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    flex: 1,
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
    flexWrap: 'wrap',
  },
  closeModalBtn: {
    flex: 1,
    minWidth: '100px',
    padding: '14px 20px',
    background: 'rgba(237, 242, 247, 0.9)',
    color: '#4a5568',
    border: '2px solid #e2e8f0',
    borderRadius: '40px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  saveEditBtn: {
    flex: 1,
    minWidth: '140px',
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #68B42D, #48a71a)',
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
    boxShadow: '0 6px 20px rgba(104, 180, 45, 0.30)',
  },
  cancelEditBtn: {
    flex: 0.5,
    minWidth: '100px',
    padding: '14px 20px',
    background: 'rgba(237, 242, 247, 0.9)',
    color: '#4a5568',
    border: '2px solid #e2e8f0',
    borderRadius: '40px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  waiverToggleSection: {
    marginTop: '20px',
    padding: '16px',
    background: 'rgba(247, 250, 252, 0.6)',
    borderRadius: '16px',
    border: '1px solid rgba(0, 168, 171, 0.08)',
  },
  waiverToggleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '4px 0',
    userSelect: 'none',
    transition: 'all 0.3s ease',
  },
  waiverToggleTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: colors.darkBlue,
    margin: 0,
  },
  waiverToggleArrow: {
    fontSize: '1.2rem',
    color: colors.blue,
    transition: 'transform 0.3s ease',
  },
  waiverDisplay: {
    marginTop: '16px',
    padding: '16px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid rgba(237, 219, 11, 0.2)',
    animation: 'slideDown 0.3s ease',
  },
  waiverDisplayHeader: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  waiverDisplayTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: colors.darkBlue,
    margin: 0,
  },
  waiverDisplayBody: {
    maxHeight: '400px',
    overflow: 'auto',
    paddingRight: '8px',
  },
  waiverDisplayText: {
    fontSize: '0.9rem',
    lineHeight: '1.8',
    color: '#4a5568',
    marginBottom: '12px',
    textAlign: 'justify',
  },
  waiverDisplaySignature: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0',
  },
  waiverDisplayField: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '6px 0',
    flexWrap: 'wrap',
  },
  waiverDisplayFieldLabel: {
    fontWeight: 600,
    color: '#4a5568',
    fontSize: '0.9rem',
    minWidth: '140px',
  },
  waiverDisplayFieldValue: {
    color: '#2d3748',
    fontSize: '0.9rem',
    borderBottom: '1px dashed #cbd5e0',
    padding: '2px 8px',
    flex: 1,
    minWidth: '150px',
  },
  captureContent: {
    position: 'absolute',
    left: '-9999px',
    top: 0,
    width: '550px',
    maxWidth: '550px',
    background: 'white',
    fontFamily: 'Segoe UI, Arial, Helvetica, sans-serif',
    padding: 0,
    boxSizing: 'border-box',
  },
  captureInner: {
    padding: '30px 35px 25px',
    width: '100%',
    boxSizing: 'border-box',
    background: 'white',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
  },
  captureHeader: {
    textAlign: 'center',
    marginBottom: '18px',
  },
  captureHeaderH1: {
    fontSize: '22px',
    color: '#2A499B',
    margin: '0 0 4px 0',
    fontWeight: 700,
  },
  captureHeaderH2: {
    fontSize: '16px',
    color: '#0A70BA',
    margin: '0 0 8px 0',
    fontWeight: 500,
  },
  captureDivider: {
    borderTop: '2px solid #EDDB0B',
    margin: '10px 0',
    width: '100%',
  },
  captureSection: {
    marginBottom: '10px',
  },
  captureSectionTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#2A499B',
    margin: '0 0 6px 0',
  },
  captureRow: {
    display: 'flex',
    padding: '5px 0',
    borderBottom: '1px solid #f0f0f0',
    alignItems: 'center',
  },
  captureLabel: {
    flex: '0 0 140px',
    fontWeight: 600,
    color: '#4a5568',
    fontSize: '13px',
    letterSpacing: '0.3px',
  },
  captureValue: {
    flex: 1,
    color: '#2d3748',
    fontSize: '13px',
    fontWeight: 500,
    wordBreak: 'break-word',
  },
  captureFooter: {
    textAlign: 'center',
    marginTop: '18px',
    paddingTop: '12px',
    borderTop: '2px solid #EDDB0B',
  },
  captureFooterSmall: {
    fontSize: '11px',
    color: '#a0aec0',
    fontWeight: 400,
  },
  waiverCaptureContent: {
    position: 'absolute',
    left: '-9999px',
    top: 0,
    width: '550px',
    maxWidth: '550px',
    background: 'white',
    fontFamily: 'Segoe UI, Arial, Helvetica, sans-serif',
    padding: 0,
    boxSizing: 'border-box',
  },
  waiverCaptureInner: {
    padding: '35px 35px 25px',
    width: '100%',
    boxSizing: 'border-box',
    background: 'white',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
  },
  waiverCaptureHeader: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  waiverCaptureTitle: {
    fontSize: '22px',
    color: '#2A499B',
    margin: '0 0 4px 0',
    fontWeight: 700,
  },
  waiverCaptureSubtitle: {
    fontSize: '17px',
    color: '#0A70BA',
    margin: '0 0 8px 0',
    fontWeight: 600,
  },
  waiverCaptureBody: {
    margin: '12px 0',
    flex: 1,
  },
  waiverCaptureText: {
    fontSize: '13px',
    lineHeight: '1.8',
    color: '#2d3748',
    marginBottom: '14px',
    textAlign: 'justify',
  },
  waiverCaptureSignature: {
    marginTop: '20px',
    paddingTop: '14px',
    borderTop: '2px solid #EDDB0B',
  },
  waiverCaptureField: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '6px 0',
  },
  waiverCaptureFieldLabel: {
    fontWeight: 600,
    color: '#4a5568',
    fontSize: '13px',
    minWidth: '150px',
  },
  waiverCaptureFieldValue: {
    color: '#2d3748',
    fontSize: '13px',
    borderBottom: '1px solid #cbd5e0',
    padding: '2px 8px',
    flex: 1,
  },
  waiverCaptureFooter: {
    textAlign: 'center',
    marginTop: '18px',
    paddingTop: '12px',
    borderTop: '2px solid #EDDB0B',
  },
  waiverCaptureFooterText: {
    fontSize: '12px',
    color: '#a0aec0',
  },
  receiptSection: {
    marginTop: '12px',
    fontWeight: 600,
    color: '#4a5568',
    fontSize: '20px',
    minWidth: '150px',
  },
  receiptDivider: {
    display: 'flex',
    alignItems: 'center',
    margin: '16px 0 12px 0',
  },
  receiptContainer: {
    background: 'rgba(247, 250, 252, 0.5)',
    borderRadius: '12px',
    padding: '16px',
    border: '2px dashed rgba(0, 168, 171, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'center',
  },
  receiptGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '12px',
    width: '100%',
  },
  receiptPreviewContainer: {
    cursor: 'pointer',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    padding: '8px',
    transition: 'all 0.3s ease',
    background: '#f7fafc',
    position: 'relative',
  },
  receiptPreviewImage: {
    width: '100%',
    height: 'auto',
    maxHeight: '100px',
    objectFit: 'contain',
    borderRadius: '8px',
  },
  receiptClickHint: {
    textAlign: 'center',
    fontSize: '0.6rem',
    color: '#718096',
    marginTop: '4px',
    fontWeight: 500,
  },
  receiptRemoveBtn: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#fc8181',
    color: 'white',
    border: 'none',
    fontSize: '0.7rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  fileInputWrapper: {
    width: '100%',
    marginBottom: '4px',
  },
  fileInputHidden: {
    position: 'absolute',
    width: '0.1px',
    height: '0.1px',
    opacity: 0,
    overflow: 'hidden',
    zIndex: -1,
  },
  fileInputLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
  },
  fileIcon: {
    fontSize: '1.2rem',
    marginRight: '8px',
  },
  fileText: {
    flex: 1,
    color: '#4a5568',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '0.85rem',
  },
  fileBrowseBtn: {
    padding: '4px 14px',
    background: 'linear-gradient(135deg, #0A70BA, #2A499B)',
    color: 'white',
    borderRadius: '20px',
    fontWeight: 600,
    fontSize: '0.75rem',
    transition: 'all 0.3s ease',
  },
  uploadSuccessMsg: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'rgba(104, 180, 45, 0.10)',
    borderRadius: '8px',
    color: '#276749',
    fontWeight: 600,
    width: '100%',
    border: '1px solid rgba(104, 180, 45, 0.20)',
    fontSize: '0.9rem',
  },
  successIcon: {
    fontSize: '1.1rem',
  },
  supportedFormats: {
    fontSize: '0.7rem',
    color: '#a0aec0',
    textAlign: 'center',
    margin: '4px 0 0 0',
  },
  noReceiptText: {
    fontSize: '0.9rem',
    color: '#a0aec0',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '8px 0',
  },
  saveDisabledMsg: {
    fontSize: '0.8rem',
    color: '#e53e3e',
    textAlign: 'center',
    padding: '8px 12px',
    background: 'rgba(254, 215, 215, 0.6)',
    borderRadius: '8px',
    border: '1px solid #fc8181',
    fontWeight: 500,
    width: '100%',
  },
  receiptModalContent: {
    background: 'white',
    borderRadius: '28px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    padding: '32px',
    position: 'relative',
    boxShadow: '0 40px 80px rgba(0,0,0,0.4), 0 0 0 4px rgba(237, 219, 11, 0.3)',
    animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  receiptModalTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: colors.darkBlue,
    margin: '0 0 16px 0',
    textAlign: 'center',
  },
  receiptFullContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px 0',
  },
  receiptFullImage: {
    maxWidth: '100%',
    maxHeight: '70vh',
    objectFit: 'contain',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
  },
  receiptCloseBtn: {
    width: '100%',
    padding: '14px',
    background: 'rgba(237, 242, 247, 0.9)',
    color: '#4a5568',
    border: '2px solid #e2e8f0',
    borderRadius: '40px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '16px',
  },
  downloadModalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '20px',
    animation: 'fadeIn 0.3s ease',
  },
  downloadModalContent: {
    background: 'white',
    borderRadius: '28px',
    maxWidth: '520px',
    width: '100%',
    maxHeight: '90vh',
    padding: '32px 28px',
    position: 'relative',
    boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
    animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    overflowY: 'auto',
  },
  downloadModalClose: {
    position: 'absolute',
    top: '12px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: '#4a5568',
    transition: 'all 0.3s ease',
    padding: '4px 12px',
    borderRadius: '8px',
    zIndex: 10,
  },
  downloadModalTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#2A499B',
    margin: '0 0 4px 0',
    textAlign: 'center',
  },
  downloadModalSubtitle: {
    fontSize: '0.9rem',
    color: '#718096',
    textAlign: 'center',
    margin: '0 0 16px 0',
  },
  downloadModalImageContainer: {
    background: '#f7fafc',
    borderRadius: '16px',
    padding: '12px',
    marginBottom: '16px',
    border: '2px solid #e2e8f0',
    maxHeight: '400px',
    overflow: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadModalImage: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  downloadModalActions: {
    display: 'flex',
    gap: '12px',
  },
  downloadModalDownloadBtn: {
    flex: 2,
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #68B42D, #48a71a)',
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
    boxShadow: '0 6px 20px rgba(104, 180, 45, 0.30)',
  },
  downloadIcon: {
    fontSize: '1.2rem',
  },
  downloadModalCloseBtn: {
    flex: 1,
    padding: '14px 20px',
    background: 'rgba(237, 242, 247, 0.9)',
    color: '#4a5568',
    border: '2px solid #e2e8f0',
    borderRadius: '40px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  downloadModalHint: {
    fontSize: '0.75rem',
    color: '#a0aec0',
    textAlign: 'center',
    margin: '12px 0 0 0',
    padding: '8px',
    background: '#f7fafc',
    borderRadius: '8px',
  },
};

// CSS KEYFRAMES and additional styles
const styleSheet2 = document.createElement('style');
styleSheet2.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: scale(0.8) translateY(30px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
      max-height: 0;
    }
    to {
      opacity: 1;
      transform: translateY(0);
      max-height: 600px;
    }
  }

  @keyframes floatGlow {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(-20px, 20px) scale(1.1); }
  }

  @keyframes pulseGlow {
    0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
  }

  .spinner-small {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s ease-in-out infinite;
  }

  .view-btn:hover {
    transform: scale(1.05) !important;
    box-shadow: 0 6px 20px rgba(10, 112, 186, 0.4) !important;
  }

  .modal-close:hover {
    background: rgba(0,0,0,0.05) !important;
    transform: rotate(90deg) !important;
  }

  .waiver-toggle-header:hover {
    background: rgba(10, 112, 186, 0.05) !important;
    border-radius: 8px !important;
    padding: 4px 8px !important;
    margin: -4px -8px !important;
  }

  .edit-btn-small:hover {
    transform: scale(1.05) !important;
    box-shadow: 0 6px 20px rgba(10, 112, 186, 0.35) !important;
  }

  .save-edit-btn:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.02) !important;
    box-shadow: 0 10px 30px rgba(104, 180, 45, 0.45) !important;
  }

  .cancel-edit-btn:hover {
    background: #e2e8f0 !important;
    transform: translateY(-2px) !important;
  }

  .gender-edit-btn:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(10, 112, 186, 0.12) !important;
  }

  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: #0A70BA !important;
    box-shadow: 0 0 0 3px rgba(10, 112, 186, 0.12) !important;
    background: white !important;
  }

  .receipt-preview-container:hover {
    border-color: #0A70BA !important;
    box-shadow: 0 4px 16px rgba(10, 112, 186, 0.15) !important;
    transform: scale(1.02) !important;
  }

  .select-wrapper:hover .select-arrow {
    color: #0A70BA !important;
  }

  @media (max-width: 768px) {
    .modal-content {
      padding: 24px 16px !important;
      max-height: 95vh !important;
    }

    .modal-grid {
      grid-template-columns: 1fr !important;
    }

    .modal-actions {
      flex-direction: column !important;
    }

    .close-modal-btn {
      width: 100% !important;
      padding: 12px !important;
    }

    .header-content {
      flex-direction: column;
      align-items: stretch !important;
    }

    .user-section {
      flex-direction: column;
      align-items: center !important;
      text-align: center;
    }

    .user-info {
      align-items: center !important;
    }

    .logout-btn {
      width: 100%;
      justify-content: center;
    }

    .registrations-grid {
      grid-template-columns: 1fr !important;
    }

    .history-section {
      padding: 20px !important;
    }

    .header {
      padding: 20px !important;
    }

    .welcome-text {
      font-size: 1.1rem !important;
    }

    .card-actions {
      flex-direction: column !important;
      align-items: stretch !important;
    }

    .view-btn {
      justify-content: center !important;
    }

    .waiver-display-field {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 4px !important;
    }

    .waiver-display-field-value {
      width: 100% !important;
    }

    .gender-edit-group {
      flex-direction: column !important;
    }

    .section-header {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 8px !important;
    }

    .receipt-modal-content {
      padding: 20px 12px !important;
    }

    .receipt-preview-container {
      max-width: 100% !important;
    }

    .receipt-full-image {
      max-height: 50vh !important;
    }

    .file-input-label {
      font-size: 0.8rem !important;
      padding: 8px 12px !important;
    }

    .file-text {
      font-size: 0.75rem !important;
    }

    .receipt-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)) !important;
    }

    .download-modal-content {
      padding: 24px 16px !important;
      margin: 8px !important;
      border-radius: 20px !important;
    }

    .download-modal-actions {
      flex-direction: column !important;
    }

    .download-modal-download-btn,
    .download-modal-close-btn {
      width: 100% !important;
    }

    .download-modal-title {
      font-size: 1.2rem !important;
    }
  }

  @media (max-width: 480px) {
    .dashboard {
      padding: 12px !important;
    }

    .card-header {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 8px;
    }

    .history-header {
      flex-direction: column;
      gap: 8px;
      align-items: flex-start !important;
    }

    .modal-content {
      padding: 20px 12px !important;
      border-radius: 20px !important;
    }

    .modal-title {
      font-size: 1.3rem !important;
    }

    .waiver-toggle-title {
      font-size: 0.9rem !important;
    }

    .waiver-display-text {
      font-size: 0.8rem !important;
    }

    .waiver-display-field-label {
      min-width: 100px !important;
      font-size: 0.8rem !important;
    }

    .receipt-modal-title {
      font-size: 1.2rem !important;
    }

    .receipt-full-container {
      padding: 8px 0 !important;
    }

    .receipt-grid {
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)) !important;
    }

    .download-modal-content {
      padding: 20px 12px !important;
      border-radius: 20px !important;
    }

    .download-modal-title {
      font-size: 1.1rem !important;
    }

    .download-modal-image-container {
      max-height: 300px !important;
    }
  }
`;
document.head.appendChild(styleSheet2);

export default Dashboard;