import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RegistrationForm from '../components/RegistrationForm';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { currentUser, userData, logout, getUserRegistrations } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (currentUser) {
        const userRegs = await getUserRegistrations(currentUser.uid);
        setRegistrations(userRegs);
      }
      setLoading(false);
    };

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

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '👤';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Get random color for avatar based on name
  const getAvatarColor = (name) => {
    const colors = ['#EDDB0B', '#68B42D', '#00A8AB', '#0A70BA', '#2A499B'];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div style={styles.dashboard}>
      {/* Animated Background */}
      <div style={styles.backgroundEffects}>
        <div style={styles.glow1}></div>
        <div style={styles.glow2}></div>
        <div style={styles.glow3}></div>
      </div>

      {/* Header Section */}
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

      {/* Main Content */}
      <div style={styles.content}>
        <RegistrationForm />
        
        {/* Registrations History */}
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
                        background: reg.categoryId === 'open' ? '#0A70BA' :
                                   reg.categoryId === 'masters' ? '#2A499B' : '#68B42D'
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
                    <div style={styles.progressBar}>
                      <div style={{
                        ...styles.progressFill,
                        width: reg.status === 'completed' ? '100%' :
                               reg.status === 'pending' ? '50%' : '25%'
                      }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// STYLES - Professional 3D Design with Liloan Love the Life Theme
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
  statsContainer: {
    position: 'relative',
    zIndex: 10,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    maxWidth: '1200px',
    margin: '0 auto 28px',
  },
  statCard: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.88)',
    backdropFilter: 'blur(16px) saturate(1.2)',
    borderRadius: '20px',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 12px 40px rgba(42, 73, 155, 0.20), inset 0 1px 0 rgba(255,255,255,0.5)',
    border: '1px solid rgba(255,255,255,0.3)',
    transform: 'perspective(800px) rotateX(1deg)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    overflow: 'hidden',
  },
  statIcon: {
    fontSize: '2.2rem',
    opacity: 0.8,
  },
  statInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  statNumber: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: colors.darkBlue,
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: '0.8rem',
    color: '#4a5568',
    fontWeight: 500,
  },
  statBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${colors.blue}, ${colors.teal})`,
    borderRadius: '0 0 4px 4px',
    transition: 'width 1s ease',
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
  progressBar: {
    width: '100%',
    height: '4px',
    background: 'rgba(0, 168, 171, 0.10)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: `linear-gradient(90deg, ${colors.blue}, ${colors.teal})`,
    borderRadius: '4px',
    transition: 'width 1s ease',
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
};

// ============================================================
// CSS KEYFRAMES (injected)
// ============================================================

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes floatGlow {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(30px, -30px) scale(1.1); }
  }

  @keyframes pulseGlow {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
  }

  /* Hover Effects */
  .dashboard-header:hover {
    transform: perspective(1000px) rotateX(0deg) translateY(-4px) !important;
    box-shadow: 0 30px 70px rgba(42, 73, 155, 0.35), 0 0 0 2px #EDDB0B, 0 0 0 4px rgba(104,180,45,0.15) !important;
  }

  .stat-card:hover {
    transform: perspective(800px) rotateX(0deg) translateY(-4px) !important;
    box-shadow: 0 20px 50px rgba(42, 73, 155, 0.30) !important;
  }

  .registration-card:hover {
    transform: translateY(-4px) !important;
    box-shadow: 0 12px 32px rgba(10, 112, 186, 0.15) !important;
    border-color: rgba(10, 112, 186, 0.20) !important;
  }

  .logout-btn:hover {
    transform: scale(1.05) translateY(-2px) !important;
    box-shadow: 0 10px 30px rgba(245, 101, 101, 0.45) !important;
  }

  .history-section:hover {
    transform: perspective(1200px) rotateX(0deg) translateY(-4px) !important;
    box-shadow: 0 30px 70px rgba(42, 73, 155, 0.30), 0 0 0 2px rgba(0,168,171,0.15) !important;
  }

  .avatar-wrapper:hover .avatar {
    transform: scale(1.08) !important;
  }

  /* Responsive */
  @media (max-width: 768px) {
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

    .stats-container {
      grid-template-columns: 1fr !important;
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

    .stat-number {
      font-size: 1.4rem !important;
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
  }
`;
document.head.appendChild(styleSheet);

export default Dashboard;