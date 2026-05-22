export type WeatherDailyItem = {
  date: string;
  maxTemperature: number;
  minTemperature: number;
  precipitationProbability: number;
  weatherCode: number;
};

export type WeatherForecast = {
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
