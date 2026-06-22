import React from 'react';

const PaymentButtons = ({ onPaymentSelect }) => {
  const paymentMethods = [
    { id: 'landbank', name: 'LANDBANK', icon: '🏦' },
    { id: 'maya', name: 'MAYA', icon: '💳' },
    { id: 'gcash', name: 'GCASH', icon: '📱' }
  ];

  return (
    <div className="payment-buttons">
      <h3>SELECT PAYMENT METHOD</h3>
      <div className="payment-methods">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            className="payment-btn"
            onClick={() => onPaymentSelect(method.id)}
          >
            <span className="payment-icon">{method.icon}</span>
            <span className="payment-name">{method.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PaymentButtons;