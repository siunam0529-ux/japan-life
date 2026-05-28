export type PlayMode = "半日游" | "一日游" | "傍晚出发" | "周末小旅行";
export type PlayTimeTag = "半日" | "一日" | "傍晚出发" | "周末";
export type PlayCompanionTag = "一个人" | "朋友" | "情侣" | "家人";
export type PlayTypeTag = "自然" | "咖啡" | "购物" | "老街" | "海边" | "夜景" | "低预算" | "雨天也可以" | "不想太累" | "想有出门感" | "想拍照" | "想吃点好的";
export type PlayFilterTag = PlayTimeTag | PlayCompanionTag | PlayTypeTag;
export type PlayDifficulty = "轻松" | "普通" | "稍微累";

export type PlayPlanStep = {
  timeLabel: string;
  title: string;
  description: string;
  estimatedDuration: string;
};

export type PlayDestination = {
  id: string;
  name: string;
  japaneseName: string;
  englishName: string;
  area: string;
  prefecture: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle: string;
  tags: PlayFilterTag[];
  bestFor: PlayCompanionTag[];
  bestTime: PlayTimeTag[];
  duration: string;
  budget: string;
  difficulty: PlayDifficulty;
  reason: string;
  planSteps: PlayPlanStep[];
  morningPlan: string;
  afternoonPlan: string;
  eveningPlan: string;
  rainyPlan: string;
  budgetBreakdown: string[];
  transportNote: string;
  tips: string;
  caution: string;
  image: string;
};

export type PlayDailyPick = {
  date: string;
  destinationId: string;
  filters: PlayFilterTag[];
  mode: PlayMode;
};

export type PlaySavedDestination = {
  destinationId: string;
  mode: PlayMode;
  selectedTags: PlayFilterTag[];
  date: string;
};

export type PlayVisitedRecord = {
  destinationId: string;
  mode: PlayMode;
  date: string;
  note?: string;
};
