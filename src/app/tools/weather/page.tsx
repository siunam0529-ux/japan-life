"use client";

import { ArrowLeft, CloudSun, MapPin, Umbrella } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserSettings } from "@/hooks/useUserSettings";
import { fetchWeatherForecast, getWeatherDescription, getWeatherLocation, getWeatherLocationName } from "@/lib/weather";
import type { WeatherForecast } from "@/types/weather";

const copy = {
  "zh-CN": {
    back: "返回",
    error: "暂时无法读取天气，请稍后再试。",
    noRegion: "设置地区后可查看未来 7 天天气。",
    precipitation: "降水",
    setup: "设置地区",
    subtitle: "根据你设置的地区显示未来 7 天天气。",
    title: "7天天气",
  },
  "zh-TW": {
    back: "返回",
    error: "暫時無法讀取天氣，請稍後再試。",
    noRegion: "設定地區後可查看未來 7 天天氣。",
    precipitation: "降水",
    setup: "設定地區",
    subtitle: "根據你設定的地區顯示未來 7 天天氣。",
    title: "7天天氣",
  },
  ja: {
    back: "戻る",
    error: "天気を読み込めません。しばらくしてから再度お試しください。",
    noRegion: "地域を設定すると7日間の天気を確認できます。",
    precipitation: "降水",
    setup: "地域を設定",
    subtitle: "設定した地域の7日間天気を表示します。",
    title: "7日間天気",
  },
} as const;

export default function WeatherPage() {
  const { language } = useLanguage();
  const { settings } = useUserSettings();
  const text = copy[language];
  const location = getWeatherLocation(settings?.region, settings?.areaId);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setForecast(null);
    setError(false);
    if (!location) return;
    fetchWeatherForecast(location)
      .then((result) => {
        if (!cancelled) setForecast(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [location?.id]);

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 pb-8 pt-5 shadow-2xl shadow-stone-300/40">
        <header className="mb-4 flex items-center justify-between">
          <Link className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-stone-600 shadow-sm" href="/">
            <ArrowLeft className="h-4 w-4" />
            {text.back}
          </Link>
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800">Japan Life</span>
        </header>

        <section className="rounded-[28px] bg-emerald-800 p-5 text-white shadow-[0_18px_45px_rgba(18,93,70,0.22)]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/85 text-[#2563EB] shadow-sm">
              <CloudSun className="h-5 w-5" />
            </span>
            <h1 className="text-3xl font-black">{text.title}</h1>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-50">{text.subtitle}</p>
          {location && <p className="mt-3 inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50/85 px-3 py-1.5 text-xs font-black text-[#2563EB] shadow-sm"><MapPin className="h-3.5 w-3.5" />{getWeatherLocationName(location, language)}</p>}
        </section>

        {!location ? (
          <section className="mt-4 rounded-[24px] bg-white p-5 shadow-sm">
            <p className="text-sm font-bold leading-6 text-stone-600">{text.noRegion}</p>
            <Link className="mt-4 inline-flex rounded-2xl bg-emerald-800 px-4 py-3 text-sm font-black text-white" href="/onboarding">
              {text.setup}
            </Link>
          </section>
        ) : error ? (
          <section className="mt-4 rounded-[24px] bg-white p-5 text-sm font-black text-stone-600 shadow-sm">{text.error}</section>
        ) : (
          <section className="mt-4 grid gap-3">
            {(forecast?.daily ?? []).slice(0, 7).map((day, index) => (
              <article className="rounded-[22px] bg-white p-4 shadow-sm" key={day.date}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-emerald-700">{index === 0 ? text.title : formatDayLabel(day.date, language)}</p>
                    <h2 className="mt-1 text-lg font-black">{formatDateLabel(day.date)}</h2>
                    <p className="mt-1 text-xs font-bold text-stone-500">{getWeatherDescription(day.weatherCode, language)}</p>
                  </div>
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${day.precipitationProbability >= 60 ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700"}`}>
                    {day.precipitationProbability >= 60 ? <Umbrella className="h-6 w-6" /> : <CloudSun className="h-6 w-6" />}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-stone-50 px-3 py-2">
                    <p className="text-[10px] font-black text-stone-400">TEMP</p>
                    <p className="mt-1 text-lg font-black">{Math.round(day.maxTemperature)}° / {Math.round(day.minTemperature)}°</p>
                  </div>
                  <div className="rounded-2xl bg-stone-50 px-3 py-2">
                    <p className="text-[10px] font-black text-stone-400">{text.precipitation}</p>
                    <p className="mt-1 text-lg font-black">{day.precipitationProbability}%</p>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function formatDateLabel(date: string) {
  return date.slice(5).replace("-", "/");
}

function formatDayLabel(date: string, language: "zh-CN" | "zh-TW" | "ja") {
  const day = new Date(`${date}T00:00:00+09:00`).getDay();
  const labels = {
    "zh-CN": ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
    "zh-TW": ["週日", "週一", "週二", "週三", "週四", "週五", "週六"],
    ja: ["日", "月", "火", "水", "木", "金", "土"],
  } as const;
  return labels[language][day];
}
