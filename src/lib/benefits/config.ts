export const BENEFIT_KEYWORDS = [
  "給付金",
  "補助金",
  "助成金",
  "支援金",
  "支援",
  "無償化",
  "減免",
  "免除",
  "補助",
  "手当",
  "子育て",
  "出産",
  "妊娠",
  "ひとり親",
  "児童",
  "保育",
  "医療費助成",
  "国民健康保険",
  "住民税非課税",
  "非課税",
  "低所得",
  "生活困窮",
  "家賃",
  "住宅",
  "奨学金",
  "留学生",
  "外国人",
  "高齢者",
  "障害",
  "介護",
  "就労",
  "就職",
  "失業",
  "物価高騰",
  "価格高騰",
  "申請",
  "給付",
] as const;

export const BENEFIT_CATEGORIES = ["子育て", "住宅", "外国人・留学生", "医療", "高齢者", "低所得", "仕事", "その他"] as const;

export type BenefitCategory = (typeof BENEFIT_CATEGORIES)[number];
export type BenefitSourceType = "tokyo" | "ward" | "national";

export type BenefitSource = {
  name: string;
  ward: string;
  type: BenefitSourceType;
  rssUrl: string;
  fallbackUrl: string;
};

export const BENEFIT_SOURCES: BenefitSource[] = [
  { name: "東京都", ward: "東京都", type: "tokyo", rssUrl: "", fallbackUrl: "https://www.metro.tokyo.lg.jp/" },
  { name: "東京都福祉局", ward: "東京都", type: "tokyo", rssUrl: "", fallbackUrl: "https://www.fukushi.metro.tokyo.lg.jp/" },
  { name: "東京都子供政策連携室", ward: "東京都", type: "tokyo", rssUrl: "", fallbackUrl: "https://www.kodomoseisaku.metro.tokyo.lg.jp/" },
  { name: "厚生労働省", ward: "全国", type: "national", rssUrl: "https://www.mhlw.go.jp/stf/news.rdf", fallbackUrl: "https://www.mhlw.go.jp/" },
  { name: "千代田区", ward: "千代田区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.chiyoda.lg.jp/" },
  { name: "中央区", ward: "中央区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.chuo.lg.jp/" },
  { name: "港区", ward: "港区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.minato.tokyo.jp/" },
  { name: "新宿区", ward: "新宿区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.shinjuku.lg.jp/" },
  { name: "文京区", ward: "文京区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.bunkyo.lg.jp/" },
  { name: "台東区", ward: "台東区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.taito.lg.jp/" },
  { name: "墨田区", ward: "墨田区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.sumida.lg.jp/" },
  { name: "江東区", ward: "江東区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.koto.lg.jp/" },
  { name: "品川区", ward: "品川区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.shinagawa.tokyo.jp/" },
  { name: "目黒区", ward: "目黒区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.meguro.tokyo.jp/" },
  { name: "大田区", ward: "大田区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.ota.tokyo.jp/" },
  { name: "世田谷区", ward: "世田谷区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.setagaya.lg.jp/" },
  { name: "渋谷区", ward: "渋谷区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.shibuya.tokyo.jp/" },
  { name: "中野区", ward: "中野区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.tokyo-nakano.lg.jp/" },
  { name: "杉並区", ward: "杉並区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.suginami.tokyo.jp/" },
  { name: "豊島区", ward: "豊島区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.toshima.lg.jp/" },
  { name: "北区", ward: "北区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.kita.tokyo.jp/" },
  { name: "荒川区", ward: "荒川区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.arakawa.tokyo.jp/" },
  { name: "板橋区", ward: "板橋区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.itabashi.tokyo.jp/" },
  { name: "練馬区", ward: "練馬区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.nerima.tokyo.jp/" },
  { name: "足立区", ward: "足立区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.adachi.tokyo.jp/" },
  { name: "葛飾区", ward: "葛飾区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.katsushika.lg.jp/" },
  { name: "江戸川区", ward: "江戸川区", type: "ward", rssUrl: "", fallbackUrl: "https://www.city.edogawa.tokyo.jp/" },
];

export const TOKYO_WARDS = BENEFIT_SOURCES.filter((source) => source.type === "tokyo" || source.type === "ward" || source.type === "national");

const categoryMatchers: Array<{ category: BenefitCategory; keywords: string[] }> = [
  { category: "子育て", keywords: ["子育て", "児童", "保育", "出産", "妊娠"] },
  { category: "住宅", keywords: ["家賃", "住宅", "住まい"] },
  { category: "外国人・留学生", keywords: ["留学生", "外国人", "多文化"] },
  { category: "医療", keywords: ["医療", "保険", "医療費"] },
  { category: "高齢者", keywords: ["高齢者", "介護"] },
  { category: "低所得", keywords: ["低所得", "非課税", "生活困窮"] },
  { category: "仕事", keywords: ["就労", "就職", "失業"] },
];

export function detectBenefitCategory(value: string) {
  const matched = categoryMatchers.find((item) => item.keywords.some((keyword) => value.includes(keyword)));
  return matched?.category ?? "その他";
}

export function detectTokyoWard(value: string, fallback = "") {
  return TOKYO_WARDS.find((ward) => value.includes(ward.ward))?.ward ?? fallback;
}
