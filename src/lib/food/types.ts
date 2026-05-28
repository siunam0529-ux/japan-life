export type FoodCategory =
  | "主食"
  | "面类"
  | "米饭"
  | "便利店"
  | "甜点"
  | "轻食"
  | "聚餐"
  | "家里";

export type FoodMoodTag =
  | "省钱"
  | "一个人"
  | "下雨天"
  | "深夜"
  | "想吃热的"
  | "想吃清爽的"
  | "想吃甜的"
  | "吃饱一点"
  | "不想走远";

export type FoodWeatherTag = "晴天" | "下雨" | "炎热" | "寒冷" | "阴天";

export type FoodWeatherMood = "晴天" | "下雨" | "有点冷" | "有点热" | "普通";

export type FoodTimeSlot = "早上" | "中午" | "下午" | "晚上" | "深夜";

export type FoodPreference =
  | "喜欢热的"
  | "喜欢清爽"
  | "喜欢省钱"
  | "喜欢吃饱"
  | "喜欢甜的"
  | "不想油腻"
  | "不想太贵"
  | "不想走远";

export type FoodSkipRule = "不想吃面" | "不想吃饭" | "不想吃肉" | "不想吃甜" | "不想吃便利店" | "不想吃太贵";

export type FoodDirection = "省钱一点" | "热一点" | "清爽一点" | "吃饱一点" | "轻一点" | "深夜现实一点";

export type FoodRecommendation = {
  id: string;
  name: string;
  japaneseName: string;
  category: FoodCategory;
  priceRange: string;
  bestTime: FoodTimeSlot[];
  moodTags: FoodMoodTag[];
  weatherTags: FoodWeatherTag[];
  description: string;
  reason: string;
  bestFor: string[];
  avoidWhen: string[];
  image: string;
};

export type FoodDailyPick = {
  activeTag: FoodMoodTag | "全部";
  date: string;
  direction?: FoodDirection | null;
  foodId: string;
  weatherMood: FoodWeatherMood;
};

export type FoodHistoryItem = {
  foodId: string;
  name: string;
  date: string;
  timeLabel: FoodTimeSlot;
  weatherMood: FoodWeatherMood;
};

export type NearbyRestaurant = {
  access: string;
  address: string;
  budget: string;
  genre: string;
  hotpepperUrl: string;
  id: string;
  mapQuery: string;
  name: string;
  open: string;
  photoUrl: string;
};

export type FoodEatingHistoryItem = FoodHistoryItem;
