export type TrainStatusTone = "green" | "orange" | "red";
export type TrainStatusLanguage = "zh-CN" | "zh-TW" | "ja";

type LocalizedRailName = Record<TrainStatusLanguage, string>;

type TrainStatusLineConfig = {
  code: string;
  codeTextColor: string;
  color: string;
  id: string;
  name: LocalizedRailName;
  railways: string[];
};

const normalStatus: Record<TrainStatusLanguage, string> = {
  "zh-CN": "正常",
  "zh-TW": "正常",
  ja: "平常運転",
};

export const tokyoRailLineConfigs = [
  rail("yamanote", "JY", "#65B32E", "#FFFFFF", ["山手线", "山手線", "山手線"], ["odpt.Railway:JR-East.Yamanote"]),
  rail("keihinTohoku", "JK", "#00A7E3", "#FFFFFF", ["京滨东北线", "京濱東北線", "京浜東北線・根岸線"], ["odpt.Railway:JR-East.KeihinTohokuNegishi"]),
  rail("chuoRapid", "JC", "#F15A24", "#FFFFFF", ["中央快速线", "中央快速線", "中央線快速"], ["odpt.Railway:JR-East.ChuoRapid"]),
  rail("chuoSobuLocal", "JB", "#FFD400", "#111827", ["中央・总武各站停车", "中央・總武各站停車", "中央・総武線各駅停車"], ["odpt.Railway:JR-East.ChuoSobuLocal"]),
  rail("saikyo", "JA", "#00AC9A", "#FFFFFF", ["埼京线", "埼京線", "埼京線・川越線"], ["odpt.Railway:JR-East.SaikyoKawagoe"]),
  rail("shonanShinjuku", "JS", "#E21F26", "#FFFFFF", ["湘南新宿线", "湘南新宿線", "湘南新宿ライン"], ["odpt.Railway:JR-East.ShonanShinjuku"]),
  rail("tokaido", "JT", "#F68B1F", "#FFFFFF", ["东海道线", "東海道線", "東海道線"], ["odpt.Railway:JR-East.Tokaido"]),
  rail("yokosuka", "JO", "#007AC0", "#FFFFFF", ["横须贺线", "橫須賀線", "横須賀線"], ["odpt.Railway:JR-East.Yokosuka"]),
  rail("sobuRapid", "JO", "#007AC0", "#FFFFFF", ["总武快速线", "總武快速線", "総武線快速"], ["odpt.Railway:JR-East.SobuRapid"]),
  rail("keiyo", "JE", "#C9242F", "#FFFFFF", ["京叶线", "京葉線", "京葉線"], ["odpt.Railway:JR-East.Keiyo"]),
  rail("jobanRapid", "JJ", "#00B261", "#FFFFFF", ["常磐快速线", "常磐快速線", "常磐線快速"], ["odpt.Railway:JR-East.JobanRapid"]),
  rail("jobanLocal", "JL", "#00B261", "#FFFFFF", ["常磐各站停车", "常磐各站停車", "常磐線各駅停車"], ["odpt.Railway:JR-East.JobanLocal"]),
  rail("utsunomiya", "JU", "#F68B1F", "#FFFFFF", ["宇都宫线", "宇都宮線", "宇都宮線"], ["odpt.Railway:JR-East.Utsunomiya"]),
  rail("takasaki", "JU", "#F68B1F", "#FFFFFF", ["高崎线", "高崎線", "高崎線"], ["odpt.Railway:JR-East.Takasaki"]),

  rail("metroGinza", "G", "#FF9500", "#FFFFFF", ["东京 Metro 银座线", "東京 Metro 銀座線", "東京メトロ銀座線"], ["odpt.Railway:TokyoMetro.Ginza"]),
  rail("metroMarunouchi", "M", "#F62E36", "#FFFFFF", ["东京 Metro 丸之内线", "東京 Metro 丸之內線", "東京メトロ丸ノ内線"], ["odpt.Railway:TokyoMetro.Marunouchi", "odpt.Railway:TokyoMetro.MarunouchiBranch"]),
  rail("metroHibiya", "H", "#B5B5AC", "#111827", ["东京 Metro 日比谷线", "東京 Metro 日比谷線", "東京メトロ日比谷線"], ["odpt.Railway:TokyoMetro.Hibiya"]),
  rail("metroTozai", "T", "#009BBF", "#FFFFFF", ["东京 Metro 东西线", "東京 Metro 東西線", "東京メトロ東西線"], ["odpt.Railway:TokyoMetro.Tozai"]),
  rail("metroChiyoda", "C", "#00BB85", "#FFFFFF", ["东京 Metro 千代田线", "東京 Metro 千代田線", "東京メトロ千代田線"], ["odpt.Railway:TokyoMetro.Chiyoda"]),
  rail("metroYurakucho", "Y", "#C1A470", "#111827", ["东京 Metro 有乐町线", "東京 Metro 有樂町線", "東京メトロ有楽町線"], ["odpt.Railway:TokyoMetro.Yurakucho"]),
  rail("metroHanzomon", "Z", "#8F76D6", "#FFFFFF", ["东京 Metro 半藏门线", "東京 Metro 半藏門線", "東京メトロ半蔵門線"], ["odpt.Railway:TokyoMetro.Hanzomon"]),
  rail("metroNamboku", "N", "#00AC9B", "#FFFFFF", ["东京 Metro 南北线", "東京 Metro 南北線", "東京メトロ南北線"], ["odpt.Railway:TokyoMetro.Namboku"]),
  rail("metroFukutoshin", "F", "#9C5E31", "#FFFFFF", ["东京 Metro 副都心线", "東京 Metro 副都心線", "東京メトロ副都心線"], ["odpt.Railway:TokyoMetro.Fukutoshin"]),

  rail("toeiAsakusa", "A", "#FF535F", "#FFFFFF", ["都营浅草线", "都營淺草線", "都営浅草線"], ["odpt.Railway:Toei.Asakusa"]),
  rail("toeiMita", "I", "#0067B0", "#FFFFFF", ["都营三田线", "都營三田線", "都営三田線"], ["odpt.Railway:Toei.Mita"]),
  rail("toeiShinjuku", "S", "#9FB01C", "#111827", ["都营新宿线", "都營新宿線", "都営新宿線"], ["odpt.Railway:Toei.Shinjuku"]),
  rail("toeiOedo", "E", "#CF3366", "#FFFFFF", ["都营大江户线", "都營大江戶線", "都営大江戸線"], ["odpt.Railway:Toei.Oedo"]),
  rail("nipporiToneri", "NT", "#00A7C8", "#FFFFFF", ["日暮里・舍人线", "日暮里・舍人線", "日暮里・舎人ライナー"], ["odpt.Railway:Toei.NipporiToneri"]),
  rail("todenArakawa", "SA", "#E85298", "#FFFFFF", ["东京樱花电车（都电荒川线）", "東京櫻花電車（都電荒川線）", "東京さくらトラム（都電荒川線）"], ["odpt.Railway:Toei.Arakawa"]),

  rail("tokyuToyoko", "TY", "#DA0442", "#FFFFFF", ["东急东横线", "東急東橫線", "東急東横線"], ["odpt.Railway:Tokyu.Toyoko"]),
  rail("tokyuMeguro", "MG", "#009CD3", "#FFFFFF", ["东急目黑线", "東急目黑線", "東急目黒線"], ["odpt.Railway:Tokyu.Meguro"]),
  rail("tokyuDenentoshi", "DT", "#20A288", "#FFFFFF", ["东急田园都市线", "東急田園都市線", "東急田園都市線"], ["odpt.Railway:Tokyu.DenEnToshi"]),
  rail("tokyuOimachi", "OM", "#F18C43", "#FFFFFF", ["东急大井町线", "東急大井町線", "東急大井町線"], ["odpt.Railway:Tokyu.Oimachi"]),
  rail("tokyuIkegami", "IK", "#EE86A7", "#111827", ["东急池上线", "東急池上線", "東急池上線"], ["odpt.Railway:Tokyu.Ikegami"]),

  rail("keio", "KO", "#C0007A", "#FFFFFF", ["京王线", "京王線", "京王線"], ["odpt.Railway:Keio.Keio"]),
  rail("keioNew", "KO", "#C0007A", "#FFFFFF", ["京王新线", "京王新線", "京王新線"], ["odpt.Railway:Keio.KeioNew"]),
  rail("keioInokashira", "IN", "#003E7E", "#FFFFFF", ["京王井之头线", "京王井之頭線", "京王井の頭線"], ["odpt.Railway:Keio.Inokashira"]),
  rail("odakyuOdawara", "OH", "#2288CC", "#FFFFFF", ["小田急小田原线", "小田急小田原線", "小田急小田原線"], ["odpt.Railway:Odakyu.Odawara"]),

  rail("seibuIkebukuro", "SI", "#EE7A00", "#FFFFFF", ["西武池袋线", "西武池袋線", "西武池袋線"], ["odpt.Railway:Seibu.Ikebukuro"]),
  rail("seibuShinjuku", "SS", "#00A6BF", "#FFFFFF", ["西武新宿线", "西武新宿線", "西武新宿線"], ["odpt.Railway:Seibu.Shinjuku"]),
  rail("seibuYurakucho", "SI", "#EE7A00", "#FFFFFF", ["西武有乐町线", "西武有樂町線", "西武有楽町線"], ["odpt.Railway:Seibu.SeibuYurakucho"]),
  rail("seibuToshima", "SI", "#EE7A00", "#FFFFFF", ["西武丰岛线", "西武豐島線", "西武豊島線"], ["odpt.Railway:Seibu.Toshima"]),

  rail("tobuTojo", "TJ", "#004098", "#FFFFFF", ["东武东上线", "東武東上線", "東武東上線"], ["odpt.Railway:Tobu.Tojo"]),
  rail("tobuSkytree", "TS", "#0F6CC3", "#FFFFFF", ["东武晴空塔线", "東武晴空塔線", "東武スカイツリーライン"], ["odpt.Railway:Tobu.TobuSkytree"]),
  rail("tobuSkytreeBranch", "TS", "#0F6CC3", "#FFFFFF", ["东武晴空塔线押上支线", "東武晴空塔線押上支線", "東武スカイツリーライン（押上-曳舟）"], ["odpt.Railway:Tobu.TobuSkytreeBranch"]),

  rail("keiseiMain", "KS", "#005AAA", "#FFFFFF", ["京成本线", "京成本線", "京成本線"], ["odpt.Railway:Keisei.Main"]),
  rail("keiseiOshiage", "KS", "#005AAA", "#FFFFFF", ["京成押上线", "京成押上線", "京成押上線"], ["odpt.Railway:Keisei.Oshiage"]),
  rail("keiseiNaritaSkyAccess", "KS", "#F7931D", "#111827", ["成田 Sky Access 线", "成田 Sky Access 線", "成田スカイアクセス線"], ["odpt.Railway:Keisei.NaritaSkyAccess"]),
  rail("keikyuMain", "KK", "#00BFFF", "#111827", ["京急本线", "京急本線", "京急本線"], ["odpt.Railway:Keikyu.Main"]),
  rail("keikyuAirport", "KK", "#00BFFF", "#111827", ["京急机场线", "京急機場線", "京急空港線"], ["odpt.Railway:Keikyu.Airport"]),

  rail("tsukubaExpress", "TX", "#003E92", "#FFFFFF", ["筑波快线", "筑波快線", "つくばエクスプレス"], ["odpt.Railway:MIR.TsukubaExpress"]),
  rail("rinkai", "R", "#222D65", "#FFFFFF", ["临海线", "臨海線", "りんかい線"], ["odpt.Railway:TWR.Rinkai"]),
  rail("yurikamome", "U", "#0065A6", "#FFFFFF", ["百合海鸥线", "百合海鷗線", "ゆりかもめ"], ["odpt.Railway:Yurikamome.Yurikamome"]),
  rail("tokyoMonorail", "MO", "#1F77B4", "#FFFFFF", ["东京单轨电车羽田机场线", "東京單軌電車羽田機場線", "東京モノレール羽田空港線"], ["odpt.Railway:TokyoMonorail.HanedaAirport"]),
  rail("saitamaRailway", "SR", "#1B9D5A", "#FFFFFF", ["埼玉高速铁道线", "埼玉高速鐵道線", "埼玉高速鉄道線"], ["odpt.Railway:SaitamaRailway.SaitamaRailway"]),
] as const satisfies readonly TrainStatusLineConfig[];

export type TrainStatusLineId = (typeof tokyoRailLineConfigs)[number]["id"];

export type TrainStatusLine = {
  id: TrainStatusLineId;
  code: string;
  name: string;
  status: string;
  tone: TrainStatusTone;
  color: string;
  codeTextColor: string;
  detail?: string;
  source?: "local" | "odpt";
  updatedAt?: string;
};

export const maxHomeRailLineCount = 2;
export const defaultHomeRailLineIds = ["yamanote", "chuoRapid"] as const satisfies readonly TrainStatusLineId[];

export const tokyoTrainStatusLines: Record<TrainStatusLanguage, TrainStatusLine[]> = {
  "zh-CN": createLines("zh-CN"),
  "zh-TW": createLines("zh-TW"),
  ja: createLines("ja"),
};

export const trainStatusApiPlaceholder = {
  endpoint: "/api/train-status/odpt",
  note: "ODPT TrainInformation integration for Tokyo 23-ku rail status.",
};

function createLines(language: TrainStatusLanguage): TrainStatusLine[] {
  return tokyoRailLineConfigs.map((line) => ({
    code: line.code,
    codeTextColor: line.codeTextColor,
    color: line.color,
    id: line.id,
    name: line.name[language],
    status: normalStatus[language],
    tone: "green",
  }));
}

function rail(id: string, code: string, color: string, codeTextColor: string, names: [string, string, string], railways: string[]): TrainStatusLineConfig {
  return {
    code,
    codeTextColor,
    color,
    id,
    name: {
      "zh-CN": names[0],
      "zh-TW": names[1],
      ja: names[2],
    },
    railways,
  };
}
