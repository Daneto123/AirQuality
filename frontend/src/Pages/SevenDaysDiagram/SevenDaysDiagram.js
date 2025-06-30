import React, { useState, useEffect } from 'react';
import Navbar from '../../Components/Navbar/Navbar';
import Footer from '../../Components/Footer/Footer';
import Diagram from '../../Components/TodayDiagram/Diagram';
import DateSelector from '../../Components/DateSelector/DateSelector';
import './SevenDaysDiagram.css';

const SevenDaysDiagram = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  return (
    <div>
        <Navbar />
        <div>
            <DateSelector onDateSelect={(date) => setSelectedDate(date)} />
            <Diagram date={selectedDate} />
        </div>
        <Footer />
    </div>
  );
};

export default SevenDaysDiagram;

