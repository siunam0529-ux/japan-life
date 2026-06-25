import { NextResponse } from "next/server";
import { fetchWeatherForecast } from "@/lib/weather";
import type { WeatherLocation } from "@/types/weather";

export const dynamic = "force-dynamic";

const fallbackName = {
  "zh-CN": "当前位置",
  "zh-TW": "目前位置",
  ja: "現在地",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = Number(url.searchParams.get("latitude"));
  const longitude = Number(url.searchParams.get("longitude"));
  const id = (url.searchParams.get("id") || "weather-location").slice(0, 80);

  if (!isValidCoordinate(latitude, longitude)) {
    return NextResponse.json({ error: "Invalid weather coordinates." }, { status: 400 });
  }

  try {
    const forecast = await fetchWeatherForecast({
      id,
      latitude,
      longitude,
      name: fallbackName,
    } satisfies WeatherLocation);
    return NextResponse.json(forecast);
  } catch (error) {
    console.warn("[api:weather] forecast failed", error);
    return NextResponse.json({ error: "Weather forecast is temporarily unavailable." }, { status: 502 });
  }
}

function isValidCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}
