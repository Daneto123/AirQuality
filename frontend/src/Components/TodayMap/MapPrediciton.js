import React, { useState, useEffect, useRef } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import { Point } from 'ol/geom';
import Feature from 'ol/Feature';
import { fromLonLat } from 'ol/proj';
import { format } from 'date-fns';
import VectorLayer from 'ol/layer/Vector';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import CircleStyle from 'ol/style/Circle';
import './MapPrediction.css';
import { API_URL } from '../../config';

const MapsPrediction = ({ date }) => {
  const mapRef = useRef();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/predictionMetrics`); // ако искаме да визуализираме предскзването

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
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
    if (data.length > 0) {
      const filtered = data.filter(item => format(new Date(item.timestamp), 'yyyy-MM-dd').startsWith(date));

      const features = filtered.map((entry) => {
        return new Feature({
          geometry: new Point(fromLonLat([parseFloat(entry.lon), parseFloat(entry.lat)])),
          color: entry.aqiColor,
        });
      });

      const vectorSource = new VectorSource({
        features: features,
      });

      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: (feature) => {
          return new Style({
            image: new CircleStyle({
              radius: 10,
              fill: new Fill({ color: feature.get('color') }),
              stroke: new Stroke({ color: 'black', width: 1 }),
            }),
          });
        },
      });

      const baseLayer = new TileLayer({
        source: new OSM(),
      });

      const map = new Map({
        target: mapRef.current,
        layers: [baseLayer, vectorLayer],
        view: new View({
          center: fromLonLat([23.3219, 42.6977]), // Център: София
          zoom: 7, // Увеличение
        }),
      });

      return () => map.setTarget(null);
    }
  }, [data, date]);

  return (
    <div className="container">
      <h3 className="textche">Карта на България за дата {date}</h3>
      <h4 className="textche">Прогоза за замърсяването на въздуха през текущият ден</h4>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="centered-div">
          <div className="maps" ref={mapRef} />
          <div className="legend">
            <h4>Легенда за AQI</h4>
            <ul>
              <li><span className="legend-color green"></span>Good (0–50)</li>
              <li><span className="legend-color yellow"></span>Moderate (51–100)</li>
              <li><span className="legend-color orange"></span>Unhealthy for Sensitive Groups (101–150)</li>
              <li><span className="legend-color red"></span>Unhealthy (151–200)</li>
              <li><span className="legend-color purple"></span>Very Unhealthy (201–300)</li>
              <li><span className="legend-color maroon"></span>Hazardous (301–500)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapsPrediction;
