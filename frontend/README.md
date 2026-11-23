# AirQuality – frontend

React dashboard for the AirQuality system: current readings on a map, PM2.5/PM10 forecasts,
charts and recommendations.

## Run locally

```bash
npm install
npm start          # http://localhost:3000
```

The app talks to the `influxDBApi` backend at `http://localhost:3060` by default. To point it
somewhere else, set `REACT_APP_API_URL` before starting or building:

```bash
REACT_APP_API_URL=http://192.168.1.50:3060 npm run build
```

See the [main README](../README.md) for the full system.
