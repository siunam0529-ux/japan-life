"use client";

import { CloudRain, CloudSun, Droplets, Leaf, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserSettings } from "@/hooks/useUserSettings";
import { fetchWeatherForecast, getWeatherDescription, getWeatherLocationFromSettings, getWeatherLocationName } from "@/lib/weather";
import type { WeatherForecast } from "@/types/weather";

const copy = {
  "zh-CN": {
    air: "空气良",
    dateLabel: "5月22日",
    error: "暂时无法读取天气",
    humidity: "湿度",
    noRegion: "设置地区后可查看天气",
    precipitation: "降水",
    lunar: "农历 四月十五",
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
    air: "空氣良",
    dateLabel: "5月22日",
    error: "暫時無法讀取天氣",
    humidity: "濕度",
    noRegion: "設定地區後可查看天氣",
    precipitation: "降水",
    lunar: "農曆 四月十五",
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
    air: "空気 良",
    dateLabel: "5月22日",
    error: "天気を読み込めません",
    humidity: "湿度",
    noRegion: "地域を設定すると天気を確認できます",
    precipitation: "降水",
    lunar: "旧暦 四月十五",
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
  const text = copy[language];
  const location = getWeatherLocationFromSettings(settings);
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

  if (!location) {
    return (
      <Link href="/onboarding" className="block rounded-[32px] border border-white/60 bg-white/75 p-5 shadow-[0_22px_55px_rgba(37,99,235,0.14)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-black leading-tight text-[#64748B]">{text.title}</p>
          <MapPin className="h-4 w-4 text-[#2563EB]" />
        </div>
        <p className="mt-3 text-lg font-black leading-6 text-[#0F172A]">{text.noRegion}</p>
      </Link>
    );
  }

  const precipitation = today?.precipitationProbability ?? 10;
  const maxTemperature = Math.round(today?.maxTemperature ?? 23);
  const minTemperature = Math.round(today?.minTemperature ?? 18);
  const weatherText = today ? getWeatherDescription(today.weatherCode, language) : language === "ja" ? "晴れ" : "晴";
  const isRainy = precipitation >= 60;

  return (
    <Link
      href="/tools/weather"
      data-weather-hero="true"
      className="relative block h-[188px] overflow-hidden rounded-[28px] border-0 shadow-[0_20px_50px_rgba(37,99,235,0.12)] transition-all duration-300 hover:-translate-y-0.5"
    >
      <Image
        alt=""
        className="absolute inset-0 z-0 scale-[1.045] object-cover"
        fill
        priority
        quality={100}
        sizes="(max-width: 430px) 100vw, 430px"
        src="/images/weather-hero-bg.png"
        style={{ objectPosition: "center 46%" }}
      />
      <div className="relative z-10 grid h-full grid-cols-[1fr_148px] gap-3 p-4">
        <div className="flex min-w-0 flex-col justify-center">
          <div className="flex items-start gap-3">
            <span className="mt-7 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-300/25 text-[#F59E0B]">
              {isRainy ? <CloudRain className="h-6 w-6 text-[#2563EB]" /> : <CloudSun className="h-7 w-7" />}
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#0F172A]">
              {getWeatherLocationName(location, language)}
              <MapPin className="h-3.5 w-3.5 text-[#2563EB]" />
            </p>
              <p className="mt-1 text-[48px] font-bold leading-none tracking-tight text-[#0F172A]">{maxTemperature}<span className="align-top text-2xl">°</span></p>
              <p className="mt-1 text-[12px] font-bold text-[#64748B]">{weatherText} · {text.humidity} 45%</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start justify-center pl-1">
          <div className="mb-4">
            <p className="text-[12px] font-bold text-[#0F172A]">{text.dateLabel}</p>
            <p className="mt-1 text-[10px] font-bold text-[#64748B]">{text.lunar}</p>
          </div>
          <div className="flex flex-col items-start gap-2">
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/70 px-3 py-2 text-[10px] font-bold text-[#2563EB] shadow-sm backdrop-blur">
              <Droplets className="h-3.5 w-3.5" />
              {text.precipitation} {precipitation}%
            </span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/70 px-3 py-2 text-[10px] font-bold text-[#22C55E] shadow-sm backdrop-blur">
              <Leaf className="h-3.5 w-3.5" />
              {text.air}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
