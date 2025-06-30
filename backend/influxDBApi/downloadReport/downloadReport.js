import dayjs from 'dayjs';

// подаваме данните за последните 30 дни от базата от данни и то ги сортира средна стойност час по час
export function groupAndAverage(data) {
  const grouped = {};

  data.forEach(entry => {
    const hour = dayjs(entry.timestamp).startOf('hour'); // запази като dayjs обект

    const hourKey = hour.format("YYYY-MM-DD HH:00");

    if (!grouped[hourKey]) {
      grouped[hourKey] = {
        count: 0,
        Benzene: 0,
        CO2: 0,
        Dust: 0,
        NH3: 0,
        humidity: 0,
        temperature: 0,
        timestamp: hour
      };
    }

    grouped[hourKey].count++;
    grouped[hourKey].Benzene += entry.Benzene;
    grouped[hourKey].CO2 += entry.CO2;
    grouped[hourKey].Dust += entry.Dust;
    grouped[hourKey].NH3 += entry.NH3;
    grouped[hourKey].humidity += entry.humidity;
    grouped[hourKey].temperature += entry.temperature;
  });

  return Object.values(grouped).map(g => ({
    timestamp: g.timestamp.toISOString(), // това ще ползваш в PDF-а
    Benzene: (g.Benzene / g.count),
    CO2: (g.CO2 / g.count),
    Dust: (g.Dust / g.count),
    NH3: (g.NH3 / g.count),
    humidity: (g.humidity / g.count),
    temperature: (g.temperature / g.count)
  }));
}