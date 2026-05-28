export type TrainDealCategory =
  | "一日券"
  | "东京 Metro"
  | "都营地下铁"
  | "JR"
  | "私铁"
  | "机场交通"
  | "观光"
  | "学生 / 通勤";

export type TrainDealTab = "全部" | TrainDealCategory;

export type MainRailType = "JR" | "Metro" | "都营" | "私铁" | "混坐";

export type TrainRideCount = "1〜2 次" | "3〜4 次" | "5 次以上";

export type TrainDealInfoConfidence = "高" | "中" | "低";

export type TrainDeal = {
  id: string;
  name: string;
  company: string;
  category: TrainDealCategory;
  area: string;
  priceLabel: string;
  validFor: string;
  bestFor: string;
  description: string;
  caution: string;
  officialSearchQuery: string;
  lastCheckedLabel: string;
  infoConfidence: TrainDealInfoConfidence;
  priceNote: string;
  purchaseNote: string;
  goodFor: string[];
  notGoodFor: string[];
  tags: string[];
};

export type TrainDealCalculatorState = {
  rideCount: TrainRideCount;
  mainRail: MainRailType;
  multiSpot: boolean;
  airport: boolean;
  suburban: boolean;
};
