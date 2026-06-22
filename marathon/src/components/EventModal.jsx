import React from 'react';

const EventModal = ({ 
  isOpen, 
  onClose, 
  events, 
  selectedEvent, 
  onEventSelect,
  categoryName,
  isEditing = false
}) => {
  if (!isOpen) return null;

  const handleEventClick = (eventId) => {
    onEventSelect(eventId);
    onClose(); // Close modal after selection
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content event-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>{isEditing ? '✏️ CHANGE EVENT' : 'SELECT EVENT'}</h2>
        <p className="category-label">{categoryName}</p>
        
        {isEditing && (
          <div className="editing-indicator">
            <span>⚠️ You are changing your selected event</span>
          </div>
        )}

        <div className="event-list">
          {events.map((event) => (
            <button
              key={event.id}
              className={`event-select-btn ${selectedEvent === event.id ? 'active' : ''}`}
              onClick={() => handleEventClick(event.id)}
            >
              <div className="event-info">
                <div className="event-name">
                  {event.name}
                  {selectedEvent === event.id && (
                    <span className="current-selection-badge">✓ Current</span>
                  )}
                </div>
                <div className="event-details">
                  <span className="event-distance">📏 {event.distance}</span>
                  <span className="event-fee">💰 ₱{event.fee.toLocaleString()}.00</span>
                </div>
              </div>
              <div className="select-indicator">
                {selectedEvent === event.id ? '✓' : '→'}
              </div>
            </button>
          ))}
        </div>

        <button className="modal-close-btn" onClick={onClose}>
          {isEditing ? 'Cancel' : 'Close'}
        </button>
      </div>
    </div>
  );
};

export default EventModal;