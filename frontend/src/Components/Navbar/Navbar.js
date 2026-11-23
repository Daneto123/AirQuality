import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css'
import { API_URL } from '../../config';

const Navbar = () => {
  return (
    <nav>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/sevenDaysDiagram">7 дневна прогноза</NavLink>
        <NavLink to="/sevenDaysMap">Интерактивна карта</NavLink>
        <NavLink to="/recommendation">Препоръки</NavLink>
        <NavLink to="/aboutUs">За нас</NavLink>
        <a href={`${API_URL}/downloadReport`} download>📥 Свали PDF отчет</a>
    </nav>
  );
};

export default Navbar;
