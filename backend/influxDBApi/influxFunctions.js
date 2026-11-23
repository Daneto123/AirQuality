import { InfluxDB, Point, HttpError } from '@influxdata/influxdb-client';
import { OrgsAPI, BucketsAPI } from '@influxdata/influxdb-client-apis';

const influxConfig = {
    //url: 'http://host.docker.internal:8086',
    url: process.env.INFLUX_URL || 'http://localhost:8086',
    token: process.env.INFLUX_TOKEN,
};
  
let points = [];
let pointsModel = [];

const influx = new InfluxDB(influxConfig);

export async function deleteData() {
    const deleteAPI = new DeleteAPI(influxDB)
    const stop = new Date()
    const start = new Date(stop.getTime() - /* an hour */ 60 * 60 * 1000)

    await deleteAPI.postDelete({
        org,
        bucket,
        body: {
        start: start.toISOString(),
        stop: stop.toISOString(),
        predicate: '_measurement="temperature"',
        },
    })
}

export async function recreateBucket(name) {
  console.log('*** Get organization by name ***');
  const orgsAPI = new OrgsAPI(influx);
  const organizations = await orgsAPI.getOrgs({ org });
  
  if (!organizations || !organizations.orgs || !organizations.orgs.length) {
      console.error(`No organization named "${org}" found!`);
      throw new Error(`Organization "${org}" not found`);
  }

  const orgID = organizations.orgs[0].id;
  console.log(`Using organization "${org}" identified by "${orgID}"`);

  console.log('*** Check if bucket exists ***');
  const bucketsAPI = new BucketsAPI(influx);

  try {
      const buckets = await bucketsAPI.getBuckets({ orgID, name });

      if (buckets && buckets.buckets && buckets.buckets.length) {
          console.log(`Bucket named "${name}" already exists.`);
          return false; // Bucket exists, return false
      }
  } catch (error) {
      if (error instanceof HttpError && error.statusCode === 404) {
          console.log(`Bucket "${name}" does not exist. Proceeding to create it.`);
      } else {
          throw error; // Rethrow unexpected errors
      }
  }

  console.log(`*** Create Bucket "${name}" ***`);
  const bucket = await bucketsAPI.postBuckets({ body: { orgID, name } });
  //console.log(JSON.stringify(bucket, (key, value) => (key === 'links' ? undefined : value), 2));

  return true; // Bucket created successfully
}

export async function listBuckets() {
  console.log('*** Fetching all buckets ***');
  const bucketsAPI = new BucketsAPI(influx);

  try {
      // Извличане на всички кофи
      const response = await bucketsAPI.getBuckets({});
      if (response && response.buckets && response.buckets.length) {
          const bucketList = response.buckets.map(bucket => ({
              id: bucket.id,
              name: bucket.name,
              orgID: bucket.orgID,
              retentionRules: bucket.retentionRules,
              createdAt: bucket.createdAt,
          }));
          //console.log('Available buckets:', bucketList);
          return bucketList;
      } else {
          console.log('No buckets found.');
          return [];
      }
  } catch (error) {
      console.error('Error fetching buckets:', error);
      throw error;
  }
}

export async function addTestTemperaturePointForModel(org, timestamp, humidity, temperature, sensorName, city, hydrogen, lpg, methane) {
//     const writeApiTemp = influx.getWriteApi(org, city, 'ns');

//     const timestampInNanoseconds = timestamp * 1e9;  // Convert to nanoseconds
//     const timestampNano = BigInt(Date.now()) * 1000000n;
    
//     const pointTemp = new Point('airData')
//       .floatField('value', airData)
//       .floatField('temperature', temperature)
//       .floatField('humidity', humidity)
//       .floatField('hydrogen', hydrogen)
//       .floatField('lpg', lpg)
//       .floatField('methane', methane)
//       .stringField('sensorName', sensorName)
//       .timestamp(timestampNano);

//     points.push(pointTemp);

//     setTimeout(async () => {
//       try {
//         await writeApiTemp.writePoints(points);
//         console.log('Points written to InfluxDB');
//       } catch (error) {
//         console.error('Error writing points to InfluxDB:', error.message);
//       } finally {
//           await writeApiTemp.close().then(() => {
//           console.log('Temp write API closed');
//         });
//       }
//     }, 60000);

//     try {
//       await writeApiTemp.close().then(() => {
//         console.log('temp write finish');
//       })

//     } catch (error) {
//         console.error('Error creating bucket:', error.message);
//     }
}

export async function addTestTemperaturePoint(org, timestamp, sensorName, city, NH3, Benzene, CO2, Dust, temperature, humidity, latitude, longitude) {
//export async function addTestTemperaturePointForModel(org, timestamp, sensor_id, lat, lon, pm10, pm25, temperature, humidity) {
  const writeApiTemp = influx.getWriteApi(org, city, 'ns');

  const timestampInNanoseconds = timestamp * 1e9;
  
  //console.log(timestampInNanoseconds);
  
  const pointTemp = new Point('AirQualityIndex')
    .stringField('sensorName', sensorName)
    .floatField('NH3', NH3)
    .floatField('Benzene', Benzene)
    .floatField('CO2', CO2)
    .floatField('Dust', Dust)
    .floatField('temperature', temperature)
    .floatField('humidity', humidity)
	.floatField('latitude', latitude)
	.floatField('longitude', longitude)
    //.timestamp(timestampInNanoseconds);

    pointsModel.push(pointTemp);

	try {
		await writeApiTemp.writePoint(pointTemp);
		console.log('Point written to InfluxDB');
	} catch (error) {
		console.error('Error writing point to InfluxDB:', error.message);
	} finally {
		try {
		  await writeApiTemp.close();
		  console.log('Temp write API closed');
		} catch (e) {
		  console.error('Error closing write API:', e.message);
		}
	}
	
}

export async function getDataFromBucket(bucketName, range, org) {

	const fields = ['Benzene', 'CO2', 'Dust', 'NH3', 'humidity', 'latitude', 'longitude', 'temperature'];
	const fieldFilter = fields.map(f => `r["_field"] == "${f}"`).join(' or ');

	const fluxQuery = `
	  from(bucket: "${bucketName}")
		|> range(start: -${range})
		|> filter(fn: (r) => r["_measurement"] == "AirQualityIndex")
		|> filter(fn: (r) => ${fieldFilter})
		|> pivot(rowKey:["_time"], columnKey:["_field"], valueColumn: "_value")
	`;

  let data = [];
  const queryApi = influx.getQueryApi(org);

  return new Promise((resolve, reject) => {
    queryApi.queryRows(fluxQuery, {
      next: (row, tableMeta) => {
        const outputData = tableMeta.toObject(row);

        data.push({
          timestamp: outputData['_time'],
          Benzene: outputData['Benzene'],
          CO2: outputData['CO2'],
          Dust: outputData['Dust'],
          NH3: outputData['NH3'],
          humidity: outputData['humidity'],
          latitude: outputData['latitude'],
          longitude: outputData['longitude'],
		      temperature: outputData['temperature']
        });
      },
      error: (error) => {
        console.error("/metricsLastDay ", error);
        reject(error);
      },
      complete: () => {
        resolve(data);
        console.log('\nQueryRows SUCCESS');
      },
    });
  });

}

export async function getDataFromBucketForModel(bucketName, range, measurement, org) {

  const fluxQuery = `from(bucket:"${bucketName}") |> range(start: -${range}) |> filter(fn: (r) => r["_measurement"] == "${measurement}") |> pivot(rowKey:["_time"], columnKey:["_field"], valueColumn: "_value")`;

  let data = [];
  const queryApi = influx.getQueryApi(org);

  return new Promise((resolve, reject) => {
    queryApi.queryRows(fluxQuery, {
      next: (row, tableMeta) => {
        const outputData = tableMeta.toObject(row);

        data.push({
          sensor_id: outputData['sensor_id'],
          lat: outputData['lat'],
          lon: outputData['lon'],
          pm10: outputData['pm10'],
          pm25: outputData['pm25'],
          temperature: outputData['temperature'],
          humidity: outputData['humidity'],
          timestamp: outputData['_time']
        });
      },
      error: (error) => {
        console.error("/metricsLastDay ", error);
        reject(error);
      },
      complete: () => {
        resolve(data);
        console.log('\nQueryRows SUCCESS');
      },
    });
  });

}