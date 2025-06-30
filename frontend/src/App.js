import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from '../src/Pages/Home/Home';
import AboutUs from '../src/Pages/AboutUs/AboutUs'
import SevenDaysDiagram from '../src/Pages/SevenDaysDiagram/SevenDaysDiagram';
import SevenDaysMap from '../src/Pages/SevenDaysMap/SevenDaysMap';
import RecommendationPage from './Pages/RecommendationPage/RecommendationPage';
import PageNotFound from '../src/Pages/PageNotFound/PageNotFound';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div>
        <Routes>
            <Route path="/sevenDaysMap" element={<SevenDaysMap />} />
            <Route path="/sevenDaysDiagram" element={<SevenDaysDiagram />} />
            <Route path="/aboutUs" element={<AboutUs />} />
            <Route path="/recommendation" element={<RecommendationPage />} />
            <Route path="/" element={<Home />} />
            <Route path='*' element={<PageNotFound />} />
          </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
