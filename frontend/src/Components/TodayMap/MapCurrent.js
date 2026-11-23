import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import { Map, View, Overlay } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import './MapCurrent.css';
import { API_URL } from '../../config';

const MapsCurrent = () => {
  const mapRef = useRef();
  const tooltipRef = useRef();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/metricsLastDay`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!mapRef.current || data.length === 0) return;

    const entry = data[0];
    const feature = new Feature({
      geometry: new Point(fromLonLat([parseFloat(entry.longitude), parseFloat(entry.latitude)])),
      ...entry,
    });

    const vectorSource = new VectorSource({
      features: [feature],
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        image: new CircleStyle({
          radius: 10,
          fill: new Fill({ color: 'red' }),
          stroke: new Stroke({ color: 'black', width: 1 }),
        }),
      }),
    });

    const baseLayer = new TileLayer({
      source: new OSM(),
    });

    const map = new Map({
      target: mapRef.current,
      layers: [baseLayer, vectorLayer],
      view: new View({
        center: fromLonLat([parseFloat(entry.longitude), parseFloat(entry.latitude)]),
        zoom: 7,
      }),
    });

    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const overlay = new Overlay({
      element: tooltip,
      offset: [10, 0],
      positioning: 'bottom-left',
    });
    map.addOverlay(overlay);

    map.on('pointermove', (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (f) => f);
      if (feature) {
        const props = feature.getProperties();
        tooltip.innerHTML = `
          <strong>${props.timestamp}</strong><br/>
          Benzene: ${props.Benzene}<br/>
          CO₂: ${props.CO2}<br/>
          Dust: ${props.Dust}<br/>
          NH₃: ${props.NH3}<br/>
          Humidity: ${props.humidity}%<br/>
          Temperature: ${props.temperature}°C
        `;
        overlay.setPosition(event.coordinate);
        tooltip.style.display = 'block';
      } else {
        overlay.setPosition(undefined);
        tooltip.style.display = 'none';
      }
    });

    return () => map.setTarget(null);
  }, [data]);

  return (
    <div className="container">
      <h3 className="textche">Моментна прогноза за замърсяването на въздуха за последните 5 минути</h3>
      {loading ? (
        <div>Зареждане...</div>
      ) : (
        <div className="centered-div">
          <div ref={mapRef} className="tooltipTop"></div>
          <div ref={tooltipRef} className="tooltip"></div>
        </div>
      )}
    </div>
  );
};

export default MapsCurrent;
