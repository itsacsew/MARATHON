import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword  // ✅ IMPORTANT
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Import your images (adjust paths as needed)
import logoImg from '../assets/logo_resized_200x200.png';
import sealImg from '../assets/9520a761-89a7-44cc-a36f-d9adcc6aa175.jpg';
import sealImg1 from '../assets/206thFA Theme copy.png';

// Import guide images (0.jpg to 10.jpg)
import guide0 from '../assets/guide/0.jpg';
import guide1 from '../assets/guide/1.jpg';
import guide2 from '../assets/guide/2.jpg';
import guide3 from '../assets/guide/3.jpg';
import guide4 from '../assets/guide/4.jpg';
import guide5 from '../assets/guide/5.jpg';
import guide6 from '../assets/guide/6.jpg';
import guide7 from '../assets/guide/7.jpg';
import guide8 from '../assets/guide/8.jpg';
import guide9 from '../assets/guide/9.jpg';
import guide10 from '../assets/guide/10.jpg';

// HARD CODED SUPER ADMIN CREDENTIALS
const SUPER_ADMIN_EMAIL = 'superadmin@gmail.com';
const SUPER_ADMIN_PASSWORD = 'SuperAdmin123';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { login, getUserData } = useAuth();
  const navigate = useNavigate();

  // Guide steps data
  const guideSteps = [
    { image: guide0, title: "LILO-WAWA HALF MARATHON Registration Guide", description: "Welcome to the registration guide! Follow the steps below to register successfully." },
    { image: guide1, title: "Step 1: Registration Guide", description: "LILO-WAWA HALF MARATHON Registration Guide" },
    { image: guide2, title: "Step 2: Login Page", description: "1. Click the registration link using Google Chrome. 2. On the login page, click Register." },
    { image: guide3, title: "Step 3: Create Account", description: "Fill out all the required information to create your account, then click Register." },
    { image: guide4, title: "Step 4: Personal Information", description: "Complete all the required personal information. Then click Proceed to Category Selection." },
    { image: guide5, title: "Step 5: Select Category", description: "Select your preferred race category." },
    { image: guide6, title: "Step 6: Race Preferences", description: "Choose your T-shirt size, check the box indicating 'I agree to the Liability Waiver and Agreement,' then click Proceed." },
    { image: guide7, title: "Step 7: Payment", description: "Pay the registration fee using your preferred payment method by scanning the provided QR code. Take a screenshot of your payment confirmation or save the digital receipt." },
    { image: guide8, title: "Step 8: Upload Proof", description: "Enter the reference number in the designated field, then click Browse to upload your proof of payment or saved receipt." },
    { image: guide9, title: "Step 9: Submit Registration", description: "Click Submit. A registration confirmation will appear on your screen." },
    { image: guide10, title: "Step 10: Save Registration Form", description: "Download and save your Registration Form, print it, affix your signature, and bring the signed copy with you on the day of the event." },
  ];

  const nextStep = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const closeModal = () => {
    setShowHelpModal(false);
    setCurrentStep(0);
  };

  // ✅ FIXED: Handle email/password login with Super Admin auto-creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ✅ CHECK FOR SUPER ADMIN FIRST
      if (email.trim() === SUPER_ADMIN_EMAIL && password.trim() === SUPER_ADMIN_PASSWORD) {
        console.log('🔐 Super Admin login detected...');
        
        try {
          // Try to sign in first
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
          // Ensure super admin exists in Firestore
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              displayName: 'Super Admin',
              isAdmin: true,
              isSuperAdmin: true,
              createdAt: new Date().toISOString(),
              registrations: []
            });
            console.log('✅ Super Admin created in Firestore');
          } else {
            const data = userSnap.data();
            if (!data.isSuperAdmin) {
              await setDoc(userRef, {
                isAdmin: true,
                isSuperAdmin: true
              }, { merge: true });
              console.log('✅ User updated to Super Admin');
            }
          }

          const userData = await getUserData(user.uid);
          if (userData?.isSuperAdmin) {
            navigate('/super-admin');
          } else {
            navigate('/dashboard');
          }
          setLoading(false);
          return;
          
        } catch (signInError) {
          // ✅ If user doesn't exist in Firebase Auth, CREATE THEM
          if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
            console.log('🆕 Super Admin not found, creating account...');
            
            try {
              // Create the super admin account
              const userCredential = await createUserWithEmailAndPassword(auth, email, password);
              const user = userCredential.user;
              
              // Create Firestore document
              await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: 'Super Admin',
                isAdmin: true,
                isSuperAdmin: true,
                createdAt: new Date().toISOString(),
                registrations: []
              });
              
              console.log('✅ Super Admin account created successfully!');
              
              const userData = await getUserData(user.uid);
              if (userData?.isSuperAdmin) {
                navigate('/super-admin');
              } else {
                navigate('/dashboard');
              }
              setLoading(false);
              return;
              
            } catch (createError) {
              console.error('❌ Error creating Super Admin:', createError);
              setError('Failed to create Super Admin account: ' + createError.message);
              setLoading(false);
              return;
            }
          }
          
          // Other error
          throw signInError;
        }
      }

      // ✅ REGULAR USER LOGIN
      console.log('👤 Regular user login...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newUserData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || email.split('@')[0],
          isAdmin: false,
          isSuperAdmin: false,
          createdAt: new Date().toISOString(),
          registrations: [],
          authProvider: 'email',
          emailVerified: user.emailVerified || false
        };
        await setDoc(userRef, newUserData);
        console.log('✅ New user created in Firestore:', user.email);
      }

      const userData = await getUserData(user.uid);
      if (userData?.isSuperAdmin) {
        navigate('/super-admin');
      } else if (userData?.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
      
    } catch (error) {
      console.error('❌ Login error:', error);
      setError('Wrong username or password');
    }
    setLoading(false);
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newUserData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Google User',
          photoURL: user.photoURL || '',
          isAdmin: false,
          isSuperAdmin: false,
          createdAt: new Date().toISOString(),
          registrations: [],
          authProvider: 'google',
          emailVerified: user.emailVerified || true
        };

        await setDoc(userRef, newUserData);
        console.log('✅ New Google user created in Firestore:', user.email);
      } else {
        const existingData = userSnap.data();
        if (existingData.displayName !== user.displayName) {
          await setDoc(userRef, { 
            displayName: user.displayName || existingData.displayName,
            photoURL: user.photoURL || existingData.photoURL,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }

      const userData = await getUserData(user.uid);
      if (userData?.isSuperAdmin) {
        navigate('/super-admin');
      } else if (userData?.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setError('Failed to sign in with Google: ' + error.message);
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Images at the top with Help icon beside the right image */}
        <div style={styles.imageRow}>
          <img src={logoImg} alt="Logo" style={styles.img} />
          <img src={sealImg} alt="Seal" style={styles.img} />
          <div style={styles.imageWithHelp}>
            <img src={sealImg1} alt="Seal" style={styles.img} />
            <button 
              style={styles.helpIcon}
              onClick={() => setShowHelpModal(true)}
              title="Registration Guide"
            >
              ?
            </button>
          </div>
        </div>

        <h2 style={styles.heading}>Login</h2>

        {/* Error Message */}
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>


        <p style={styles.linkText}>
          Don't have an account? <Link to="/register" style={styles.link}>Sign Up</Link>
        </p>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>📋 Registration Guide</h3>
              <button style={styles.modalClose} onClick={closeModal}>✕</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.stepIndicator}>
                <span style={styles.stepNumber}>Step {currentStep + 1} of {guideSteps.length}</span>
                <div style={styles.progressBar}>
                  <div 
                    style={{
                      ...styles.progressFill,
                      width: `${((currentStep + 1) / guideSteps.length) * 100}%`
                    }}
                  />
                </div>
              </div>

              <div style={styles.stepImageContainer}>
                <img 
                  src={guideSteps[currentStep].image} 
                  alt={guideSteps[currentStep].title}
                  style={styles.stepImage}
                />
              </div>

              <div style={styles.stepInfo}>
                <h4 style={styles.stepTitle}>{guideSteps[currentStep].title}</h4>
                <p style={styles.stepDescription}>{guideSteps[currentStep].description}</p>
              </div>

              <div style={styles.modalNav}>
                <button 
                  onClick={prevStep} 
                  disabled={currentStep === 0}
                  style={{
                    ...styles.navButton,
                    ...(currentStep === 0 ? styles.navButtonDisabled : {})
                  }}
                >
                  ← Previous
                </button>
                <button 
                  onClick={nextStep} 
                  disabled={currentStep === guideSteps.length - 1}
                  style={{
                    ...styles.navButton,
                    ...(currentStep === guideSteps.length - 1 ? styles.navButtonDisabled : {})
                  }}
                >
                  Next →
                </button>
              </div>

              <button style={styles.modalCloseBottom} onClick={closeModal}>
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------- Professional 3D-ish design with your color palette --------
const colors = {
  yellow: '#EDDB0B',
  green: '#68B42D',
  teal: '#00A8AB',
  blue: '#0A70BA',
  darkBlue: '#2A499B',
};

const styles = {
  container: {
    minHeight: '90vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: 'Segoe UI, Roboto, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    borderRadius: '40px 12px 40px 12px',
    padding: '32px 28px',
    boxShadow: `
      0 20px 40px rgba(42, 73, 155, 0.3),
      0 8px 16px rgba(0, 168, 171, 0.2),
      0 0 0 1px rgba(237, 219, 11, 0.15),
      0 0 0 3px rgba(104, 180, 45, 0.1)
    `,
    transform: 'perspective(800px) rotateX(2deg) rotateY(-1deg)',
    transition: 'transform 0.2s ease, box-shadow 0.3s ease',
    border: '1px solid rgba(255,255,255,0.3)',
  },
  imageRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '20px',
    marginBottom: '20px',
    position: 'relative',
  },
  imageWithHelp: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '6px',
    position: 'relative',
  },
  img: {
    width: '70px',
    height: '70px',
    objectFit: 'contain',
    borderRadius: '16px',
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: '6px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    border: `2px solid ${colors.yellow}`,
  },
  helpIcon: {
    background: `linear-gradient(135deg, ${colors.darkBlue}, ${colors.blue})`,
    color: 'white',
    border: `2px solid ${colors.yellow}`,
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(42, 73, 155, 0.3)',
    transition: 'all 0.2s ease',
    padding: 0,
    lineHeight: 1,
    flexShrink: 0,
    marginTop: '-6px',
  },
  heading: {
    textAlign: 'center',
    fontSize: '2rem',
    fontWeight: 700,
    marginBottom: '24px',
    background: `linear-gradient(135deg, ${colors.darkBlue}, ${colors.blue})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 2px 10px rgba(10, 112, 186, 0.2)',
    letterSpacing: '-0.5px',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '12px 16px',
    borderRadius: '30px',
    marginBottom: '20px',
    fontSize: '0.95rem',
    borderLeft: `6px solid ${colors.yellow}`,
    fontWeight: 500,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontWeight: 600,
    fontSize: '0.9rem',
    color: colors.darkBlue,
    letterSpacing: '0.3px',
    marginLeft: '4px',
  },
  input: {
    padding: '14px 18px',
    borderRadius: '30px',
    border: `2px solid ${colors.teal}40`,
    backgroundColor: 'rgba(255,255,255,0.7)',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
  },
  button: {
    padding: '14px 20px',
    borderRadius: '40px',
    border: 'none',
    background: `linear-gradient(135deg, ${colors.green}, ${colors.teal})`,
    color: '#fff',
    fontWeight: 700,
    fontSize: '1.1rem',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    boxShadow: `0 8px 20px ${colors.teal}50, 0 0 0 2px ${colors.yellow}30`,
    transition: 'all 0.2s ease',
    marginTop: '8px',
  },
  googleButton: {
    width: '100%',
    padding: '14px 20px',
    borderRadius: '40px',
    border: `2px solid ${colors.darkBlue}40`,
    background: 'white',
    color: colors.darkBlue,
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    textAlign: 'center',
    marginTop: '22px',
    fontSize: '0.95rem',
    color: colors.darkBlue,
  },
  link: {
    color: colors.blue,
    fontWeight: 700,
    textDecoration: 'none',
    borderBottom: `2px solid ${colors.yellow}`,
    paddingBottom: '2px',
    transition: 'color 0.2s',
  },

  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
    animation: 'fadeIn 0.3s ease',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '24px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: `0 30px 60px rgba(42, 73, 155, 0.4), 0 0 0 3px ${colors.yellow}`,
    animation: 'slideUp 0.3s ease',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: colors.darkBlue,
    color: '#fff',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.2rem',
    fontWeight: 700,
  },
  modalClose: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: '#fff',
    fontSize: '1.5rem',
    cursor: 'pointer',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  modalBody: {
    padding: '24px',
    overflowY: 'auto',
    maxHeight: 'calc(90vh - 80px)',
  },
  stepIndicator: {
    marginBottom: '16px',
  },
  stepNumber: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: colors.darkBlue,
    display: 'block',
    marginBottom: '6px',
  },
  progressBar: {
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: `linear-gradient(90deg, ${colors.green}, ${colors.teal})`,
    borderRadius: '10px',
    transition: 'width 0.3s ease',
  },
  stepImageContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '16px',
    border: `2px solid ${colors.yellow}40`,
  },
  stepImage: {
    width: '100%',
    height: 'auto',
    maxHeight: '350px',
    objectFit: 'contain',
    display: 'block',
  },
  stepInfo: {
    marginBottom: '20px',
  },
  stepTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: colors.darkBlue,
    margin: '0 0 8px 0',
  },
  stepDescription: {
    fontSize: '0.95rem',
    color: '#4a5568',
    margin: 0,
    lineHeight: '1.6',
  },
  modalNav: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
  },
  navButton: {
    padding: '10px 20px',
    borderRadius: '30px',
    border: `2px solid ${colors.blue}`,
    backgroundColor: '#fff',
    color: colors.blue,
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flex: 1,
  },
  navButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    borderColor: '#ccc',
    color: '#999',
  },
  modalCloseBottom: {
    width: '100%',
    marginTop: '16px',
    padding: '12px',
    borderRadius: '30px',
    border: 'none',
    background: `linear-gradient(135deg, ${colors.green}, ${colors.teal})`,
    color: '#fff',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: `0 4px 12px ${colors.teal}40`,
  },
};

// Add CSS animations and hover effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  input:focus {
    border-color: #0A70BA !important;
    box-shadow: 0 0 0 3px rgba(10,112,186,0.2), inset 0 2px 6px rgba(0,0,0,0.05) !important;
    background-color: white !important;
  }
  
  button:hover:not(:disabled) {
    transform: scale(1.02) translateY(-2px) !important;
  }
  button:active:not(:disabled) {
    transform: scale(0.98) !important;
  }
  button:disabled {
    opacity: 0.7;
    transform: scale(0.98);
    cursor: not-allowed;
  }
  
  .auth-link a:hover {
    color: #2A499B !important;
    border-bottom-color: #68B42D !important;
  }
  
  .auth-card:hover {
    transform: perspective(800px) rotateX(0deg) rotateY(0deg) translateY(-6px) !important;
    box-shadow: 0 30px 60px rgba(42,73,155,0.4), 0 0 0 2px #EDDB0B, 0 0 0 4px rgba(104,180,45,0.2) !important;
  }
  
  .submit-btn:hover {
    box-shadow: 0 12px 28px rgba(0,168,171,0.5), 0 0 0 2px #EDDB0B !important;
  }
  
  .help-icon:hover {
    transform: scale(1.15) !important;
    box-shadow: 0 6px 20px rgba(42,73,155,0.5), 0 0 0 3px ${colors.yellow} !important;
  }
  
  .modal-close:hover {
    background: rgba(255,255,255,0.3) !important;
  }
  
  .nav-btn:hover:not(:disabled) {
    background: ${colors.blue} !important;
    color: #fff !important;
  }
  
  .modal-close-bottom:hover {
    transform: scale(1.02) !important;
    box-shadow: 0 8px 20px rgba(0,168,171,0.5) !important;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { transform: translateY(30px) scale(0.95); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
  }
`;
document.head.appendChild(styleSheet);

export default Login;