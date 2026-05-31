export type WalkTag =
  | "安静"
  | "文艺"
  | "深夜"
  | "一个人"
  | "下雨天"
  | "昭和感"
  | "小众"
  | "咖啡"
  | "书店"
  | "猫"
  | "公园"
  | "河边"
  | "商店街"
  | "夜景"
  | "低预算"
  | "适合拍照"
  | "老街"
  | "复古"
  | "学生感"
  | "生活感";
export type WalkDifficulty = "轻松" | "普通" | "稍微累";
export type WalkStepsEstimate = "3000步以内" | "3000〜6000步" | "6000步以上";
export type WalkTask = string;

export type WalkRouteStep = {
  stepTitle: string;
  stepDescription: string;
};

export type WalkSpot = {
  id: string;
  station: string;
  englishName: string;
  area: string;
  ward: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle: string;
  image: string;
  moodTags: WalkTag[];
  reason: string;
  walkTask: WalkTask;
  bestTime: string;
  duration: string;
  budget: string;
  difficulty: WalkDifficulty;
  stepsEstimate: WalkStepsEstimate;
  suitableFor: string[];
  weatherTags: string[];
  routeSteps: WalkRouteStep[];
  tasks: WalkTask[];
};

export type WalkCollection = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  tags: string[];
  coverImage: string;
  intro: string;
};

export type WalkMoodId = "happy" | "relaxed" | "normal" | "tired" | "empty";

export type WalkHistoryItem = {
  id: string;
  spotId: string;
  station: string;
  date: string;
  weather: string;
  mood: WalkMoodId;
  moodLabel: string;
  note: string;
  image: string;
  tags: string[];
};

export type WalkRecord = WalkHistoryItem;
export type WalkVisitMap = Record<string, { count: number; lastVisitedAt: string }>;

export type WalkCompletion = {
  completedAt: string;
  date: string;
  moodLabel: string;
  note: string;
  spotId: string;
  station: string;
};

export type WalkFeedback = "tooFar" | "tooCrowded" | "notOutdoor" | "noSpend" | "tooTired";
export type WalkFeedbackId = WalkFeedback;
export type WalkFeedbackByDate = Record<string, WalkFeedbackId[]>;

export type DailyWalkPick = {
  date: string;
  selectedTag: WalkTag | "全部";
  spotId: string;
  task: WalkTask;
};

export type SkippedSpotIdsByDate = Record<string, string[]>;
