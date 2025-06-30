import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { format } from 'date-fns';
import { Line } from 'react-chartjs-2';
import './Diagram.css';

ChartJS.register(...registerables);

const Diagram = ({ date }) => {
  const mapRef = useRef();
  const [dataFromDB, setDataFromDB] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:3060/predictionMetrics`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const jsonData = await response.json();
        console.log(jsonData)
        setDataFromDB(jsonData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (dataFromDB.length > 0) {
      const filtered = dataFromDB.filter(item => format(new Date(item.timestamp), 'yyyy-MM-dd').startsWith(date));
      const hourlyData = {};

      // Групиране на данни по час и изчисляване на средната стойност
      filtered.forEach(entry => {
        const hour = new Date(entry.timestamp).toISOString().split('T')[1].split(':')[0]; // Извличане на часа
        if (!hourlyData[hour]) {
          hourlyData[hour] = { sum: 0, count: 0 };
        }
        hourlyData[hour].sum += parseFloat(entry.overallAQI);
        hourlyData[hour].count += 1;
      });

      // Преобразуване в осреднени данни
      const labels = Object.keys(hourlyData).sort(); // Часовете като етикети
      const data = labels.map(hour => hourlyData[hour].sum / hourlyData[hour].count); // Средни стойности

      console.log(data);

      // Актуализиране на данните за диаграмата
      setChartData({
        labels,
        datasets: [
          {
            label: 'Air Quality (Average per Hour)',
            data,
            borderColor: 'blue',
            fill: false,
          },
        ],
      });
    }
  }, [dataFromDB, date]);

  const options = {
    responsive: true,
    scales: {
      x: { title: { display: true, text: 'Hour of the Day' } },
      y: { title: { display: true, text: 'Air Quality (AQI)' } },
    },
  };

  return (
    <div className="container">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="centered-div">
          <h3 className="textche">
            Диаграма на замърсяване на въздуха за дата {date}
          </h3>
          {chartData ? (
            <Line data={chartData} options={options} />
          ) : (
            <p>No data available for the selected date.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Diagram;
