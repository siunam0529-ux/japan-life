"use client";

import { Bell, Bike, Cloud, CloudLightning, CloudRain, CloudSun, Droplets, Eye, Gauge, Info, Leaf, MapPin, Shirt, Snowflake, Sun, Sunrise, Sunset, ThermometerSun, Umbrella, Waves, Wind } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserSettings } from "@/hooks/useUserSettings";
import { formatTokyoDateTime } from "@/lib/utils/format";
import { fetchWeatherForecast, getWeatherDescription, getWeatherLocationFromSettings, getWeatherLocationName } from "@/lib/weather";
import type { WeatherDailyItem, WeatherForecast } from "@/types/weather";

type WeatherAlertSettings = {
  rain: boolean;
  heat: boolean;
  typhoon: boolean;
  snow: boolean;
};

type Metric = {
  label: string;
  value: string;
  icon: typeof Bell;
};

type LifeAdvice = {
  description: string;
  icon: typeof Bell;
  iconClass: string;
  label: string;
  title: string;
};

const alertStorageKey = "japan-life:weather-alert-settings";
const alertSettingsChangeEvent = "japan-life:weather-alert-settings-change";

const copy = {
  "zh-CN": {
    back: "返回",
    title: "天气提醒",
    subtitle: "7 天天气 / 出门提醒",
    noRegion: "设置地区后可查看未来 7 天天气。",
    setup: "设置地区",
    error: "暂时无法读取天气，请稍后再试。",
    detectedArea: "当前 App 地区",
    future: "未来天气",
    metrics: "实时指标",
    lifeAdvice: "生活建议",
    settings: "天气提醒设置",
    appOnlyNotice: "只在 App 内生效，不会发送手机弹窗。开启后会在生活提醒中心显示对应天气提醒。",
    source: "数据来源：Open-Meteo Forecast API + Air Quality API",
    reference: "仅供生活参考，出行前请再确认实时天气和官方预警。未显示的项目代表接口当前未返回数据。",
    updatedAt: "更新时间",
    precipitationProbability: "降水概率",
    humidity: "湿度",
    feelsLike: "体感",
    currentRain: "当前降水",
    cloudCover: "云量",
    windSpeed: "风速",
    windGusts: "阵风",
    pressure: "气压",
    uvIndex: "UV 指数",
    sunrise: "日出",
    sunset: "日落",
    precipitationSum: "降水量",
    snowfall: "降雪量",
    pm25: "PM2.5",
    pm10: "PM10",
    usAqi: "US AQI",
    ozone: "臭氧",
    rainAlert: "降雨提醒",
    rainDesc: "降水概率 >= 50% 时提醒",
    heatAlert: "高温提醒",
    heatDesc: "最高气温 >= 30°C 时提醒",
    typhoonAlert: "强风雷雨提醒",
    typhoonDesc: "雷雨、强风或阵风较高时提醒",
    snowAlert: "降雪提醒",
    snowDesc: "有降雪预报时提醒",
    adviceRain: "今天可能会下雨",
    adviceRainDesc: "建议随身携带雨具，注意交通安全。",
    adviceHeat: "今天气温偏高",
    adviceHeatDesc: "注意补水，长时间外出尽量避开正午。",
    adviceStorm: "天气可能不稳定",
    adviceStormDesc: "留意官方预警，通勤和外出请预留时间。",
    adviceSnow: "可能有降雪",
    adviceSnowDesc: "注意路面湿滑，出门前确认交通状况。",
    adviceGood: "今天没有明显天气风险",
    adviceGoodDesc: "适合正常安排通勤、购物和生活行程。",
    umbrellaIndex: "带伞指数",
    umbrellaNeeded: "建议带伞",
    umbrellaMaybe: "可备折叠伞",
    umbrellaNo: "不用带伞",
    umbrellaNeededDesc: "降雨概率较高，外出前带好雨具。",
    umbrellaMaybeDesc: "有降雨可能，长时间外出建议备伞。",
    umbrellaNoDesc: "降雨概率较低，短途出门压力不大。",
    outfitAdvice: "穿衣建议",
    outfitHot: "清凉透气",
    outfitWarm: "注意保暖",
    outfitLight: "轻薄外套",
    outfitNormal: "常规穿着",
    outfitHotDesc: "体感偏热，建议选择透气衣物。",
    outfitWarmDesc: "体感偏低，早晚外出加一件。",
    outfitLightDesc: "温差或风感明显，薄外套更稳。",
    outfitNormalDesc: "体感较舒适，按日常穿着即可。",
    commuteAdvice: "出行建议",
    commuteCareful: "预留时间",
    commuteBikeNo: "不建议骑车",
    commuteBikeOk: "适合步行骑车",
    commuteCarefulDesc: "风雨较明显，通勤建议提前出门。",
    commuteBikeNoDesc: "雨天或风大，骑车体验较差。",
    commuteBikeOkDesc: "天气较稳定，短途出行较舒服。",
    airQuality: "空气质量",
    airGood: "良好",
    airNormal: "普通",
    airPoor: "偏差",
    airUnknown: "暂无数据",
    airGoodDesc: "空气质量不错，适合户外活动。",
    airNormalDesc: "空气质量一般，敏感人群适量减少久待户外。",
    airPoorDesc: "空气质量偏差，建议减少长时间户外活动。",
    airUnknownDesc: "空气质量接口暂未返回数据。",
  },
  "zh-TW": {
    back: "返回",
    title: "天氣提醒",
    subtitle: "7 天天氣 / 出門提醒",
    noRegion: "設定地區後可查看未來 7 天天氣。",
    setup: "設定地區",
    error: "暫時無法讀取天氣，請稍後再試。",
    detectedArea: "目前 App 地區",
    future: "未來天氣",
    metrics: "即時指標",
    lifeAdvice: "生活建議",
    settings: "天氣提醒設定",
    appOnlyNotice: "只在 App 內生效，不會發送手機彈窗。開啟後會在生活提醒中心顯示對應天氣提醒。",
    source: "資料來源：Open-Meteo Forecast API + Air Quality API",
    reference: "僅供生活參考，出門前請再確認即時天氣和官方預警。未顯示的項目代表接口目前未返回資料。",
    updatedAt: "更新時間",
    precipitationProbability: "降水機率",
    humidity: "濕度",
    feelsLike: "體感",
    currentRain: "目前降水",
    cloudCover: "雲量",
    windSpeed: "風速",
    windGusts: "陣風",
    pressure: "氣壓",
    uvIndex: "UV 指數",
    sunrise: "日出",
    sunset: "日落",
    precipitationSum: "降水量",
    snowfall: "降雪量",
    pm25: "PM2.5",
    pm10: "PM10",
    usAqi: "US AQI",
    ozone: "臭氧",
    rainAlert: "降雨提醒",
    rainDesc: "降水機率 >= 50% 時提醒",
    heatAlert: "高溫提醒",
    heatDesc: "最高氣溫 >= 30°C 時提醒",
    typhoonAlert: "強風雷雨提醒",
    typhoonDesc: "雷雨、強風或陣風較高時提醒",
    snowAlert: "降雪提醒",
    snowDesc: "有降雪預報時提醒",
    adviceRain: "今天可能會下雨",
    adviceRainDesc: "建議隨身攜帶雨具，注意交通安全。",
    adviceHeat: "今天氣溫偏高",
    adviceHeatDesc: "注意補水，長時間外出盡量避開中午。",
    adviceStorm: "天氣可能不穩定",
    adviceStormDesc: "留意官方預警，通勤和外出請預留時間。",
    adviceSnow: "可能有降雪",
    adviceSnowDesc: "注意路面濕滑，出門前確認交通狀況。",
    adviceGood: "今天沒有明顯天氣風險",
    adviceGoodDesc: "適合正常安排通勤、採買和生活行程。",
    umbrellaIndex: "帶傘指數",
    umbrellaNeeded: "建議帶傘",
    umbrellaMaybe: "可備折疊傘",
    umbrellaNo: "不用帶傘",
    umbrellaNeededDesc: "降雨機率較高，出門前帶好雨具。",
    umbrellaMaybeDesc: "有降雨可能，長時間外出建議備傘。",
    umbrellaNoDesc: "降雨機率較低，短途出門壓力不大。",
    outfitAdvice: "穿衣建議",
    outfitHot: "清爽透氣",
    outfitWarm: "注意保暖",
    outfitLight: "輕薄外套",
    outfitNormal: "日常穿著",
    outfitHotDesc: "體感偏熱，建議選擇透氣衣物。",
    outfitWarmDesc: "體感偏低，早晚外出加一件。",
    outfitLightDesc: "溫差或風感明顯，薄外套更穩。",
    outfitNormalDesc: "體感較舒適，按日常穿著即可。",
    commuteAdvice: "出行建議",
    commuteCareful: "預留時間",
    commuteBikeNo: "不建議騎車",
    commuteBikeOk: "適合步行騎車",
    commuteCarefulDesc: "風雨較明顯，通勤建議提前出門。",
    commuteBikeNoDesc: "雨天或風大，騎車體驗較差。",
    commuteBikeOkDesc: "天氣較穩定，短途出行較舒服。",
    airQuality: "空氣品質",
    airGood: "良好",
    airNormal: "普通",
    airPoor: "偏差",
    airUnknown: "暫無資料",
    airGoodDesc: "空氣品質不錯，適合戶外活動。",
    airNormalDesc: "空氣品質一般，敏感人群適量減少久待戶外。",
    airPoorDesc: "空氣品質偏差，建議減少長時間戶外活動。",
    airUnknownDesc: "空氣品質接口暫未返回資料。",
  },
  ja: {
    back: "戻る",
    title: "天気リマインダー",
    subtitle: "7日間天気 / 外出前チェック",
    noRegion: "地域を設定すると7日間の天気を確認できます。",
    setup: "地域を設定",
    error: "天気を読み込めません。しばらくしてから再度お試しください。",
    detectedArea: "現在のApp地域",
    future: "今後の天気",
    metrics: "現在の指標",
    lifeAdvice: "生活アドバイス",
    settings: "天気リマインダー設定",
    appOnlyNotice: "App内だけで有効です。スマホ通知は送信しません。オンにすると生活リマインダーセンターに表示されます。",
    source: "データ元：Open-Meteo Forecast API + Air Quality API",
    reference: "生活参考用です。外出前に最新の天気と公式警報をご確認ください。表示されない項目はAPIから返っていないデータです。",
    updatedAt: "更新時間",
    precipitationProbability: "降水確率",
    humidity: "湿度",
    feelsLike: "体感",
    currentRain: "現在の降水",
    cloudCover: "雲量",
    windSpeed: "風速",
    windGusts: "突風",
    pressure: "気圧",
    uvIndex: "UV指数",
    sunrise: "日の出",
    sunset: "日の入",
    precipitationSum: "降水量",
    snowfall: "降雪量",
    pm25: "PM2.5",
    pm10: "PM10",
    usAqi: "US AQI",
    ozone: "オゾン",
    rainAlert: "雨のリマインダー",
    rainDesc: "降水確率 >= 50% で表示",
    heatAlert: "高温リマインダー",
    heatDesc: "最高気温 >= 30°C で表示",
    typhoonAlert: "強風・雷雨リマインダー",
    typhoonDesc: "雷雨、強風、突風が強い時に表示",
    snowAlert: "雪のリマインダー",
    snowDesc: "雪予報がある時に表示",
    adviceRain: "今日は雨の可能性があります",
    adviceRainDesc: "傘を持ち歩き、交通情報にもご注意ください。",
    adviceHeat: "今日は気温が高めです",
    adviceHeatDesc: "水分補給を忘れず、長時間の外出は無理をしないでください。",
    adviceStorm: "天気が不安定になりそうです",
    adviceStormDesc: "公式警報を確認し、通勤や外出は時間に余裕を持ちましょう。",
    adviceSnow: "雪の可能性があります",
    adviceSnowDesc: "足元と交通状況に注意してください。",
    adviceGood: "大きな天気リスクはありません",
    adviceGoodDesc: "通勤、買い物、生活予定を通常通り組みやすい日です。",
    umbrellaIndex: "傘指数",
    umbrellaNeeded: "傘を持参",
    umbrellaMaybe: "折りたたみ傘",
    umbrellaNo: "傘なしでOK",
    umbrellaNeededDesc: "雨の可能性が高めです。外出前に雨具を確認。",
    umbrellaMaybeDesc: "雨の可能性があります。長時間の外出は傘が安心。",
    umbrellaNoDesc: "降水確率は低めです。短時間の外出は問題なさそうです。",
    outfitAdvice: "服装アドバイス",
    outfitHot: "涼しい服装",
    outfitWarm: "防寒を意識",
    outfitLight: "薄手の上着",
    outfitNormal: "普段通り",
    outfitHotDesc: "体感は暑めです。通気性のよい服がおすすめ。",
    outfitWarmDesc: "体感は低めです。朝晩は一枚足しましょう。",
    outfitLightDesc: "寒暖差や風があります。薄手の上着が安心です。",
    outfitNormalDesc: "体感は安定しています。普段通りで大丈夫です。",
    commuteAdvice: "外出アドバイス",
    commuteCareful: "時間に余裕",
    commuteBikeNo: "自転車は控えめ",
    commuteBikeOk: "徒歩・自転車OK",
    commuteCarefulDesc: "風雨が強めです。通勤は早めの出発がおすすめ。",
    commuteBikeNoDesc: "雨や風で自転車は少し不便そうです。",
    commuteBikeOkDesc: "天気は安定。近場の移動は快適そうです。",
    airQuality: "空気質",
    airGood: "良好",
    airNormal: "普通",
    airPoor: "やや悪い",
    airUnknown: "データなし",
    airGoodDesc: "空気質は良好です。屋外活動に向いています。",
    airNormalDesc: "空気質は普通です。敏感な方は長時間の屋外を控えめに。",
    airPoorDesc: "空気質がやや悪いです。長時間の屋外活動は控えめに。",
    airUnknownDesc: "空気質データは現在取得できません。",
  },
} as const;

const fallbackSettings: WeatherAlertSettings = {
  rain: false,
  heat: false,
  typhoon: false,
  snow: false,
};

export default function WeatherPage() {
  const { language } = useLanguage();
  const { settings } = useUserSettings();
  const text = copy[language];
  const settingsLocation = useMemo(() => getWeatherLocationFromSettings(settings), [settings]);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [error, setError] = useState(false);
  const [alertSettings, setAlertSettings] = useState<WeatherAlertSettings>(fallbackSettings);

  const activeLocation = useMemo(
    () => settingsLocation ?? null,
    [settingsLocation],
  );
  const dailyForecast = forecast?.daily ?? [];
  const today = dailyForecast[0] ?? null;
  const activeLocationName = activeLocation ? getWeatherLocationName(activeLocation, language) : text.noRegion;
  const currentCode = forecast?.current?.weatherCode ?? today?.weatherCode ?? 0;
  const currentTemperature = forecast?.current?.temperature ?? today?.maxTemperature ?? null;
  const updatedAt = forecast?.fetchedAt ? formatTokyoDateTime(forecast.fetchedAt, language === "ja" ? "ja-JP" : "zh-CN") : language === "ja" ? "最新データ未取得" : "未取得最新数据";
  const metrics = today ? buildMetrics(today, forecast, text) : [];
  const lifeAdviceItems = today ? buildLifeAdvice(today, forecast, text) : [];

  useEffect(() => {
    setAlertSettings(readAlertSettings());
  }, []);

  useEffect(() => {
    let cancelled = false;
    setForecast(null);
    setError(false);
    if (!activeLocation) return;
    fetchWeatherForecast(activeLocation)
      .then((result) => {
        if (!cancelled) setForecast(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [activeLocation]);

  const toggleAlert = (key: keyof WeatherAlertSettings) => {
    setAlertSettings((current) => {
      const next = { ...current, [key]: !current[key] };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(alertStorageKey, JSON.stringify(next));
        window.dispatchEvent(new Event(alertSettingsChangeEvent));
      }
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-[#F5F5F7] text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F5F5F7] px-4 pb-8 pt-5">
        <header className="mb-4 flex items-center justify-between">
          <BackButton label={text.back} />
          <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#2563EB] shadow-sm">Japan Life</span>
        </header>

        <section className="jl-info-card mb-4 rounded-[24px] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/85 text-[#2563EB] shadow-sm">
              <CloudSun className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight">{text.title}</h1>
              <p className="mt-1 text-xs font-bold text-slate-500">{text.subtitle}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
              <MapPin className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black text-slate-500">{text.detectedArea}</p>
              <p className="mt-0.5 truncate text-sm font-black text-slate-900">{activeLocationName}</p>
            </div>
            <Link className="rounded-2xl border border-blue-200 bg-white px-3 py-2 text-xs font-black text-[#2563EB]" href="/onboarding">
              {text.setup}
            </Link>
          </div>
        </section>

        {error ? (
          <section className="mt-4 rounded-[28px] border border-slate-200 bg-white p-5 text-sm font-black text-slate-600 shadow-sm">{text.error}</section>
        ) : !today ? (
          <section className="mt-4 rounded-[28px] border border-slate-200 bg-white p-5 text-sm font-black text-slate-600 shadow-sm">{text.noRegion}</section>
        ) : (
          <>
            <section className="weather-alert-hero mt-4 overflow-hidden rounded-[28px] p-5 text-white shadow-[0_18px_45px_rgba(37,99,235,0.22)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white/85">{activeLocationName}</p>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-5xl font-black leading-none">{currentTemperature === null ? "--" : Math.round(currentTemperature)}</span>
                    <span className="pb-1 text-2xl font-black">°C</span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-white/90">{getWeatherDescription(currentCode, language)}</p>
                  {forecast?.current?.relativeHumidity !== null && forecast?.current?.relativeHumidity !== undefined ? (
                    <p className="mt-2 text-sm font-black text-white/95">{text.humidity} {Math.round(forecast.current.relativeHumidity)}%</p>
                  ) : null}
                </div>
                <WeatherGlyph code={currentCode} large />
              </div>
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-bold text-white/90">
                <span>{text.precipitationProbability} {today.precipitationProbability}%</span>
                {forecast?.current?.apparentTemperature !== null && forecast?.current?.apparentTemperature !== undefined ? <span>{text.feelsLike} {Math.round(forecast.current.apparentTemperature)}°C</span> : null}
              </div>
            </section>

            <section className="mt-7">
              <h2 className="px-1 text-lg font-black">{text.lifeAdvice}</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {lifeAdviceItems.map((item) => (
                  <article className="min-h-[132px] rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)]" key={item.label}>
                    <div className="flex items-start gap-2.5">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${item.iconClass}`}>
                        <item.icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-500">{item.label}</p>
                        <h3 className="mt-1 text-sm font-black leading-5 text-slate-900">{item.title}</h3>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-3 text-xs font-bold leading-5 text-slate-500">{item.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-7">
              <h2 className="px-1 text-lg font-black">{text.future}</h2>
              <div className="mt-3 grid grid-cols-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
                {dailyForecast.slice(0, 5).map((day, index) => (
                  <article className="border-r border-slate-100 px-2 py-4 text-center last:border-r-0" key={day.date}>
                    <p className="text-xs font-black text-slate-700">{index === 0 ? formatTodayLabel(language) : formatDayLabel(day.date, language)}</p>
                    <div className="mt-3 flex justify-center">
                      <WeatherGlyph code={day.weatherCode} />
                    </div>
                    <p className="mt-3 text-xs font-black text-slate-800">{Math.round(day.maxTemperature)}°/{Math.round(day.minTemperature)}°</p>
                    <p className="mt-2 text-[11px] font-black text-[#2563EB]">{day.precipitationProbability}%</p>
                  </article>
                ))}
              </div>
            </section>

            {metrics.length > 0 ? (
              <section className="mt-7">
                <h2 className="px-1 text-lg font-black">{text.metrics}</h2>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {metrics.map((metric) => (
                    <article className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm" key={metric.label}>
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
                          <metric.icon className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-slate-500">{metric.label}</p>
                          <p className="mt-0.5 truncate text-sm font-black text-slate-900">{metric.value}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}

        <section className="mt-5 rounded-[22px] border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-bold leading-5 text-slate-600">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />
            <div>
              <p className="font-black text-slate-800">{text.source}</p>
              <p className="mt-1">{text.updatedAt}：{updatedAt}</p>
              <p className="mt-1">{text.reference}</p>
            </div>
          </div>
        </section>

        {today ? (
          <section className="mt-7">
            <h2 className="px-1 text-lg font-black">{text.settings}</h2>
            <p className="mt-1 px-1 text-xs font-bold leading-5 text-slate-500">{text.appOnlyNotice}</p>
            <div className="mt-3 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
              <AlertRow active={alertSettings.rain} description={text.rainDesc} icon={CloudRain} iconClass="bg-blue-50 text-[#2563EB]" onToggle={() => toggleAlert("rain")} title={text.rainAlert} />
              <AlertRow active={alertSettings.heat} description={text.heatDesc} icon={ThermometerSun} iconClass="bg-orange-50 text-orange-500" onToggle={() => toggleAlert("heat")} title={text.heatAlert} />
              <AlertRow active={alertSettings.typhoon} description={text.typhoonDesc} icon={Wind} iconClass="bg-indigo-50 text-indigo-500" onToggle={() => toggleAlert("typhoon")} title={text.typhoonAlert} />
              <AlertRow active={alertSettings.snow} description={text.snowDesc} icon={Snowflake} iconClass="bg-sky-50 text-sky-500" onToggle={() => toggleAlert("snow")} title={text.snowAlert} last />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function AlertRow({
  active,
  description,
  icon: Icon,
  iconClass,
  last = false,
  onToggle,
  title,
}: {
  active: boolean;
  description: string;
  icon: typeof Bell;
  iconClass: string;
  last?: boolean;
  onToggle: () => void;
  title: string;
}) {
  return (
    <button className={`flex w-full items-center gap-3 bg-white px-4 py-3 text-left transition active:bg-blue-50/60 ${last ? "" : "border-b border-slate-100"}`} onClick={onToggle} type="button">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-slate-800">{title}</span>
        <span className="mt-1 block text-xs font-bold text-slate-500">{description}</span>
      </span>
      <span className={`relative h-7 w-12 rounded-full border transition-all ${active ? "border-[#2563EB] bg-[#2563EB]" : "border-slate-300 bg-slate-100"}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-[0_2px_7px_rgba(15,23,42,0.18)] transition-all ${active ? "left-[21px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function WeatherGlyph({ code, large = false }: { code: number; large?: boolean }) {
  const className = large ? "h-24 w-24 text-white drop-shadow-sm" : "h-9 w-9";
  const wrapperClass = large ? "flex h-28 w-28 items-center justify-center" : "flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-[#2563EB]";
  const Icon = getWeatherIcon(code);
  const color = large ? "" : getWeatherIconColor(code);
  return (
    <span className={`${wrapperClass} ${color}`}>
      <Icon className={className} strokeWidth={large ? 1.8 : 2.2} />
    </span>
  );
}

function getWeatherIcon(code: number) {
  if (code === 0) return Sun;
  if ([1, 2, 3].includes(code)) return CloudSun;
  if ([45, 48].includes(code)) return Cloud;
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return CloudRain;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return Snowflake;
  if ([95, 96, 99].includes(code)) return CloudLightning;
  return Umbrella;
}

function getWeatherIconColor(code: number) {
  if (code === 0) return "text-amber-500";
  if ([1, 2, 3].includes(code)) return "text-sky-500";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "text-blue-500";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "text-cyan-500";
  if ([95, 96, 99].includes(code)) return "text-indigo-500";
  return "text-slate-500";
}

function buildLifeAdvice(day: WeatherDailyItem, forecast: WeatherForecast | null, text: (typeof copy)[keyof typeof copy]): LifeAdvice[] {
  const current = forecast?.current;
  const air = forecast?.airQuality;
  const apparentTemperature = current?.apparentTemperature ?? day.apparentMaxTemperature ?? day.maxTemperature;
  const windSpeed = current?.windSpeed ?? day.windSpeedMax ?? 0;
  const gusts = current?.windGusts ?? day.windGustsMax ?? 0;
  const humidity = current?.relativeHumidity ?? null;
  const rainAmount = (day.precipitationSum ?? 0) + (current?.precipitation ?? 0);
  const rainLikely = day.precipitationProbability >= 60 || rainAmount >= 3 || [61, 63, 65, 80, 81, 82].includes(day.weatherCode);
  const rainPossible = day.precipitationProbability >= 35 || rainAmount > 0 || [51, 53, 55].includes(day.weatherCode);
  const windy = windSpeed >= 25 || gusts >= 35;
  const humid = typeof humidity === "number" && humidity >= 75;

  return [
    {
      description: rainLikely ? text.umbrellaNeededDesc : rainPossible ? text.umbrellaMaybeDesc : text.umbrellaNoDesc,
      icon: Umbrella,
      iconClass: "bg-blue-50 text-[#2563EB]",
      label: text.umbrellaIndex,
      title: rainLikely ? text.umbrellaNeeded : rainPossible ? text.umbrellaMaybe : text.umbrellaNo,
    },
    buildOutfitAdvice(apparentTemperature, windy, humid, text),
    {
      description: rainLikely || windy ? text.commuteCarefulDesc : rainPossible ? text.commuteBikeNoDesc : text.commuteBikeOkDesc,
      icon: Bike,
      iconClass: rainLikely || windy ? "bg-orange-50 text-orange-500" : "bg-green-50 text-green-600",
      label: text.commuteAdvice,
      title: rainLikely || windy ? text.commuteCareful : rainPossible ? text.commuteBikeNo : text.commuteBikeOk,
    },
    buildAirQualityAdvice(air?.usAqi ?? null, text),
  ];
}

function buildOutfitAdvice(apparentTemperature: number, windy: boolean, humid: boolean, text: (typeof copy)[keyof typeof copy]): LifeAdvice {
  if (apparentTemperature >= 28 || (apparentTemperature >= 25 && humid)) {
    return {
      description: text.outfitHotDesc,
      icon: Shirt,
      iconClass: "bg-green-50 text-green-600",
      label: text.outfitAdvice,
      title: text.outfitHot,
    };
  }

  if (apparentTemperature <= 12) {
    return {
      description: text.outfitWarmDesc,
      icon: Shirt,
      iconClass: "bg-sky-50 text-sky-600",
      label: text.outfitAdvice,
      title: text.outfitWarm,
    };
  }

  if (windy || apparentTemperature <= 18) {
    return {
      description: text.outfitLightDesc,
      icon: Shirt,
      iconClass: "bg-violet-50 text-violet-600",
      label: text.outfitAdvice,
      title: text.outfitLight,
    };
  }

  return {
    description: text.outfitNormalDesc,
    icon: Shirt,
    iconClass: "bg-emerald-50 text-emerald-600",
    label: text.outfitAdvice,
    title: text.outfitNormal,
  };
}

function buildAirQualityAdvice(usAqi: number | null, text: (typeof copy)[keyof typeof copy]): LifeAdvice {
  if (usAqi === null) {
    return {
      description: text.airUnknownDesc,
      icon: Leaf,
      iconClass: "bg-slate-100 text-slate-600",
      label: text.airQuality,
      title: text.airUnknown,
    };
  }

  if (usAqi <= 50) {
    return {
      description: `${text.airGoodDesc} AQI ${Math.round(usAqi)}`,
      icon: Leaf,
      iconClass: "bg-green-50 text-green-600",
      label: text.airQuality,
      title: text.airGood,
    };
  }

  if (usAqi <= 100) {
    return {
      description: `${text.airNormalDesc} AQI ${Math.round(usAqi)}`,
      icon: Leaf,
      iconClass: "bg-yellow-50 text-yellow-600",
      label: text.airQuality,
      title: text.airNormal,
    };
  }

  return {
    description: `${text.airPoorDesc} AQI ${Math.round(usAqi)}`,
    icon: Leaf,
    iconClass: "bg-red-50 text-red-500",
    label: text.airQuality,
    title: text.airPoor,
  };
}

function buildMetrics(day: WeatherDailyItem, forecast: WeatherForecast | null, text: (typeof copy)[keyof typeof copy]) {
  const current = forecast?.current;
  const air = forecast?.airQuality;
  const metrics: Metric[] = [];
  addMetric(metrics, text.humidity, percent(current?.relativeHumidity), Droplets);
  addMetric(metrics, text.feelsLike, celsius(current?.apparentTemperature ?? day.apparentMaxTemperature), ThermometerSun);
  addMetric(metrics, text.currentRain, millimeters(current?.precipitation), Umbrella);
  addMetric(metrics, text.cloudCover, percent(current?.cloudCover), Cloud);
  addMetric(metrics, text.windSpeed, speed(current?.windSpeed), Wind);
  addMetric(metrics, text.windGusts, speed(current?.windGusts ?? day.windGustsMax), Wind);
  addMetric(metrics, text.pressure, pressure(current?.pressureMsl), Gauge);
  addMetric(metrics, text.uvIndex, numberValue(day.uvIndexMax, 1), Sun);
  addMetric(metrics, text.sunrise, timeValue(day.sunrise), Sunrise);
  addMetric(metrics, text.sunset, timeValue(day.sunset), Sunset);
  addMetric(metrics, text.precipitationSum, millimeters(day.precipitationSum), Waves);
  addMetric(metrics, text.snowfall, centimeters(day.snowfallSum), Snowflake);
  addMetric(metrics, text.pm25, micrograms(air?.pm25), Eye);
  addMetric(metrics, text.pm10, micrograms(air?.pm10), Eye);
  addMetric(metrics, text.usAqi, numberValue(air?.usAqi, 0), Eye);
  addMetric(metrics, text.ozone, micrograms(air?.ozone), Eye);
  return metrics;
}

function addMetric(metrics: Metric[], label: string, value: string | null, icon: typeof Bell) {
  if (!value) return;
  metrics.push({ label, value, icon });
}

function celsius(value: number | null | undefined) {
  return value === null || value === undefined ? null : `${Math.round(value)}°C`;
}

function percent(value: number | null | undefined) {
  return value === null || value === undefined ? null : `${Math.round(value)}%`;
}

function millimeters(value: number | null | undefined) {
  return value === null || value === undefined ? null : `${formatNumber(value, 1)} mm`;
}

function centimeters(value: number | null | undefined) {
  return value === null || value === undefined ? null : `${formatNumber(value, 1)} cm`;
}

function speed(value: number | null | undefined) {
  return value === null || value === undefined ? null : `${formatNumber(value, 1)} km/h`;
}

function pressure(value: number | null | undefined) {
  return value === null || value === undefined ? null : `${Math.round(value)} hPa`;
}

function micrograms(value: number | null | undefined) {
  return value === null || value === undefined ? null : `${formatNumber(value, 1)} ug/m3`;
}

function numberValue(value: number | null | undefined, digits: number) {
  return value === null || value === undefined ? null : formatNumber(value, digits);
}

function timeValue(value: string | null | undefined) {
  if (!value) return null;
  const time = value.includes("T") ? value.split("T")[1] : value;
  return time.slice(0, 5);
}

function formatNumber(value: number, digits: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}

function readAlertSettings(): WeatherAlertSettings {
  if (typeof window === "undefined") return fallbackSettings;
  try {
    const raw = window.localStorage.getItem(alertStorageKey);
    if (!raw) return fallbackSettings;
    const parsed = JSON.parse(raw) as Partial<WeatherAlertSettings>;
    return {
      rain: typeof parsed.rain === "boolean" ? parsed.rain : fallbackSettings.rain,
      heat: typeof parsed.heat === "boolean" ? parsed.heat : fallbackSettings.heat,
      typhoon: typeof parsed.typhoon === "boolean" ? parsed.typhoon : fallbackSettings.typhoon,
      snow: typeof parsed.snow === "boolean" ? parsed.snow : fallbackSettings.snow,
    };
  } catch {
    return fallbackSettings;
  }
}

function formatTodayLabel(language: "zh-CN" | "zh-TW" | "ja") {
  return { "zh-CN": "今天", "zh-TW": "今天", ja: "今日" }[language];
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
