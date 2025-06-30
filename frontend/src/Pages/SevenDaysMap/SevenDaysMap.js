import React, { useState, useEffect } from 'react';
import Navbar from '../../Components/Navbar/Navbar';
import Footer from '../../Components/Footer/Footer';
import MapsPrediction from '../../Components/TodayMap/MapPrediciton';
import DateSelector from '../../Components/DateSelector/DateSelector';
import './SevenDaysMap.css';

const SevenDaysMap = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  return (
    <div>
      <Navbar />
      <div>
        <DateSelector onDateSelect={(date) => setSelectedDate(date)} />
        <MapsPrediction date={selectedDate} />
      </div>
      <Footer />
    </div>
  );
};

export default SevenDaysMap;