import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import { deleteData, recreateBucket, addTestTemperaturePoint, addTestTemperaturePointForModel, getDataFromBucketForModel, getDataFromBucket, listBuckets } from './influxFunctions.js'
import { processSensorData } from './filterData/dataFilter.js'
import { getWeather } from './outsideApi/weather.js'
import { getCoordinates } from './outsideApi/coordinates.js'
import { processAQIData } from './filterData/aqi.js'
import { checkAvailableSensor } from './filterData/available_sensor.js'
import { groupAndAverage } from './downloadReport/downloadReport.js'
import { sendAlertEmail } from './filterData/sendAlert.js'
import path from "path";
import { fileURLToPath } from 'url';
import axios from 'axios';
import helmet from 'helmet';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';
import fs from 'fs';
import PDFDocument  from 'pdfkit';
import dayjs from 'dayjs';
import createReadStream from 'fs';
import Transform from 'stream';
import JSONStream from 'JSONStream';

const org = process.env.ORG || "VratsaSoft";
const PORT = process.env.PORT || 3060;
const IP = process.env.IP || "localhost";

const app = express();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

app.use(express.json());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      // Restrict most resources to self (your own domain)
      defaultSrc: ["'self'"],

      // Allow scripts from your own domain and from a specific trusted source (replace 'https://example.com' with the actual URL)
      scriptSrc: ["'self'", 'https://localhost:3060'],

      // Allow stylesheets from your own domain
      styleSrc: ["'self'"],

      // Allow form submissions to your own domain
      formAction: ["'self'"],

      // Allow connections (like WebSockets) to your own domain
      connectSrc: ["'self'"],

      objectSrc: ["'none'"], // Block object embedding (like Flash)
      frameAncestors: ["'none'"], // Prevent clickjacking

      reportUri: '/csp-violation-report' // Replace with your report endpoint
    },
  },
}));
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
}));
app.use(bodyParser.urlencoded({ 
  extended: true 
}));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 60 * 1000, // 30 минути в милисекунди
  },
}));

let username = "";
let sensorName = "";

const swaggerOptions = {
	swaggerDefinition: {
	info: {
		title: "userAccount API",
		version: "1.0.0",
		description: "IoT tensis project",
	},
	servers: [ {
			url: "http://130.204.82.44:3060",
			description: "API Documentation",
		},
	],
	},
	apis: ["index.js"],
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// app.use((req, res, next) => {
//   if (req.session) {
//     if (!req.session.lastActivity) {
//       req.session.lastActivity = Date.now();
//     } else if (Date.now() - req.session.lastActivity > 30 * 60 * 1000) {
//       // Ако е изминало повече от 30 минути неактивност
//       req.session.destroy(err => {
//         if (err) {
//           return next(err);
//         }
//         res.redirect('/login'); // Пренасочване към login страница или друга подходяща
//       });
//       return;
//     }
//     req.session.lastActivity = Date.now(); // Обновяваме времето на активност
//   }
//   next();
// });

app.get('/addFileData', async (req, res) => {
  const filePath = path.join(__dirname, '../influxDB/Data/all_data.json');
  const fileData = await fs.readFile(filePath, 'utf-8');
  const jsonData = JSON.parse(fileData);

  for (let index = 0; index < jsonData.length; index++) {
    const response = await axios.post('http://localhost:3060/addNewValue', jsonData[index]);
    await sleep(3000);
  }
  res.status(200);
})

/**
 * @swagger
 * /addNewValue:
 *   post:
 *     summary: Sensor data.
 *     description: Return sensor name
 *     responses:
 *      201:
 *        description: Created
 *      409:
 *        description: Conflict
 *      404:
 *        description: Not Found
 *      500:
 *        description: Server Error
 */
app.post('/addNewValue', async (req, res) => {
  const timestamp = req.body.timestamp;
  const city = req.body.city; // "Sofia";
  const sensorName = req.body.sensorName;
  const NH3 = req.body.airData.NH3;
  const Benzene = req.body.airData.Benzene;
  const CO2 = req.body.airData.CO2;
  const Dust = req.body.airData.Dust;
  
  const checkForBucket = await axios.post('http://192.168.1.137:3060/create-bucket', {city: city});
  const checkSensorName = checkAvailableSensor(sensorName);

  const date = new Date(timestamp * 1000);
  const hour = date.getHours();

  const coordinates = await getCoordinates(city);
  const weather = await getWeather(coordinates, hour); // това е за текущи данни

	if (checkForBucket.status === 200) {
    console.log("sensorName:", checkSensorName);
    if(checkSensorName == true) {
      addTestTemperaturePoint(org, timestamp, sensorName, city, NH3, Benzene, CO2, Dust, weather.temperature, weather.humidity, coordinates.latitude, coordinates.longitude);
    
        console.log(timestamp);
        console.log(city);
        console.log(sensorName);
        console.log(NH3);
        console.log(Benzene);
        console.log(CO2);
        console.log(Dust);
        console.log(weather.temperature);
        console.log(weather.humidity);
        console.log(coordinates.latitude);
        console.log(coordinates.longitude);
    } else {
      return res.status(400).json({status: "Sensor is not registed in our eco system"});
    }
	}

  return res.status(200).json({status: "data received"});
    
});

// create a new bucket
/**
 * @swagger
 * /create-bucket:
 *   post:
 *     summary: Sensor data.
 *     description: Return sensor name
 *     responses:
 *      201:
 *        description: Created
 *      409:
 *        description: Conflict
 *      404:
 *        description: Not Found
 *      500:
 *        description: Server Error
 */
app.post('/create-bucket', async (req, res) => {
    const city = req.body.city;
    const buckets = await listBuckets();

    const existing = buckets.find(bucket => bucket.name === city);
    if (existing) {
      return res.status(200).send("Bucket already exists.");
    }

    // Ако трябва да се създаде нова кофа
    await createBucket(city); // твоята функция за създаване
    return res.status(200).send("New bucket created successfully.");
});

// Metrics endpoint for a specific bucket
/**
 * @swagger
 * /metricsLastDay:
 *   get:
 *     summary: Sensor data.
 *     description: Return sensor name
 *     responses:
 *      201:
 *        description: Created
 *      409:
 *        description: Conflict
 *      404:
 *        description: Not Found
 *      500:
 *        description: Server Error
 */
app.get('/metricsLastDay', async (req, res) => {
  const bucketName = "Sofia"; //req.body.bucketName;
  const range = "3h"; //req.body.range
  const org = "VratsaSoft";
  
  //try {
    const result = await getDataFromBucket(bucketName, range, org);

    //console.log(result);

    res.status(200).send(JSON.stringify(result, null, 2));
  //} catch (error) {
  //   res.status(400).json({ error: 'Error influx query' });
  //}

});

/**
 * @swagger
 * /metricsLastDay:
 *   get:
 *     summary: Sensor data.
 *     description: Return sensor data for last 5 min
 *     responses:
 *      201:
 *        description: Created
 *      409:
 *        description: Conflict
 *      404:
 *        description: Not Found
 *      500:
 *        description: Server Error
 */
app.get('/metricsLastMonth', async (req, res) => {
  const bucketName = "Sofia"; //req.body.bucketName;
  const range = "30d"; //req.body.range
  const org = "VratsaSoft";
  
  //try {
    const result = await getDataFromBucket(bucketName, range, org);

    //console.log(result);

    res.status(200).send(JSON.stringify(result, null, 2));
  //} catch (error) {
  //   res.status(400).json({ error: 'Error influx query' });
  //}

});

/**
 * @swagger
 * /metricsAlert:
 *   get:
 *     summary: Sensor data.
 *     description: Return sensor data for last 5 hour
 *     responses:
 *      201:
 *        description: Created
 *      409:
 *        description: Conflict
 *      404:
 *        description: Not Found
 *      500:
 *        description: Server Error
 */
app.get('/metricsAlert', async (req, res) => {
  const bucketName = req.body.bucketName; //"Sofia"
  const range = "5h"; //req.body.range
  const org = "VratsaSoft";
  
  //try {
    const result = await getDataFromBucket(bucketName, range, org);

    //console.log(result);

    res.status(200).send(JSON.stringify(result, null, 2));
  //} catch (error) {
  //   res.status(400).json({ error: 'Error influx query' });
  //}

});

/**
 * @swagger
 * /metricsLastDayFile:
 *   get:
 *     summary: Sensor data.
 *     description: Return sensor data with info form sensor
 *     responses:
 *      201:
 *        description: Created
 *      409:
 *        description: Conflict
 *      404:
 *        description: Not Found
 *      500:
 *        description: Server Error
 */
app.get('/metricsLastDayFile', async (req, res) => {
  try {
    // Създаваме пътя към data.json
    const filePath = path.join(__dirname, '../influxDB/Data/all_data.json');
    
    // Четем съдържанието на файла
    const jsonData = await fs.readFile(filePath, 'utf8');
    
    // Парсираме съдържанието
    const data = JSON.parse(jsonData);

    // Изпращаме JSON данните като отговор
    res.json(data);
  } catch (err) {
    console.error('Error reading ../influxDB/Data/all_data.json:', err);
    res.status(500).json({ error: 'Unable to fetch data' });
  }
});

/**
 * @swagger
 * /deletePoint:
 *   get:
 *     summary: delete point from bucket.
 *     description: delete points from bucket hour ago
 *     responses:
 *      201:
 *        description: Created
 *      409:
 *        description: Conflict
 *      404:
 *        description: Not Found
 *      500:
 *        description: Server Error
 */
app.delete('/deletePoint', async (req, res) => {
  await deleteData()
  .then(() => console.log('\nFinished SUCCESS'))
  .catch((error) => {
    console.error("/deletePoint", error);
    res.status(500).send(error);
  })
});

/**
 * @swagger
 * /predictionMetrics:
 *   get:
 *     summary: Sensor data.
 *     description: Get data from machine learning algorithm and send it to front end
 *     responses:
 *      201:
 *        description: Created
 *      409:
 *        description: Conflict
 *      404:
 *        description: Not Found
 *      500:
 *        description: Server Error
 */
app.get('/predictionMetrics', async (req, res) => {
  //try {
    const response = await fetch('http://127.0.0.1:5000/getPrediction');
    
    // Log the response to ensure it's successful
    //console.log('Raw Response:', response);

    // Parse the JSON response body
    const data = await response.json();
    //console.log('Parsed Data:', data);
    const dataToArray = JSON.parse(data)

    const aqiFilter = processAQIData(dataToArray);

    // Return the parsed data to the client
    res.status(200).send(aqiFilter);
  //} catch (error) {
  //  console.error('Error fetching prediction metrics:', error.message);
  //  res.status(500).json({ error: 'Failed to fetch prediction metrics.' });
  //}
});

/**
 * @swagger
 * /addDataForModel:
 *   post:
 *     summary: Sensor data.
 *     description: Add data to DB (only for getting data from files)
 *     responses:
 *      201:
 *        description: Created
 *      409:
 *        description: Conflict
 *      404:
 *        description: Not Found
 *      500:
 *        description: Server Error
 */
app.post('/addDataForModel', async (req, res) => {
  const timestamp = req.body.timestamp;
  const sensor_id = req.body.sensor_id;
  const lat = req.body.lat;
  const lon = req.body.lon;
  const pm10 = req.body.pm10;
  const pm25 = req.body.pm25;
  const temperature = req.body.temperature;
  const humidity = req.body.humidity;

  addTestTemperaturePointForModel(org, timestamp, sensor_id, lat, lon, pm10, pm25, temperature, humidity);

  res.status(200).json({status: "data is writen to db"});
});

/**
 * @swagger
 * /predictionMetrics:
 *   get:
 *     summary: Sensor data.
 *     description: Get data from machine learning algorithm
 *     responses:
 *      201:
 *        description: Created
 *      409:
 *        description: Conflict
 *      404:
 *        description: Not Found
 *      500:
 *        description: Server Error
 */
app.get('/getDataForModel', async (req, res) => {
  const bucketName = "modelDataBucket"; //req.body.bucketName;
  const range = "30d"; //req.body.range
  const measurement = "AirQualityIndex"; //req.body.measurement
  
  try {
    const result = await getDataFromBucketForModel(bucketName, range, measurement, org);

    //console.log(result);

    res.status(200).send(JSON.stringify(result, null, 2));
  } catch (error) {
     res.status(400).json({ error: 'Error influx query' });
  }


});

/**
 * @swagger
 * /downloadSoftwareFlash:
 *   get:
 *     summary: Sensor data.
 *     description: users can download software which can be flashed on raspberry pi 
 *     responses:
 *      201:
 *        description: Created
 *      409:
 *        description: Conflict
 *      404:
 *        description: Not Found
 *      500:
 *        description: Server Error
 */
app.get('/downloadSoftwareFlash', (req, res) => {
	const user_email = req.body.userEmail;
	
	const mailOptions = {
    from: 'alerts@example.com',
    to: user_email, // Replace with the client's email
    subject: 'Download last software for our sensors',
    text: `Dear patient,\n\n Please let keep up to date your sensor. From the link below you can get last version. There are also instrunctions for install the new software.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });

  return res.status(200).json({status: "data received"});
  
});

/**
 * @swagger
 * /downloadReport:
 *   get:
 *     summary: Sensor data.
 *     description: users can download pdf report with all data hour by hour 
 *     responses:
 *      201:
 *        description: Created
 *      409:
 *        description: Conflict
 *      404:
 *        description: Not Found
 *      500:
 *        description: Server Error
 */
app.get('/downloadReport', async (req, res) => {
  const fetchData = await fetch('http://192.168.1.137:3060/metricsLastMonth');
  const jsonData = await fetchData.json();
  const reportData = groupAndAverage(jsonData);

  const Year = dayjs(reportData[0].timestamp).format('YYYY');
  const MonthFirst = dayjs(reportData[0].timestamp).format('MM');
  const MonthLast = dayjs(reportData[reportData.length - 1].timestamp).format('MM');
  let YearMonth = "";

  if(MonthFirst == MonthLast) {
    YearMonth = `${Year}_${MonthFirst}`;
  } else {
    YearMonth = `${Year}_${MonthFirst}_${MonthLast}`;
  }

  const doc = new PDFDocument({ margin: 30, size: "A4" });

  res.setHeader("Content-Disposition", `attachment; filename=air_quality_report_${YearMonth}.pdf`);
  res.setHeader("Content-Type", "application/pdf");

  doc.pipe(res);

  doc.registerFont('Arial', path.join(__dirname, 'fonts', 'arial.ttf'));
  doc.font('Arial');

  doc.fontSize(16).text(`Почасов отчет за качеството на въздуха ${YearMonth}`, { align: "center" });
  doc.moveDown();

  doc.fontSize(10).font('Helvetica-Bold');
  const headers = ['DateTime', 'Benzene', 'CO2', 'Dust', 'NH3', 'Humidity', 'Temp'];
  const colWidths = [130, 60, 50, 50, 50, 60, 50];
  const startX = 50;
  let y = doc.y;

  headers.forEach((h, i) => {
    doc.text(h, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, { width: colWidths[i] });
  });
  doc.moveDown();

  // Данни
  doc.font('Helvetica');
  reportData.forEach(row => {
    y = doc.y;
    const from = dayjs(row.timestamp).format('YYYY-MM-DD HH:00');
    const to = dayjs(row.timestamp).add(1, 'hour').format('HH:00');
    const timeRange = `${from} - ${to}`;

    const values = [
      timeRange,
      parseFloat(row.Benzene)?.toFixed(2),
      parseFloat(row.CO2)?.toFixed(2),
      parseFloat(row.Dust)?.toFixed(2),
      parseFloat(row.NH3)?.toFixed(2),
      `${row.humidity.toFixed(1)}%`,
      `${row.temperature.toFixed(1)}°C`
    ];
    values.forEach((val, i) => {
      doc.text(val, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, { width: colWidths[i] });
    });
    doc.moveDown();
  });

  doc.end();
});

/**
 * @swagger
 * /backupData:
 *   get:
 *     summary: Sensor data.
 *     description: last 30 days data from influxDB is saved in csv file local 
 *     responses:
 *      201:
 *        description: Created
 *      409:
 *        description: Conflict
 *      404:
 *        description: Not Found
 *      500:
 *        description: Server Error
 */
app.get('/backupData', async (req, res) => {
  const fetchData = await fetch('http://192.168.1.137:3060/metricsLastMonth');
  const jsonData = await fetchData.json();

  let csv = "timestamp,Benzene,CO2,NH3,Dust,temperature,humidity\n";

  jsonData.forEach(row => {
    csv += `${row.timestamp},${row.Benzene},${row.CO2},${row.NH3},${row.Dust},${row.temperature},${row.humidity}\n`;
  });

  fs.writeFileSync("./backups/archive.csv", csv);

  return res.status(200).json({status: "backup successfull"});
});

/**
 * @swagger
 * /sendAlert:
 *   get:
 *     summary: Sensor data.
 *     description: send alert to user for air pollution in their city
 *     responses:
 *      201:
 *        description: Created
 *      409:
 *        description: Conflict
 *      404:
 *        description: Not Found
 *      500:
 *        description: Server Error
 */
app.get('/sendAlert', async (req, res) => {
  const fetchData = await fetch('http://192.168.1.137:3060/metricsAlert', {city: "Sofia"});
  const jsonData = await fetchData.json();
  const reportData = groupAndAverage(jsonData);

  const allDustOver20 = reportData.every(row => row.Dust > 20);

  if (allDustOver20) {
    const filePath = path.join(__dirname, 'userEmails.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const sensors = JSON.parse(rawData);
    
    sensors.forEach(user => {
      sendAlertEmail(user.email, "Sofia");
    })

  } else {
    console.log("Има стойности на Dust под 20");
  }

  return res.status(200).json({status: "backup successfull"});
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});