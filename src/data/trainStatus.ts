export type TrainStatusTone = "green" | "orange" | "red";

export type TrainStatusLine = {
  code: string;
  name: string;
  status: string;
  tone: TrainStatusTone;
  color: string;
};

export type TrainStatusLanguage = "zh-CN" | "zh-TW" | "ja";

export const tokyoTrainStatusLines: Record<TrainStatusLanguage, TrainStatusLine[]> = {
  "zh-CN": [
    { code: "JY", name: "山手线", status: "正常", tone: "green", color: "#65B32E" },
    { code: "T", name: "东京 Metro 东西线", status: "正常", tone: "green", color: "#00A7DB" },
    { code: "JC", name: "中央线", status: "延误 15 分", tone: "orange", color: "#F15A24" },
    { code: "TX", name: "筑波快线", status: "正常", tone: "green", color: "#003E92" },
    { code: "KO", name: "京王线", status: "延误 5 分", tone: "orange", color: "#C0007A" },
    { code: "JB", name: "总武线", status: "正常", tone: "green", color: "#FFD400" },
  ],
  "zh-TW": [
    { code: "JY", name: "山手線", status: "正常", tone: "green", color: "#65B32E" },
    { code: "T", name: "東京 Metro 東西線", status: "正常", tone: "green", color: "#00A7DB" },
    { code: "JC", name: "中央線", status: "延誤 15 分", tone: "orange", color: "#F15A24" },
    { code: "TX", name: "筑波快線", status: "正常", tone: "green", color: "#003E92" },
    { code: "KO", name: "京王線", status: "延誤 5 分", tone: "orange", color: "#C0007A" },
    { code: "JB", name: "總武線", status: "正常", tone: "green", color: "#FFD400" },
  ],
  ja: [
    { code: "JY", name: "山手線", status: "平常運転", tone: "green", color: "#65B32E" },
    { code: "T", name: "東京メトロ東西線", status: "平常運転", tone: "green", color: "#00A7DB" },
    { code: "JC", name: "中央線", status: "15分遅延", tone: "orange", color: "#F15A24" },
    { code: "TX", name: "つくばエクスプレス", status: "平常運転", tone: "green", color: "#003E92" },
    { code: "KO", name: "京王線", status: "5分遅延", tone: "orange", color: "#C0007A" },
    { code: "JB", name: "総武線", status: "平常運転", tone: "green", color: "#FFD400" },
  ],
};

export const trainStatusApiPlaceholder = {
  endpoint: null,
  note: "Future API integration point for Tokyo rail operation status.",
};
