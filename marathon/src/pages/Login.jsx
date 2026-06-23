import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

// Import your images (adjust paths as needed)
import logoImg from '../assets/logo_resized_200x200.png'; // or logo_resized_200x200.png
import sealImg from '../assets/9520a761-89a7-44cc-a36f-d9adcc6aa175.jpg';
import sealImg1 from '../assets/206thFA Theme copy.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, getUserData } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const user = await login(email, password);
      const userData = await getUserData(user.uid);
      if (userData?.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setError('Failed to login: ' + error.message);
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Two images at the top */}
        <div style={styles.imageRow}>
          <img src={logoImg} alt="Logo" style={styles.img} />
          <img src={sealImg} alt="Seal" style={styles.img} />
          <img src={sealImg1} alt="Seal" style={styles.img} />
        </div>

        <h2 style={styles.heading}>Login</h2>
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
};

// Add hover effects via CSS (since inline styles don't support :hover)
// We inject a style tag in the component – this keeps it self-contained.
// For a more robust approach, you could use styled-components or a CSS module.
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  input:focus {
    border-color: #0A70BA !important;
    box-shadow: 0 0 0 3px rgba(10,112,186,0.2), inset 0 2px 6px rgba(0,0,0,0.05) !important;
    background-color: white !important;
  }
  button:hover {
    transform: scale(1.02) translateY(-2px) !important;
    box-shadow: 0 12px 28px rgba(0,168,171,0.5), 0 0 0 2px #EDDB0B !important;
    background: linear-gradient(135deg, #68B42D, #00A8AB) !important;
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
  /* 3D card lift on hover */
  .auth-card:hover {
    transform: perspective(800px) rotateX(0deg) rotateY(0deg) translateY(-6px) !important;
    box-shadow: 0 30px 60px rgba(42,73,155,0.4), 0 0 0 2px #EDDB0B, 0 0 0 4px rgba(104,180,45,0.2) !important;
  }
`;
document.head.appendChild(styleSheet);

export default Login;