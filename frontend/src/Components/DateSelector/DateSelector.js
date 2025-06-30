import React from 'react';
import './DateSelector.css';

const DateSelector = ({ onDateSelect }) => {
  // Генериране на следващите 5 дни
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates();

  return (
    <div className="date-selector">
      <h3>Изберете ден:</h3>
      <div className="date-buttons">
        {dates.map((date, index) => (
          <button
            key={index}
            onClick={() => onDateSelect(date.toISOString().split('T')[0])}
            className="date-button"
          >
            {date.toLocaleDateString('bg-BG', { weekday: 'long', day: 'numeric', month: 'long' })}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateSelector;
