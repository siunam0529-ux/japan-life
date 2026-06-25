import type { Region } from "@/hooks/useUserSettings";
import type { Language } from "@/lib/i18n/translations";
import type { WeatherAirQuality, WeatherCurrent, WeatherDailyItem, WeatherForecast, WeatherLocation } from "@/types/weather";

type WeatherSettingsLocation = {
  region?: Region | null;
  areaId?: string | null;
  regionSource?: "manual" | "geolocation" | null;
  location?: {
    city: string;
    latitude: number;
    longitude: number;
    prefecture: string;
  } | null;
};

const weatherRequestTimeoutMs = 2000;

type FetchWeatherForecastOptions = {
  forceRefresh?: boolean;
  timeoutMs?: number;
};

type OpenMeteoDaily = {
  apparent_temperature_max?: number[];
  apparent_temperature_min?: number[];
  daylight_duration?: number[];
  time?: string[];
  weather_code?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_probability_max?: number[];
  precipitation_sum?: number[];
  rain_sum?: number[];
  showers_sum?: number[];
  snowfall_sum?: number[];
  sunshine_duration?: number[];
  sunrise?: string[];
  sunset?: string[];
  uv_index_max?: number[];
  wind_direction_10m_dominant?: number[];
  wind_gusts_10m_max?: number[];
  wind_speed_10m_max?: number[];
};

type OpenMeteoCurrent = {
  apparent_temperature?: number;
  cloud_cover?: number;
  interval?: number;
  is_day?: number;
  precipitation?: number;
  pressure_msl?: number;
  rain?: number;
  relative_humidity_2m?: number;
  showers?: number;
  snowfall?: number;
  temperature_2m?: number;
  time?: string;
  weather_code?: number;
  wind_direction_10m?: number;
  wind_gusts_10m?: number;
  wind_speed_10m?: number;
};

type OpenMeteoResponse = {
  current?: OpenMeteoCurrent;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  daily?: OpenMeteoDaily;
};

type OpenMeteoAirQualityHourly = {
  aerosol_optical_depth?: number[];
  carbon_monoxide?: number[];
  european_aqi?: number[];
  nitrogen_dioxide?: number[];
  ozone?: number[];
  pm10?: number[];
  pm2_5?: number[];
  sulphur_dioxide?: number[];
  time?: string[];
  us_aqi?: number[];
};

type OpenMeteoAirQualityResponse = {
  hourly?: OpenMeteoAirQualityHourly;
};

type JmaForecastResponse = Array<{
  publishingOffice?: string;
  reportDatetime?: string;
  timeSeries?: Array<{
    areas?: Array<{
      area?: {
        code?: string;
        name?: string;
      };
      pops?: string[];
      temps?: string[];
      weatherCodes?: string[];
      weathers?: string[];
    }>;
    timeDefines?: string[];
  }>;
}>;

export const weatherLocations: Record<Region, WeatherLocation | null> = {
  tokyo: { id: "tokyo", name: { "zh-CN": "东京", "zh-TW": "東京", ja: "東京" }, latitude: 35.6938, longitude: 139.7034 },
  osaka: { id: "osaka", name: { "zh-CN": "大阪", "zh-TW": "大阪", ja: "大阪" }, latitude: 34.6937, longitude: 135.5023 },
  kyoto: { id: "kyoto", name: { "zh-CN": "京都", "zh-TW": "京都", ja: "京都" }, latitude: 35.0116, longitude: 135.7681 },
  fukuoka: { id: "fukuoka", name: { "zh-CN": "福冈", "zh-TW": "福岡", ja: "福岡" }, latitude: 33.5902, longitude: 130.4017 },
  other: null,
};

export const tokyoWeatherAreaOptions: WeatherLocation[] = [
  weatherLocations.tokyo,
  { id: "chiyoda", name: { "zh-CN": "千代田区", "zh-TW": "千代田區", ja: "千代田区" }, latitude: 35.6940, longitude: 139.7536 },
  { id: "chuo", name: { "zh-CN": "中央区", "zh-TW": "中央區", ja: "中央区" }, latitude: 35.6706, longitude: 139.7720 },
  { id: "minato", name: { "zh-CN": "港区", "zh-TW": "港區", ja: "港区" }, latitude: 35.6581, longitude: 139.7516 },
  { id: "shinjuku", name: { "zh-CN": "新宿区", "zh-TW": "新宿區", ja: "新宿区" }, latitude: 35.6938, longitude: 139.7034 },
  { id: "bunkyo", name: { "zh-CN": "文京区", "zh-TW": "文京區", ja: "文京区" }, latitude: 35.7080, longitude: 139.7522 },
  { id: "taito", name: { "zh-CN": "台东区", "zh-TW": "台東區", ja: "台東区" }, latitude: 35.7126, longitude: 139.7800 },
  { id: "sumida", name: { "zh-CN": "墨田区", "zh-TW": "墨田區", ja: "墨田区" }, latitude: 35.7107, longitude: 139.8015 },
  { id: "koto", name: { "zh-CN": "江东区", "zh-TW": "江東區", ja: "江東区" }, latitude: 35.6728, longitude: 139.8174 },
  { id: "shinagawa", name: { "zh-CN": "品川区", "zh-TW": "品川區", ja: "品川区" }, latitude: 35.6092, longitude: 139.7301 },
  { id: "meguro", name: { "zh-CN": "目黑区", "zh-TW": "目黑區", ja: "目黒区" }, latitude: 35.6415, longitude: 139.6982 },
  { id: "ota", name: { "zh-CN": "大田区", "zh-TW": "大田區", ja: "大田区" }, latitude: 35.5613, longitude: 139.7160 },
  { id: "setagaya", name: { "zh-CN": "世田谷区", "zh-TW": "世田谷區", ja: "世田谷区" }, latitude: 35.6466, longitude: 139.6532 },
  { id: "shibuya", name: { "zh-CN": "涩谷区", "zh-TW": "澀谷區", ja: "渋谷区" }, latitude: 35.6618, longitude: 139.7041 },
  { id: "nakano", name: { "zh-CN": "中野区", "zh-TW": "中野區", ja: "中野区" }, latitude: 35.7074, longitude: 139.6638 },
  { id: "suginami", name: { "zh-CN": "杉并区", "zh-TW": "杉並區", ja: "杉並区" }, latitude: 35.6995, longitude: 139.6364 },
  { id: "toshima", name: { "zh-CN": "丰岛区", "zh-TW": "豐島區", ja: "豊島区" }, latitude: 35.7261, longitude: 139.7166 },
  { id: "kita", name: { "zh-CN": "北区", "zh-TW": "北區", ja: "北区" }, latitude: 35.7528, longitude: 139.7336 },
  { id: "arakawa", name: { "zh-CN": "荒川区", "zh-TW": "荒川區", ja: "荒川区" }, latitude: 35.7362, longitude: 139.7834 },
  { id: "itabashi", name: { "zh-CN": "板桥区", "zh-TW": "板橋區", ja: "板橋区" }, latitude: 35.7512, longitude: 139.7093 },
  { id: "nerima", name: { "zh-CN": "练马区", "zh-TW": "練馬區", ja: "練馬区" }, latitude: 35.7356, longitude: 139.6517 },
  { id: "adachi", name: { "zh-CN": "足立区", "zh-TW": "足立區", ja: "足立区" }, latitude: 35.7750, longitude: 139.8044 },
  { id: "katsushika", name: { "zh-CN": "葛饰区", "zh-TW": "葛飾區", ja: "葛飾区" }, latitude: 35.7434, longitude: 139.8472 },
  { id: "edogawa", name: { "zh-CN": "江户川区", "zh-TW": "江戶川區", ja: "江戸川区" }, latitude: 35.7066, longitude: 139.8682 },
].filter(Boolean) as WeatherLocation[];

export function getWeatherLocation(region: Region | undefined | null, areaId?: string | null) {
  const tokyoArea = getTokyoWeatherAreaLocation(areaId);
  if (tokyoArea) return tokyoArea;
  if (!region) return null;
  return weatherLocations[region] ?? null;
}

export function getWeatherLocationFromSettings(settings: WeatherSettingsLocation | null | undefined) {
  if (!settings) return null;
  const selectedAreaLocation = getWeatherLocation(settings.region, settings.areaId);
  if (settings.regionSource === "manual" && selectedAreaLocation) {
    return selectedAreaLocation;
  }

  const resolvedLocation = settings.location;
  if (resolvedLocation && isValidCoordinate(resolvedLocation.latitude, resolvedLocation.longitude)) {
    const cityName = resolvedLocation.city || resolvedLocation.prefecture;
    const fallbackName = selectedAreaLocation?.name ?? {
      "zh-CN": "当前位置",
      "zh-TW": "目前位置",
      ja: "現在地",
    };

    return {
      id: `geo:${resolvedLocation.latitude.toFixed(3)},${resolvedLocation.longitude.toFixed(3)}`,
      latitude: resolvedLocation.latitude,
      longitude: resolvedLocation.longitude,
      name: cityName
        ? {
            "zh-CN": cityName,
            "zh-TW": cityName,
            ja: cityName,
          }
        : fallbackName,
    } satisfies WeatherLocation;
  }

  return selectedAreaLocation;
}

function getTokyoWeatherAreaLocation(areaId?: string | null) {
  if (!areaId) return null;
  return tokyoWeatherAreaOptions.find((item) => item.id === areaId) ?? null;
}

export function getWeatherLocationName(location: WeatherLocation, language: Language) {
  return location.name[language];
}

export async function fetchWeatherForecast(location: WeatherLocation, options: FetchWeatherForecastOptions = {}): Promise<WeatherForecast> {
  const timeoutMs = options.timeoutMs ?? weatherRequestTimeoutMs;

  if (typeof window !== "undefined") {
    return fetchWeatherForecastFromAppApi(location, timeoutMs);
  }

  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "apparent_temperature_max",
      "apparent_temperature_min",
      "sunrise",
      "sunset",
      "daylight_duration",
      "sunshine_duration",
      "uv_index_max",
      "precipitation_sum",
      "rain_sum",
      "showers_sum",
      "snowfall_sum",
      "precipitation_probability_max",
      "wind_speed_10m_max",
      "wind_gusts_10m_max",
      "wind_direction_10m_dominant",
    ].join(","),
    timezone: "Asia/Tokyo",
  });
  let forecastResponse: Response;
  let airQualityResponse: WeatherAirQuality | null = null;
  try {
    [forecastResponse, airQualityResponse] = await Promise.all([
      fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, timeoutMs),
      fetchAirQuality(location, timeoutMs),
    ]);
  } catch (error) {
    return fetchJmaForecastFallback(location, error instanceof Error ? error.message : "Open-Meteo timeout");
  }
  if (!forecastResponse.ok) return fetchJmaForecastFallback(location, `Open-Meteo HTTP ${forecastResponse.status}`);
  const data = normalizeWeatherResponse(await forecastResponse.json(), airQualityResponse);
  return data;
}

async function fetchWeatherForecastFromAppApi(location: WeatherLocation, timeoutMs: number) {
  const params = new URLSearchParams({
    id: location.id,
    latitude: String(location.latitude),
    longitude: String(location.longitude),
  });
  const response = await fetchWithTimeout(`/api/weather/forecast/?${params.toString()}`, timeoutMs + 1000, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Weather API HTTP ${response.status}`);
  return await response.json() as WeatherForecast;
}

export function getWeatherDescription(code: number, language: Language) {
  if (code === 0) return { "zh-CN": "晴", "zh-TW": "晴", ja: "晴れ" }[language];
  if ([1, 2, 3].includes(code)) return { "zh-CN": "多云", "zh-TW": "多雲", ja: "くもり" }[language];
  if ([45, 48].includes(code)) return { "zh-CN": "有雾", "zh-TW": "有霧", ja: "霧" }[language];
  if ([51, 53, 55, 56, 57].includes(code)) return { "zh-CN": "毛毛雨", "zh-TW": "毛毛雨", ja: "霧雨" }[language];
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { "zh-CN": "有雨", "zh-TW": "有雨", ja: "雨" }[language];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { "zh-CN": "有雪", "zh-TW": "有雪", ja: "雪" }[language];
  if ([95, 96, 99].includes(code)) return { "zh-CN": "雷雨", "zh-TW": "雷雨", ja: "雷雨" }[language];
  return { "zh-CN": "天气变化", "zh-TW": "天氣變化", ja: "天気変化" }[language];
}

async function fetchAirQuality(location: WeatherLocation, timeoutMs = weatherRequestTimeoutMs): Promise<WeatherAirQuality | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      hourly: "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,aerosol_optical_depth,us_aqi,european_aqi",
      timezone: "Asia/Tokyo",
      forecast_days: "1",
    });
    const response = await fetchWithTimeout(`https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`, timeoutMs);
    if (!response.ok) return null;
    return normalizeAirQualityResponse(await response.json());
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJmaForecastFallback(location: WeatherLocation, reason: string): Promise<WeatherForecast> {
  const areaCode = getJmaForecastAreaCode(location);
  if (!areaCode) throw new Error(reason);

  const response = await fetch(`https://www.jma.go.jp/bosai/forecast/data/forecast/${areaCode}.json`, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) throw new Error(`${reason}; JMA HTTP ${response.status}`);
  return normalizeJmaForecastResponse(await response.json() as JmaForecastResponse, location);
}

function getJmaForecastAreaCode(location: WeatherLocation) {
  const { latitude, longitude } = location;
  if (isInside(latitude, longitude, 35.45, 35.95, 139.2, 140.05)) return "130000";
  if (isInside(latitude, longitude, 34.45, 34.9, 135.25, 135.75)) return "270000";
  if (isInside(latitude, longitude, 34.85, 35.15, 135.55, 136.0)) return "260000";
  if (isInside(latitude, longitude, 33.4, 33.8, 130.2, 130.6)) return "400000";
  if (location.id.startsWith("tokyo") || tokyoWeatherAreaOptions.some((item) => item.id === location.id)) return "130000";
  if (location.id.startsWith("osaka")) return "270000";
  if (location.id.startsWith("kyoto")) return "260000";
  if (location.id.startsWith("fukuoka")) return "400000";
  return null;
}

function normalizeJmaForecastResponse(data: JmaForecastResponse, location: WeatherLocation): WeatherForecast {
  const forecast = data[0];
  const weatherSeries = forecast?.timeSeries?.find((series) => series.areas?.some((area) => Array.isArray(area.weatherCodes)));
  const popSeries = forecast?.timeSeries?.find((series) => series.areas?.some((area) => Array.isArray(area.pops)));
  const tempSeries = forecast?.timeSeries?.find((series) => series.areas?.some((area) => Array.isArray(area.temps)));
  const weatherArea = weatherSeries?.areas?.[0];
  const popArea = popSeries?.areas?.[0];
  const tempArea = tempSeries?.areas?.[0];
  const reportDatetime = forecast?.reportDatetime ?? new Date().toISOString();
  const dates = (weatherSeries?.timeDefines ?? []).slice(0, 3);
  const temps = (tempArea?.temps ?? []).map((value) => Number(value)).filter(Number.isFinite);
  const fallbackMin = temps[0] ?? 0;
  const fallbackMax = temps[1] ?? temps[0] ?? 0;
  const popValues = (popArea?.pops ?? []).map((value) => Number(value)).filter(Number.isFinite);
  const maxPop = popValues.length > 0 ? Math.max(...popValues) : 0;
  const daily = dates.map((date, index) => {
    const code = Number(weatherArea?.weatherCodes?.[index] ?? weatherArea?.weatherCodes?.[0] ?? 200);
    const maxTemperature = index === 0 ? fallbackMax : fallbackMax;
    const minTemperature = index === 0 ? fallbackMin : fallbackMin;
    return {
      apparentMaxTemperature: null,
      apparentMinTemperature: null,
      date: date.slice(0, 10),
      daylightDuration: null,
      maxTemperature,
      minTemperature,
      precipitationProbability: maxPop,
      precipitationSum: null,
      rainSum: null,
      showersSum: null,
      snowfallSum: null,
      sunshineDuration: null,
      sunrise: null,
      sunset: null,
      uvIndexMax: null,
      weatherCode: jmaCodeToOpenMeteoCode(code),
      windDirectionDominant: null,
      windGustsMax: null,
      windSpeedMax: null,
    } satisfies WeatherDailyItem;
  });

  return {
    airQuality: null,
    current: {
      apparentTemperature: null,
      cloudCover: null,
      interval: null,
      isDay: null,
      precipitation: null,
      pressureMsl: null,
      rain: null,
      relativeHumidity: null,
      showers: null,
      snowfall: null,
      temperature: fallbackMax,
      time: reportDatetime,
      weatherCode: daily[0]?.weatherCode ?? 0,
      windDirection: null,
      windGusts: null,
      windSpeed: null,
    },
    daily,
    fetchedAt: reportDatetime,
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: "Asia/Tokyo",
  };
}

function jmaCodeToOpenMeteoCode(code: number) {
  const codeText = String(code);
  if (codeText.startsWith("1")) return 0;
  if (codeText.startsWith("2")) return 3;
  if (codeText.startsWith("3")) return 61;
  if (codeText.startsWith("4")) return 71;
  return 3;
}

function normalizeWeatherResponse(data: OpenMeteoResponse, airQuality: WeatherAirQuality | null): WeatherForecast {
  const daily = data.daily ?? {};
  const times = daily.time ?? [];
  return {
    airQuality,
    current: normalizeCurrent(data.current),
    latitude: Number(data.latitude ?? 0),
    longitude: Number(data.longitude ?? 0),
    timezone: data.timezone ?? "Asia/Tokyo",
    fetchedAt: new Date().toISOString(),
    daily: times.map((date, index) => ({
      apparentMaxTemperature: toNullableNumber(daily.apparent_temperature_max?.[index]),
      apparentMinTemperature: toNullableNumber(daily.apparent_temperature_min?.[index]),
      date,
      daylightDuration: toNullableNumber(daily.daylight_duration?.[index]),
      maxTemperature: Number(daily.temperature_2m_max?.[index] ?? 0),
      minTemperature: Number(daily.temperature_2m_min?.[index] ?? 0),
      precipitationProbability: Number(daily.precipitation_probability_max?.[index] ?? 0),
      precipitationSum: toNullableNumber(daily.precipitation_sum?.[index]),
      rainSum: toNullableNumber(daily.rain_sum?.[index]),
      showersSum: toNullableNumber(daily.showers_sum?.[index]),
      snowfallSum: toNullableNumber(daily.snowfall_sum?.[index]),
      sunshineDuration: toNullableNumber(daily.sunshine_duration?.[index]),
      sunrise: daily.sunrise?.[index] ?? null,
      sunset: daily.sunset?.[index] ?? null,
      uvIndexMax: toNullableNumber(daily.uv_index_max?.[index]),
      weatherCode: Number(daily.weather_code?.[index] ?? 0),
      windDirectionDominant: toNullableNumber(daily.wind_direction_10m_dominant?.[index]),
      windGustsMax: toNullableNumber(daily.wind_gusts_10m_max?.[index]),
      windSpeedMax: toNullableNumber(daily.wind_speed_10m_max?.[index]),
    })),
  };
}

function normalizeCurrent(current: OpenMeteoCurrent | undefined): WeatherCurrent | null {
  if (!current) return null;
  return {
    apparentTemperature: toNullableNumber(current.apparent_temperature),
    cloudCover: toNullableNumber(current.cloud_cover),
    interval: toNullableNumber(current.interval),
    isDay: toNullableNumber(current.is_day),
    precipitation: toNullableNumber(current.precipitation),
    pressureMsl: toNullableNumber(current.pressure_msl),
    rain: toNullableNumber(current.rain),
    relativeHumidity: toNullableNumber(current.relative_humidity_2m),
    showers: toNullableNumber(current.showers),
    snowfall: toNullableNumber(current.snowfall),
    temperature: toNullableNumber(current.temperature_2m),
    time: current.time ?? null,
    weatherCode: toNullableNumber(current.weather_code),
    windDirection: toNullableNumber(current.wind_direction_10m),
    windGusts: toNullableNumber(current.wind_gusts_10m),
    windSpeed: toNullableNumber(current.wind_speed_10m),
  };
}

function normalizeAirQualityResponse(data: OpenMeteoAirQualityResponse): WeatherAirQuality | null {
  const hourly = data.hourly;
  const time = hourly?.time?.[0] ?? null;
  if (!hourly || !time) return null;
  return {
    aerosolOpticalDepth: toNullableNumber(hourly.aerosol_optical_depth?.[0]),
    carbonMonoxide: toNullableNumber(hourly.carbon_monoxide?.[0]),
    europeanAqi: toNullableNumber(hourly.european_aqi?.[0]),
    nitrogenDioxide: toNullableNumber(hourly.nitrogen_dioxide?.[0]),
    ozone: toNullableNumber(hourly.ozone?.[0]),
    pm10: toNullableNumber(hourly.pm10?.[0]),
    pm25: toNullableNumber(hourly.pm2_5?.[0]),
    sulphurDioxide: toNullableNumber(hourly.sulphur_dioxide?.[0]),
    time,
    usAqi: toNullableNumber(hourly.us_aqi?.[0]),
  };
}

function toNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isValidCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function isInside(latitude: number, longitude: number, minLat: number, maxLat: number, minLon: number, maxLon: number) {
  return latitude >= minLat && latitude <= maxLat && longitude >= minLon && longitude <= maxLon;
}
