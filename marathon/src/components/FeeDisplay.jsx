import React from 'react';

const FeeDisplay = ({ selectedEvent, events }) => {
  if (!selectedEvent || !events) return null;

  const event = events.find(e => e.id === selectedEvent);
  if (!event) return null;

  return (
    <div className="fee-display">
      <h3>REGISTRATION FEES (EARLY REGISTRATION)</h3>
      <div className="fee-card">
        <div className="fee-info">
          <span className="event-name">{event.name}</span>
          <span className="event-distance">{event.distance}</span>
        </div>
        <span className="fee-amount">₱{event.fee.toLocaleString()}.00</span>
      </div>
    </div>
  );
};

export default FeeDisplay;