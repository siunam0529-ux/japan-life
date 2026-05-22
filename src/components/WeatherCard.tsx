"use client";

import { CloudSun, MapPin, Umbrella } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useGarbageSchedule } from "@/hooks/useGarbageSchedule";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserSettings } from "@/hooks/useUserSettings";
import { getGarbageForDate } from "@/lib/calendar/garbageSchedule";
import { fetchWeatherForecast, getWeatherDescription, getWeatherLocation, getWeatherLocationName } from "@/lib/weather";
import type { WeatherForecast } from "@/types/weather";

const copy = {
  "zh-CN": {
    error: "暂时无法读取天气",
    noRegion: "设置地区后可查看天气",
    precipitation: "降水",
    title: "今日天气",
    tips: {
      clearWeekend: "周末天气不错，适合安排采购或散步。",
      cold: "今天较冷，注意保暖。",
      coldMorning: "早晚偏冷，薄外套会很有用。",
      consecutiveRain: "接下来雨天偏多，洗衣和买菜可以提前安排。",
      default: "今天没有特别天气提醒。",
      garbageRain: "明天可能下雨，建议今晚提前准备垃圾。",
      hot: "今天较热，注意补水。",
      hotAndRain: "又热又可能下雨，伞和水都别忘。",
      largeTemperatureGap: "今天温差比较大，出门穿搭留点余地。",
      rain: "明天可能下雨，出门记得带伞。",
      todayRain: "今天有降水概率，出门前看一眼伞。",
      windyRain: "雨天出行可能不太舒服，通勤时间可以留宽一点。",
    },
  },
  "zh-TW": {
    error: "暫時無法讀取天氣",
    noRegion: "設定地區後可查看天氣",
    precipitation: "降水",
    title: "今日天氣",
    tips: {
      clearWeekend: "週末天氣不錯，適合安排採買或散步。",
      cold: "今天較冷，注意保暖。",
      coldMorning: "早晚偏冷，薄外套會很有用。",
      consecutiveRain: "接下來雨天偏多，洗衣和買菜可以提前安排。",
      default: "今天沒有特別天氣提醒。",
      garbageRain: "明天可能下雨，建議今晚提前準備垃圾。",
      hot: "今天較熱，注意補水。",
      hotAndRain: "又熱又可能下雨，雨傘和水都別忘。",
      largeTemperatureGap: "今天溫差比較大，出門穿搭留點餘地。",
      rain: "明天可能下雨，出門記得帶傘。",
      todayRain: "今天有降水機率，出門前看一眼雨傘。",
      windyRain: "雨天出行可能不太舒服，通勤時間可以留寬一點。",
    },
  },
  ja: {
    error: "天気を読み込めません",
    noRegion: "地域を設定すると天気を確認できます",
    precipitation: "降水",
    title: "今日の天気",
    tips: {
      clearWeekend: "週末は天気が良さそうです。買い出しや散歩に向いています。",
      cold: "今日は寒めです。暖かくして出かけましょう。",
      coldMorning: "朝晩は冷えそうです。薄手の上着があると安心です。",
      consecutiveRain: "雨の日が続きそうです。洗濯や買い物は早めが安心です。",
      default: "今日は特別な天気リマインダーはありません。",
      garbageRain: "明日は雨の可能性があります。今夜のうちにごみ出し準備をしておくと安心です。",
      hot: "今日は暑めです。水分補給を忘れずに。",
      hotAndRain: "暑さと雨の両方に注意。傘と飲み物を忘れずに。",
      largeTemperatureGap: "今日は寒暖差が大きめです。調整しやすい服装がおすすめです。",
      rain: "明日は雨の可能性があります。傘を忘れずに。",
      todayRain: "今日は雨の可能性があります。出かける前に傘を確認しましょう。",
      windyRain: "雨の日の移動は少し大変かも。通勤時間に余裕を持つと安心です。",
    },
  },
} as const;

export function WeatherCard() {
  const { language } = useLanguage();
  const { settings } = useUserSettings();
  const { loaded: garbageLoaded, rules } = useGarbageSchedule();
  const text = copy[language];
  const location = getWeatherLocation(settings?.region, settings?.areaId);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    setForecast(null);
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

  const today = forecast?.daily[0];
  const tomorrow = forecast?.daily[1];
  const hasTomorrowGarbage = useMemo(() => {
    if (!tomorrow || !garbageLoaded) return false;
    return getGarbageForDate(new Date(`${tomorrow.date}T00:00:00+09:00`), rules).length > 0;
  }, [garbageLoaded, rules, tomorrow]);

  const tip = useMemo(() => {
    if (!today) return text.tips.default;
    const todayRain = today.precipitationProbability >= 60;
    const tomorrowRain = (tomorrow?.precipitationProbability ?? 0) >= 60;
    const dayAfterTomorrowRain = (forecast?.daily[2]?.precipitationProbability ?? 0) >= 60;
    const temperatureGap = today.maxTemperature - today.minTemperature;
    const weekend = new Date(`${today.date}T00:00:00+09:00`).getDay();
    if (tomorrowRain && hasTomorrowGarbage) return text.tips.garbageRain;
    if (todayRain && today.maxTemperature >= 28) return text.tips.hotAndRain;
    if (todayRain && tomorrowRain && dayAfterTomorrowRain) return text.tips.consecutiveRain;
    if (todayRain) return text.tips.todayRain;
    if (tomorrowRain) return text.tips.rain;
    if (today.maxTemperature >= 30) return text.tips.hot;
    if (today.minTemperature <= 5) return text.tips.cold;
    if (today.minTemperature <= 10 && today.maxTemperature >= 18) return text.tips.coldMorning;
    if (temperatureGap >= 10) return text.tips.largeTemperatureGap;
    if ((weekend === 0 || weekend === 6) && today.precipitationProbability <= 30 && today.maxTemperature >= 12 && today.maxTemperature <= 28) return text.tips.clearWeekend;
    return text.tips.default;
  }, [forecast?.daily, hasTomorrowGarbage, text, today, tomorrow]);

  if (!location) {
    return (
      <Link href="/onboarding" className="block h-full rounded-[16px] border border-stone-200/70 bg-white p-3 shadow-[0_7px_18px_rgba(32,38,34,0.06)]">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-black leading-tight text-stone-500">{text.title}</p>
          <MapPin className="h-4 w-4 text-stone-400" />
        </div>
        <p className="mt-3 text-sm font-black leading-5 text-emerald-800">{text.noRegion}</p>
      </Link>
    );
  }

  return (
    <Link href="/tools/weather" className="block h-full rounded-[16px] border border-stone-200/70 bg-white p-3 shadow-[0_7px_18px_rgba(32,38,34,0.06)] transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-black leading-tight text-stone-500">{text.title}</p>
          <p className="mt-1 truncate text-[10px] font-black text-emerald-800">{getWeatherLocationName(location, language)}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
          {(tomorrow?.precipitationProbability ?? 0) >= 60 ? <Umbrella className="h-5 w-5" /> : <CloudSun className="h-5 w-5" />}
        </span>
      </div>

      {error ? (
        <p className="mt-3 text-sm font-black text-stone-600">{text.error}</p>
      ) : today ? (
        <>
          <div className="mt-2 flex items-end justify-between gap-2">
            <p className="text-[22px] font-black leading-none text-emerald-800">{Math.round(today.maxTemperature)}°<span className="text-sm text-stone-400">/{Math.round(today.minTemperature)}°</span></p>
            <p className="text-right text-[10px] font-black text-stone-500">{getWeatherDescription(today.weatherCode, language)}<br />{text.precipitation} {today.precipitationProbability}%</p>
          </div>
          <p className="mt-2 max-h-8 overflow-hidden text-[10px] font-bold leading-4 text-stone-500">{tip}</p>
        </>
      ) : (
        <p className="mt-3 text-sm font-black text-stone-600">{getWeatherLocationName(location, language)}</p>
      )}
    </Link>
  );
}
