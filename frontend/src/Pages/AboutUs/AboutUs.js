import React from 'react';
import Navbar from '../../Components/Navbar/Navbar';
import './AboutUs.css';
import Footer from '../../Components/Footer/Footer';

const AboutUs = () => {
  return (
    <div>
      <Navbar />
      <div className="container3">
            <h1>Most frequently asked questions by our clients</h1>
            <div className="questions1">
            <div className="question">
                <h2>Are there other similar products on the market yet?</h2>
                <p>There are no alternatives on our market yet</p>
            </div>
            <div className="question">
                <h2>Is the sensor compatible with my existing smart home system?</h2>
                <p>Data is encrypted and you can only access it</p>
            </div>
            <div className="question">
                <h2>Is it easy to set up and use? Does it require any technical expertise? Will I need help from a professional to install it?</h2>
                <p>Answer here is you don't need help for setup</p>
            </div>
            <div className="question">
                <h2>What is the upfront cost of the sensor?</h2>
                <p>There is no additional taxes after you buy a sensor. App is Free to download</p>
            </div>
            <div className="question">
                <h2>Who has access to my data?</h2>
                <p>Data is encrypted and only you can access it</p>
            </div>
            <div className="question">
                <h2>In future you will able to connect your sensors to smart home like Amazon Alexa or Apple HomePod</h2>
            </div>
            </div>
        </div>

        <div className="container4">
            <div className="content-column">
                <h2>Benefits</h2>
                <h3>Focus on how it solves your problems and improves our lives.</h3>
                <ul>
                    <li>1. Real-time data monitoring</li>
                    <li>2. Remote access and control</li>
                    <li>3. Easy setup and use</li>
                    <li>4. Compatibility with various platforms</li>
                    <li>5. Long battery life (more than 2 years)</li>
                    <li>6. Secure data transmission</li>
                </ul>
            </div>
            <div className="image-column">
                <img src={require('./pngwing.png')} alt="Image description" />
            </div>
        </div>
        <Footer />
    </div>
  );
};

export default AboutUs;
