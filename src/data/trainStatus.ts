export type TrainStatusTone = "green" | "orange" | "red";
export type TrainStatusLineId =
  | "yamanote"
  | "metroTozai"
  | "chuo"
  | "tsukubaExpress"
  | "keio"
  | "saikyo"
  | "sobu"
  | "marunouchi"
  | "ginza"
  | "keihinTohoku"
  | "odakyu";

export type TrainStatusLine = {
  id: TrainStatusLineId;
  code: string;
  name: string;
  status: string;
  tone: TrainStatusTone;
  color: string;
};

export type TrainStatusLanguage = "zh-CN" | "zh-TW" | "ja";

export const maxHomeRailLineCount = 6;
export const defaultHomeRailLineIds = ["yamanote", "metroTozai", "chuo", "tsukubaExpress", "keio", "saikyo"] as const;

export const tokyoTrainStatusLines: Record<TrainStatusLanguage, TrainStatusLine[]> = {
  "zh-CN": [
    { id: "yamanote", code: "JY", name: "山手线", status: "正常", tone: "green", color: "#65B32E" },
    { id: "metroTozai", code: "T", name: "东京 Metro 东西线", status: "正常", tone: "green", color: "#00A7DB" },
    { id: "chuo", code: "JC", name: "中央线", status: "延误 15 分", tone: "orange", color: "#F15A24" },
    { id: "tsukubaExpress", code: "TX", name: "筑波快线", status: "正常", tone: "green", color: "#003E92" },
    { id: "keio", code: "KO", name: "京王线", status: "延误 5 分", tone: "orange", color: "#C0007A" },
    { id: "saikyo", code: "JA", name: "埼京线", status: "正常", tone: "green", color: "#00AC9A" },
    { id: "sobu", code: "JB", name: "总武线", status: "正常", tone: "green", color: "#FFD400" },
    { id: "marunouchi", code: "M", name: "东京 Metro 丸之内线", status: "正常", tone: "green", color: "#F62E36" },
    { id: "ginza", code: "G", name: "东京 Metro 银座线", status: "正常", tone: "green", color: "#F39700" },
    { id: "keihinTohoku", code: "JK", name: "京滨东北线", status: "正常", tone: "green", color: "#00A7E3" },
    { id: "odakyu", code: "OH", name: "小田急线", status: "正常", tone: "green", color: "#2288CC" },
  ],
  "zh-TW": [
    { id: "yamanote", code: "JY", name: "山手線", status: "正常", tone: "green", color: "#65B32E" },
    { id: "metroTozai", code: "T", name: "東京 Metro 東西線", status: "正常", tone: "green", color: "#00A7DB" },
    { id: "chuo", code: "JC", name: "中央線", status: "延誤 15 分", tone: "orange", color: "#F15A24" },
    { id: "tsukubaExpress", code: "TX", name: "筑波快線", status: "正常", tone: "green", color: "#003E92" },
    { id: "keio", code: "KO", name: "京王線", status: "延誤 5 分", tone: "orange", color: "#C0007A" },
    { id: "saikyo", code: "JA", name: "埼京線", status: "正常", tone: "green", color: "#00AC9A" },
    { id: "sobu", code: "JB", name: "總武線", status: "正常", tone: "green", color: "#FFD400" },
    { id: "marunouchi", code: "M", name: "東京 Metro 丸之內線", status: "正常", tone: "green", color: "#F62E36" },
    { id: "ginza", code: "G", name: "東京 Metro 銀座線", status: "正常", tone: "green", color: "#F39700" },
    { id: "keihinTohoku", code: "JK", name: "京濱東北線", status: "正常", tone: "green", color: "#00A7E3" },
    { id: "odakyu", code: "OH", name: "小田急線", status: "正常", tone: "green", color: "#2288CC" },
  ],
  ja: [
    { id: "yamanote", code: "JY", name: "山手線", status: "平常運転", tone: "green", color: "#65B32E" },
    { id: "metroTozai", code: "T", name: "東京メトロ東西線", status: "平常運転", tone: "green", color: "#00A7DB" },
    { id: "chuo", code: "JC", name: "中央線", status: "15分遅延", tone: "orange", color: "#F15A24" },
    { id: "tsukubaExpress", code: "TX", name: "つくばエクスプレス", status: "平常運転", tone: "green", color: "#003E92" },
    { id: "keio", code: "KO", name: "京王線", status: "5分遅延", tone: "orange", color: "#C0007A" },
    { id: "saikyo", code: "JA", name: "埼京線", status: "平常運転", tone: "green", color: "#00AC9A" },
    { id: "sobu", code: "JB", name: "総武線", status: "平常運転", tone: "green", color: "#FFD400" },
    { id: "marunouchi", code: "M", name: "東京メトロ丸ノ内線", status: "平常運転", tone: "green", color: "#F62E36" },
    { id: "ginza", code: "G", name: "東京メトロ銀座線", status: "平常運転", tone: "green", color: "#F39700" },
    { id: "keihinTohoku", code: "JK", name: "京浜東北線", status: "平常運転", tone: "green", color: "#00A7E3" },
    { id: "odakyu", code: "OH", name: "小田急線", status: "平常運転", tone: "green", color: "#2288CC" },
  ],
};

export const trainStatusApiPlaceholder = {
  endpoint: null,
  note: "Future API integration point for Tokyo rail operation status.",
};
