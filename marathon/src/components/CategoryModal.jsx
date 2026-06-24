import React from 'react';

const CategoryModal = ({ isOpen, onClose, onCategorySelect, categories }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>🎯 Select Category</h2>
        <p style={{ textAlign: 'center', color: '#4a5568', marginBottom: '20px' }}>
          Choose your race category
        </p>
        
        <div style={styles.categoryModalButtons}>
          {categories.map((category) => (
            <button
              key={category.id}
              style={styles.categoryModalBtn}
              onClick={() => onCategorySelect(category.id)}
            >
              <div style={styles.categoryModalIcon}>
                {category.id === 'open' && '🏃'}
                {category.id === 'masters' && '🏅'}
                {category.id === 'liloan' && '🏠'}
              </div>
              <div style={styles.categoryModalInfo}>
                <div style={styles.categoryModalName}>{category.name}</div>
                <div style={styles.categoryModalEvents}>
                  {category.events.map((e, i) => (
                    <span key={e.id}>
                      {e.name} ({e.distance})
                      {i < category.events.length - 1 && ' • '}
                    </span>
                  ))}
                </div>
              </div>
              <span style={styles.categoryModalArrow}>→</span>
            </button>
          ))}
        </div>

        <button className="modal-close-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

const styles = {
  categoryModalButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
    width: '100%',
  },
  categoryModalBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '18px 22px',
    background: 'rgba(255, 255, 255, 0.7)',
    border: '2px solid rgba(0, 168, 171, 0.15)',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
    textAlign: 'left',
    gap: '14px',
  },
  categoryModalIcon: {
    fontSize: '2rem',
    flexShrink: 0,
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(10, 112, 186, 0.06)',
    borderRadius: '12px',
  },
  categoryModalInfo: {
    flex: 1,
  },
  categoryModalName: {
    fontWeight: 700,
    color: '#2A499B',
    fontSize: '1rem',
    marginBottom: '4px',
  },
  categoryModalEvents: {
    fontSize: '0.8rem',
    color: '#718096',
  },
  categoryModalArrow: {
    fontSize: '1.2rem',
    color: '#a0aec0',
    flexShrink: 0,
  },
};

export default CategoryModal;