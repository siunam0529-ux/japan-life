import type { FoodRecommendation } from "@/lib/food/types";

const keywordByFoodId: Record<string, string> = {
  ramen: "ラーメン",
  "miso-ramen": "味噌ラーメン",
  gyudon: "牛丼",
  "curry-rice": "カレー",
  teishoku: "定食",
  sushi: "寿司",
  udon: "うどん",
  soba: "そば",
  oyakodon: "親子丼",
  tonkatsu: "とんかつ",
  "konbini-onigiri": "おにぎり",
  "konbini-bento": "弁当",
  oden: "おでん",
  yakiniku: "焼肉",
  "izakaya-small-dishes": "居酒屋",
  nabe: "鍋",
  "cold-noodles": "冷麺",
  omurice: "オムライス",
  "hamburg-steak": "ハンバーグ",
  takoyaki: "たこ焼き",
  crepe: "スイーツ",
  donut: "スイーツ",
  "coffee-bread": "カフェ",
  sandwich: "サンドイッチ",
  "fried-rice": "チャーハン",
  "chinese-food": "中華料理",
  "korean-food": "韓国料理",
  "vegetable-salad": "サラダ",
  kaisendon: "海鮮丼",
  "home-noodles": "ラーメン",
};

export function getHotpepperKeyword(food: Pick<FoodRecommendation, "id" | "japaneseName" | "name">) {
  return keywordByFoodId[food.id] ?? food.japaneseName ?? food.name;
}
