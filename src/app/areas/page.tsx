"use client";

import { Heart, Home, MapPin, Search, Smile, Train, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { DataNotice } from "@/components/DataNotice";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/hooks/useLanguage";
import type { Language } from "@/lib/i18n/translations";
import { formatCurrency } from "@/lib/formatCurrency";

type SortMode = "default" | "rent" | "friendly";
type AreaGroup = "tokyo23" | "city";
type Area = {
  nameZhCN: string;
  nameZhTW: string;
  nameJa: string;
  alt: string;
  group: AreaGroup;
  rent: number;
  wage: number;
  transit: number;
  friendly: number;
  cost: number;
};

const rows: Array<[string, string, string, string, AreaGroup, number, number, number, number, number]> = [
  ["千代田区", "千代田區", "千代田区", "Tokyo / Akihabara", "tokyo23", 138000, 1350, 5, 3, 5],
  ["中央区", "中央區", "中央区", "Ginza / Nihonbashi", "tokyo23", 132000, 1320, 5, 3, 5],
  ["港区", "港區", "港区", "Roppongi / Shinagawa", "tokyo23", 155000, 1400, 5, 4, 5],
  ["新宿区", "新宿區", "新宿区", "Shinjuku / Takadanobaba", "tokyo23", 105000, 1250, 5, 5, 5],
  ["文京区", "文京區", "文京区", "Bunkyo / Hongo", "tokyo23", 96000, 1180, 4, 4, 4],
  ["台东区", "台東區", "台東区", "Ueno / Asakusa", "tokyo23", 82000, 1120, 4, 4, 3],
  ["墨田区", "墨田區", "墨田区", "Kinshicho / Skytree", "tokyo23", 79000, 1100, 4, 3, 3],
  ["江东区", "江東區", "江東区", "Toyosu / Kameido", "tokyo23", 88000, 1130, 4, 3, 3],
  ["品川区", "品川區", "品川区", "Shinagawa / Gotanda", "tokyo23", 105000, 1220, 5, 4, 4],
  ["目黑区", "目黑區", "目黒区", "Nakameguro / Jiyugaoka", "tokyo23", 118000, 1220, 4, 3, 5],
  ["大田区", "大田區", "大田区", "Kamata / Haneda", "tokyo23", 78000, 1120, 4, 4, 3],
  ["世田谷区", "世田谷區", "世田谷区", "Sangenjaya / Shimokitazawa", "tokyo23", 95000, 1150, 4, 3, 4],
  ["涩谷区", "澀谷區", "渋谷区", "Shibuya / Ebisu", "tokyo23", 125000, 1320, 5, 4, 5],
  ["中野区", "中野區", "中野区", "Nakano", "tokyo23", 82000, 1120, 4, 4, 3],
  ["杉并区", "杉並區", "杉並区", "Koenji / Ogikubo", "tokyo23", 78000, 1100, 4, 4, 3],
  ["丰岛区", "豐島區", "豊島区", "Ikebukuro", "tokyo23", 88000, 1150, 5, 5, 4],
  ["北区", "北區", "北区", "Akabane / Oji", "tokyo23", 70000, 1080, 4, 4, 2],
  ["荒川区", "荒川區", "荒川区", "Nippori / Minowa", "tokyo23", 69000, 1060, 4, 4, 2],
  ["板桥区", "板橋區", "板橋区", "Itabashi", "tokyo23", 73000, 1050, 3, 4, 2],
  ["练马区", "練馬區", "練馬区", "Nerima", "tokyo23", 72000, 1050, 3, 3, 2],
  ["足立区", "足立區", "足立区", "Kita-Senju", "tokyo23", 66000, 1040, 4, 4, 2],
  ["葛饰区", "葛飾區", "葛飾区", "Katsushika", "tokyo23", 64000, 1030, 3, 3, 1],
  ["江户川区", "江戶川區", "江戸川区", "Kasai / Koiwa", "tokyo23", 70000, 1040, 3, 4, 2],
  ["八王子市", "八王子市", "八王子市", "Hachioji", "city", 56000, 1030, 3, 4, 1],
  ["立川市", "立川市", "立川市", "Tachikawa", "city", 68000, 1080, 4, 4, 2],
  ["武藏野市", "武藏野市", "武蔵野市", "Kichijoji", "city", 90000, 1150, 4, 4, 4],
  ["三鹰市", "三鷹市", "三鷹市", "Mitaka", "city", 78000, 1100, 4, 4, 3],
  ["府中市", "府中市", "府中市", "Fuchu", "city", 66000, 1060, 3, 3, 2],
  ["调布市", "調布市", "調布市", "Chofu", "city", 72000, 1080, 4, 3, 3],
  ["町田市", "町田市", "町田市", "Machida", "city", 62000, 1060, 3, 4, 2],
  ["国分寺市", "國分寺市", "国分寺市", "Kokubunji", "city", 70000, 1070, 4, 4, 2],
  ["多摩市", "多摩市", "多摩市", "Tama Center", "city", 60000, 1040, 3, 3, 1],
];

const allAreas: Area[] = rows.map(([nameZhCN, nameZhTW, nameJa, alt, group, rent, wage, transit, friendly, cost]) => ({ nameZhCN, nameZhTW, nameJa, alt, group, rent, wage, transit, friendly, cost }));
const yen = (value: number) => formatCurrency(value, "JPY");

const copy = {
  "zh-CN": {
    back: "返回",
    title: "东京地区数据",
    desc: "东京 23 区 + 热门市部，比较房租、时薪、交通和外国人友好度。",
    search: "搜索地区 / 车站 / 英文名",
    groups: { all: "全部", tokyo23: "东京23区", city: "热门市部" },
    sortRent: "房租低",
    sortFriendly: "友好度高",
    shown: "显示",
    rent: "房租",
    wage: "时薪",
    transit: "交通",
    friendly: "友好度",
    people: { tokyo23: "适合比较房租、通勤和生活成本的新入境用户", city: "适合预算优先、可接受较长通勤的人" },
    source: "Japan Life 2026 东京地区静态参考数据",
  },
  "zh-TW": {
    back: "返回",
    title: "東京地區資料",
    desc: "東京 23 區 + 熱門市部，比較房租、時薪、交通和外國人友好度。",
    search: "搜尋地區 / 車站 / 英文名",
    groups: { all: "全部", tokyo23: "東京23區", city: "熱門市部" },
    sortRent: "房租低",
    sortFriendly: "友好度高",
    shown: "顯示",
    rent: "房租",
    wage: "時薪",
    transit: "交通",
    friendly: "友好度",
    people: { tokyo23: "適合比較房租、通勤和生活成本的新入境使用者", city: "適合預算優先、可接受較長通勤的人" },
    source: "Japan Life 2026 東京地區靜態參考資料",
  },
  ja: {
    back: "戻る",
    title: "東京エリア情報",
    desc: "東京23区と人気市部の家賃、時給、交通、外国人フレンドリー度を比較できます。",
    search: "エリア / 駅 / 英語名で検索",
    groups: { all: "すべて", tokyo23: "東京23区", city: "人気市部" },
    sortRent: "家賃が安い",
    sortFriendly: "外国人向け",
    shown: "表示",
    rent: "家賃",
    wage: "時給",
    transit: "交通",
    friendly: "フレンドリー",
    people: { tokyo23: "家賃、通勤、生活費を比較したい来日直後の方向け", city: "予算重視で長めの通勤も許容できる方向け" },
    source: "Japan Life 2026 東京エリア静的参考データ",
  },
} as const;

function areaName(area: Area, language: Language) {
  if (language === "zh-TW") return area.nameZhTW;
  if (language === "ja") return area.nameJa;
  return area.nameZhCN;
}

export default function AreasPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [group, setGroup] = useState<"all" | AreaGroup>("all");
  const { isFavorite, toggleFavorite } = useFavorites();

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    let result = allAreas.filter((area) => (group === "all" || area.group === group) && (!keyword || `${area.nameZhCN} ${area.nameZhTW} ${area.nameJa} ${area.alt} ${text.people[area.group]}`.toLowerCase().includes(keyword)));
    if (sortMode === "rent") result = [...result].sort((a, b) => a.rent - b.rent);
    if (sortMode === "friendly") result = [...result].sort((a, b) => b.friendly - a.friendly || a.rent - b.rent);
    return result;
  }, [group, query, sortMode, text.people]);

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 py-5 shadow-2xl shadow-stone-300/40">
        <div className="mb-4 flex items-center justify-between">
          <BackButton label={text.back} />
          <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">Japan Life</span>
        </div>
        <section className="rounded-[24px] bg-emerald-800 p-5 text-white shadow-[0_16px_35px_rgba(20,108,92,0.22)]">
          <MapPin className="mb-4 h-8 w-8" />
          <h1 className="text-2xl font-black">{text.title}</h1>
          <p className="mt-2 text-xs font-bold leading-5 text-emerald-50">{text.desc}</p>
        </section>
        <section className="mt-4 rounded-[18px] bg-white p-3 shadow-sm">
          <label className="flex h-10 items-center gap-2 rounded-xl bg-stone-50 px-3">
            <Search className="h-4 w-4 text-emerald-800" />
            <input className="w-full bg-transparent text-sm font-black outline-none" placeholder={text.search} value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {(["all", "tokyo23", "city"] as const).map((item) => <button className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${group === item ? "bg-emerald-800 text-white" : "bg-emerald-50 text-emerald-800"}`} key={item} onClick={() => setGroup(item)}>{text.groups[item]}</button>)}
            {[{ label: text.sortRent, value: "rent" }, { label: text.sortFriendly, value: "friendly" }].map((item) => <button className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${sortMode === item.value ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600"}`} key={item.value} onClick={() => setSortMode(item.value as SortMode)}>{item.label}</button>)}
          </div>
        </section>
        <p className="mt-3 text-xs font-black text-stone-500">{text.shown}: {filtered.length} / {allAreas.length}</p>
        <section className="mt-3 grid gap-3">
          {filtered.map((area) => {
            const name = areaName(area, language);
            const saved = isFavorite("area", name);
            return (
              <article className="rounded-[20px] border border-stone-200 bg-white p-4 shadow-sm" key={`${area.group}-${area.nameZhCN}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-emerald-700">{text.groups[area.group]}</p>
                    <h2 className="text-lg font-black">{name}</h2>
                    <p className="text-xs font-bold text-stone-500">{area.alt}</p>
                  </div>
                  <button className={`h-9 w-9 rounded-full ${saved ? "bg-rose-50 text-rose-600" : "bg-stone-100 text-stone-500"}`} onClick={() => toggleFavorite({ id: name, type: "area", title: name, subtitle: `${area.alt} / ${yen(area.rent)}` })}>
                    <Heart className={`mx-auto h-4 w-4 ${saved ? "fill-rose-500" : ""}`} />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs font-bold text-stone-500 min-[360px]:grid-cols-2">
                  <Metric icon={Home} label={text.rent} value={yen(area.rent)} />
                  <Metric icon={WalletCards} label={text.wage} value={yen(area.wage)} />
                  <Metric icon={Train} label={text.transit} value={`${area.transit}/5`} />
                  <Metric icon={Smile} label={text.friendly} value={`${area.friendly}/5`} />
                </div>
                <p className="mt-3 text-xs font-bold leading-5 text-stone-500">{text.people[area.group]}</p>
              </article>
            );
          })}
        </section>
        <DataNotice
          source="Japan Life 2026 东京地区静态参考数据"
          sourceZhTW="Japan Life 2026 東京地區靜態參考資料"
          sourceJa="Japan Life 2026 東京エリア静的参考データ"
          updatedAt="2026-05-22"
          note="地区房租、时薪、交通和便利度为静态参考值，实际情况会因房源、车站、时间和个人条件不同而变化。"
          noteZhTW="地區房租、時薪、交通和便利度為靜態參考值，實際情況會因房源、車站、時間和個人條件不同而變化。"
          noteJa="エリアの家賃、時給、交通、利便性は静的な参考値です。実際の条件は物件、駅、時期、個人状況により変わります。"
        />
      </div>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) {
  return <div className="rounded-xl bg-stone-50 p-2"><div className="flex items-center gap-1"><Icon className="h-3.5 w-3.5 text-emerald-800" />{label}</div><p className="mt-1 text-sm font-black text-stone-950">{value}</p></div>;
}
