import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css'

const Navbar = () => {
  return (
    <nav>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/sevenDaysDiagram">7 дневна прогноза</NavLink>
        <NavLink to="/sevenDaysMap">Интерактивна карта</NavLink>
        <NavLink to="/recommendation">Препоръки</NavLink>
        <NavLink to="/aboutUs">За нас</NavLink>
        <a href="http://192.168.1.137:3060/downloadReport" download>📥 Свали PDF отчет</a>
    </nav>
  );
};

export default Navbar;
