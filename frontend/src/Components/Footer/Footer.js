import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './Footer.css'

const Footer = () => {
  return (
    <footer>
      <div class="footer">
        <div class="row">
          <div > {/* Added a container class */}
            <a href="https://www.facebook.com/">
            </a>
            <a href="https://www.instagram.com/">
            </a>
            <a href="https://www.youtube.com/watch?v=VzUUYpvvyYw">
            </a>
            <a href="https://twitter.com/">
            </a>
          </div>
        </div>
          
        <div class="row">
          <ul>
          <li><NavLink to="/">За нас</NavLink></li>
          <li><NavLink to="/">Препоръки</NavLink></li>
          <li><a href="https://www.techtarget.com/iotagenda/definition/Internet-of-Things-privacy-IoT-privacy">Privacy Policy</a></li>
          <li><NavLink to="/">Terms & Conditions</NavLink></li>
          </ul>
        </div>
          
        <div class="row">
        <NavLink to="/">IoT app with rapberry app</NavLink> 
      </div>
    </div>
  </footer>
  );
};

export default Footer;
