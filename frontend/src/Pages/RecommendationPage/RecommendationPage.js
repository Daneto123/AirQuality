import React, { useState, useEffect } from 'react';
import Navbar from '../../Components/Navbar/Navbar';
import Footer from '../../Components/Footer/Footer';
import './RecommendationPage.css';

const DeviceRecommender = () => {
  const [roomSize, setRoomSize] = useState('');
  const [priority, setPriority] = useState('');

  const getRecommendation = () => {
    if (roomSize === 'large' && priority === 'allergies') {
      return 'Coway Airmega 400';
    } else if (roomSize === 'small' && priority === 'quiet') {
      return 'Levoit Core 300';
    } else if (roomSize === 'medium' && priority === 'odor') {
      return 'Blueair Blue Pure 211+';
    } else if (roomSize === 'large' && priority === 'odor') {
      return 'Dyson Purifier Cool';
    }
    return 'Моля, изберете нуждите си.';
  };

  return (
    <div className="device-recommender">
      <h2>Намерете подходящ пречиствател</h2>
      <label>
        Площ на помещението:
        <select value={roomSize} onChange={(e) => setRoomSize(e.target.value)}>
          <option value="">Изберете</option>
          <option value="small">Малко</option>
          <option value="medium">Средно</option>
          <option value="large">Голямо</option>
        </select>
      </label>
      <label>
        Приоритет:
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">Изберете</option>
          <option value="quiet">Тихо</option>
          <option value="allergies">Алергии</option>
          <option value="odor">Миризми</option>
        </select>
      </label>
      <p><strong>Препоръка:</strong> {getRecommendation()}</p>
    </div>
  );
};

const RecommendationPage = () => {
  const [currentAQI, setCurrentAQI] = useState(null);

  useEffect(() => {
    // API извикване за текущия AQI
    const fetchAQI = async () => {
      try {
        const response = await fetch('https://api.example.com/aqi/current');
        const data = await response.json();
        setCurrentAQI(data);
      } catch (error) {
        console.error('Error fetching AQI:', error);
      }
    };

    fetchAQI();
  }, []);

  return (
    <div>
      <Navbar />
      
      <div className="aqi">
        <h2>Индекс на качеството на въздуха (AQI)</h2>
        {currentAQI ? (
          <p>Текущ AQI: {currentAQI.value} ({currentAQI.quality})</p>
        ) : (
          <p>Зареждане на текущите данни...</p>
        )}
        
        <table>
          <thead>
            <tr>
              <th>AQI Стойност</th>
              <th>Качество на въздуха</th>
              <th>Цвят</th>
              <th>Здравен ефект</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>0 - 50</td>
              <td>Добро</td>
              <td style={{ backgroundColor: 'green' }}></td>
              <td>Въздухът е безопасен за дишане.</td>
            </tr>
            <tr>
              <td>51 - 100</td>
              <td>Умерено</td>
              <td style={{ backgroundColor: 'yellow' }}></td>
              <td>Приемливо качество на въздуха, но може да засегне чувствителни групи.</td>
            </tr>
            <tr>
              <td>101 - 150</td>
              <td>Нездравословно за чувствителни групи</td>
              <td style={{ backgroundColor: 'orange' }}></td>
              <td>Може да предизвика симптоми у чувствителни хора, особено при продължително излагане.</td>
            </tr>
            <tr>
              <td>151 - 200</td>
              <td>Нездравословно</td>
              <td style={{ backgroundColor: 'red', color: 'white' }}></td>
              <td>Всички хора могат да изпитат негативни здравни ефекти.</td>
            </tr>
            <tr>
              <td>201 - 300</td>
              <td>Много нездравословно</td>
              <td style={{ backgroundColor: 'purple', color: 'white' }}></td>
              <td>Риск от сериозни здравни ефекти за всички хора.</td>
            </tr>
            <tr>
              <td>301 - 500</td>
              <td>Опасно</td>
              <td style={{ backgroundColor: 'maroon', color: 'white' }}></td>
              <td>Въздухът е опасен за здравето. Не се препоръчва излизане навън.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="airFilterHome">
        <h1>Ръководство за пречисвател за въздух</h1>
        <DeviceRecommender />

        <h2>Често задавани въпроси:</h2>
        <ul>
          <li><strong>Колко често трябва да сменям филтрите?</strong> Обикновено между 6-12 месеца, в зависимост от използването и вида на филтъра.</li>
          <li><strong>Мога ли да оставя пречиствателя включен през целия ден?</strong> Да, повечето устройства са проектирани за дългосрочна работа и ниска консумация на енергия.</li>
          <li><strong>Има ли значение къде ще поставя пречиствателя?</strong> Да, поставете го в централно място, далеч от стени или препятствия, за да осигурите оптимален въздушен поток.</li>
        </ul>
      </div>

      <Footer />
    </div>
  );
};

export default RecommendationPage;
