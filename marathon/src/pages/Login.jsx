import React from 'react';

const Login = () => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Maintenance Icon */}
        <div style={styles.iconContainer}>
          <span style={styles.icon}>🔧</span>
        </div>

        <h2 style={styles.heading}>System Maintenance</h2>

        <p style={styles.message}>
          Our system is currently undergoing an update. 
          We will get back to you as soon as possible. 
          Thank you for your patience.
        </p>

        {/* Decorative dots */}
        <div style={styles.dots}>
          <span style={{...styles.dot, animationDelay: '0s'}}></span>
          <span style={{...styles.dot, animationDelay: '0.2s'}}></span>
          <span style={{...styles.dot, animationDelay: '0.4s'}}></span>
        </div>
      </div>
    </div>
  );
};

// -------- Professional design with your color palette --------
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
    background: 'linear-gradient(135deg, rgba(42,73,155,0.05), rgba(0,168,171,0.05))',
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(12px)',
    borderRadius: '40px 12px 40px 12px',
    padding: '48px 36px',
    textAlign: 'center',
    boxShadow: `
      0 20px 60px rgba(42, 73, 155, 0.2),
      0 8px 20px rgba(0, 168, 171, 0.15),
      0 0 0 2px rgba(237, 219, 11, 0.2),
      0 0 0 4px rgba(104, 180, 45, 0.08)
    `,
    border: '1px solid rgba(255,255,255,0.3)',
    animation: 'float 3s ease-in-out infinite',
  },
  iconContainer: {
    marginBottom: '20px',
  },
  icon: {
    fontSize: '72px',
    display: 'inline-block',
    animation: 'spin 4s linear infinite',
  },
  heading: {
    fontSize: '2.2rem',
    fontWeight: 700,
    marginBottom: '16px',
    background: `linear-gradient(135deg, ${colors.darkBlue}, ${colors.teal})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.5px',
  },
  message: {
    fontSize: '1.1rem',
    lineHeight: '1.8',
    color: '#4a5568',
    marginBottom: '24px',
    padding: '0 8px',
  },
  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '8px',
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})`,
    display: 'inline-block',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
};

// Add animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(0.6); opacity: 0.5; }
  }
`;
document.head.appendChild(styleSheet);

export default Login;