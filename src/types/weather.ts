export type WeatherDailyItem = {
  date: string;
  apparentMaxTemperature: number | null;
  apparentMinTemperature: number | null;
  daylightDuration: number | null;
  maxTemperature: number;
  minTemperature: number;
  precipitationProbability: number;
  precipitationSum: number | null;
  rainSum: number | null;
  showersSum: number | null;
  snowfallSum: number | null;
  sunshineDuration: number | null;
  sunrise: string | null;
  sunset: string | null;
  uvIndexMax: number | null;
  weatherCode: number;
  windDirectionDominant: number | null;
  windGustsMax: number | null;
  windSpeedMax: number | null;
};

export type WeatherCurrent = {
  apparentTemperature: number | null;
  cloudCover: number | null;
  interval: number | null;
  isDay: number | null;
  precipitation: number | null;
  pressureMsl: number | null;
  rain: number | null;
  relativeHumidity: number | null;
  showers: number | null;
  snowfall: number | null;
  temperature: number | null;
  time: string | null;
  weatherCode: number | null;
  windDirection: number | null;
  windGusts: number | null;
  windSpeed: number | null;
};

export type WeatherAirQuality = {
  aerosolOpticalDepth: number | null;
  carbonMonoxide: number | null;
  europeanAqi: number | null;
  nitrogenDioxide: number | null;
  ozone: number | null;
  pm10: number | null;
  pm25: number | null;
  sulphurDioxide: number | null;
  time: string | null;
  usAqi: number | null;
};

export type WeatherForecast = {
  airQuality: WeatherAirQuality | null;
  current: WeatherCurrent | null;
  latitude: number;
  longitude: number;
  timezone: string;
  daily: WeatherDailyItem[];
  fetchedAt: string;
};

export type WeatherLocation = {
  id: string;
  name: {
    "zh-CN": string;
    "zh-TW": string;
    ja: string;
  };
  latitude: number;
  longitude: number;
};
