import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Import your images (adjust paths as needed)
import logoImg from '../assets/logo_resized_200x200.png';
import sealImg from '../assets/9520a761-89a7-44cc-a36f-d9adcc6aa175.jpg';
import sealImg1 from '../assets/206thFA Theme copy.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, getUserData } = useAuth();
  const navigate = useNavigate();

  // Handle email/password login - NO VERIFICATION CHECK
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      // If user doesn't exist in Firestore, create them
      if (!userSnap.exists()) {
        const newUserData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || email.split('@')[0],
          isAdmin: false,
          createdAt: new Date().toISOString(),
          registrations: [],
          authProvider: 'email',
          emailVerified: user.emailVerified || false
        };
        await setDoc(userRef, newUserData);
        console.log('✅ New user created in Firestore:', user.email);
      }

      // Get user data and navigate (NO EMAIL VERIFICATION CHECK)
      const userData = await getUserData(user.uid);
      if (userData?.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setError('Wrong username or password');
      console.error(error);
    }
    setLoading(false);
  };

  // Handle Google Sign-In with automatic Firestore user creation
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore, if not, create them
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create new user document in Firestore
        const newUserData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Google User',
          photoURL: user.photoURL || '',
          isAdmin: false,
          createdAt: new Date().toISOString(),
          registrations: [],
          authProvider: 'google',
          emailVerified: user.emailVerified || true
        };

        await setDoc(userRef, newUserData);
        console.log('✅ New Google user created in Firestore:', user.email);
      } else {
        // User exists, update their display name if changed
        const existingData = userSnap.data();
        if (existingData.displayName !== user.displayName) {
          await setDoc(userRef, { 
            displayName: user.displayName || existingData.displayName,
            photoURL: user.photoURL || existingData.photoURL,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }

      // Get user data and navigate
      const userData = await getUserData(user.uid);
      if (userData?.isAdmin) {
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
        {/* Images at the top */}
        <div style={styles.imageRow}>
          <img src={logoImg} alt="Logo" style={styles.img} />
          <img src={sealImg} alt="Seal" style={styles.img} />
          <img src={sealImg1} alt="Seal" style={styles.img} />
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
          Don't have an account? <Link to="/register" style={styles.link}>Register</Link>
        </p>
      </div>
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
    gap: '20px',
    marginBottom: '20px',
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
  divider: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    margin: '4px 0',
  },
  dividerText: {
    padding: '0 12px',
    color: '#a0aec0',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  googleButton: {
    padding: '14px 20px',
    borderRadius: '40px',
    border: `2px solid ${colors.darkBlue}30`,
    background: 'white',
    color: '#4a5568',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  googleIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, #4285F4, #EA4335)`,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '14px',
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
  verifyInfo: {
    textAlign: 'center',
    marginTop: '12px',
    fontSize: '0.8rem',
    color: '#68B42D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    background: 'rgba(104, 180, 45, 0.08)',
    padding: '8px 12px',
    borderRadius: '20px',
  },
  verifyIcon: {
    fontSize: '0.9rem',
  },
};

// Add hover effects via CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  input:focus {
    border-color: #0A70BA !important;
    box-shadow: 0 0 0 3px rgba(10,112,186,0.2), inset 0 2px 6px rgba(0,0,0,0.05) !important;
    background-color: white !important;
  }
  button:hover {
    transform: scale(1.02) translateY(-2px) !important;
  }
  button:active {
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
  .google-btn:hover {
    border-color: #0A70BA !important;
    box-shadow: 0 4px 16px rgba(10,112,186,0.15) !important;
  }
`;
document.head.appendChild(styleSheet);

export default Login;