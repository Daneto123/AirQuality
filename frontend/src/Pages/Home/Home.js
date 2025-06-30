import React, { useState } from 'react';
import Navbar from '../../Components/Navbar/Navbar';
import Footer from '../../Components/Footer/Footer';
import Diagram from '../../Components/TodayDiagram/Diagram';
import MapsPrediction from '../../Components/TodayMap/MapPrediciton';
import MapsCurrent from '../../Components/TodayMap/MapCurrent';
import './Home.css';

const Home = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('https://localhost:3050/downloadbook', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      alert('Form submitted successfully! ' + data.message); // Or display success message in UI
      setFormData({ name: '', email: '', message: '' }); // Clear form after successful submission
    } catch (error) {
      alert('Error submitting form: ' + error); // Or display error message in UI
    }
  };

  const currentDate = new Date().toISOString().split('T')[0]; // 2025-03-03

  return (
      <div>
        <Navbar />
        
        <div>
          <MapsPrediction date={currentDate} />
        </div>
        <div>
          <MapsCurrent />
        </div>

        <Diagram date={currentDate} />
        

        <div className='content'>
            <div className="main-section">
                <div className="image-section">
                    <img src={require('./iot.png')} alt="Smart Home Image" className="home-image" />
                </div>
                <div className="text-section">
                    <h2>Какво позволява нашата система</h2>
                    <p>След като закупите от нас датчик за температура и влажност може да го въведете в приложението.</p>
                    <p>Може да следите данните както на компютър така и на мобилно устройство.</p>
                </div>
            </div>
        </div>

        

        <form id="contact-form" onSubmit={handleSubmit}>
            <h2>Contact Us</h2>
            <div className="form-group">
                <label for="name">Name:</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label for="message">Phone number:</label>
                <input type="text" id="message" name="message" value={formData.message} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <div className="g-recaptcha" data-sitekey="YOUR_SITE_KEY"></div> 
            </div>

            <button type="submit">Download book</button>

        </form>
        <Footer />
    </div>
  );
};

export default Home;
