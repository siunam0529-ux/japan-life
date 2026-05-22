export type AreaItem = {
  id: string;
  name: string;
  subtitle: string;
  rent: number;
  wage: number;
  tags: string[];
  updatedAt: string;
  nameZhCN: string;
  nameZhTW: string;
  nameJa: string;
  nameEn: string;
  averageRent: number;
  averageWage: number;
  transportScore: number;
  foreignerFriendlyScore: number;
  livingConvenienceScore: number;
  safetyScore: number;
  chineseResourceScore: number;
  recommendedForZhCN: string;
  recommendedForZhTW: string;
  recommendedForJa: string;
  prosZhCN: string[];
  prosZhTW: string[];
  prosJa: string[];
  consZhCN: string[];
  consZhTW: string[];
  consJa: string[];
};

type Seed = [string, string, string, string, string, number, number, number, number, number, number, number, string, string, string, string[], string[]];

const updatedAt = "2026-05-21";

const seeds: Seed[] = [
  ["chiyoda-akihabara", "千代田区", "千代田區", "千代田区", "Akihabara / Tokyo", 138000, 1350, 95, 65, 92, 88, 68, "工作族、喜欢通勤方便的人", "上班族、重視通勤方便的人", "通勤重視の会社員", ["交通极强", "办公区多", "治安稳定"], ["房租高", "生活氛围偏商务"]],
  ["chuo-nihonbashi", "中央区", "中央區", "中央区", "Ginza / Nihonbashi", 132000, 1320, 95, 62, 90, 86, 60, "工作族、想住市中心的人", "上班族、想住市中心的人", "都心に住みたい人", ["商业资源多", "通勤方便"], ["房租高", "日常物价偏高"]],
  ["minato-shinagawa", "港区", "港區", "港区", "Roppongi / Shinagawa", 155000, 1400, 96, 78, 92, 84, 72, "高收入工作族、国际环境偏好者", "高收入上班族、喜歡國際環境的人", "国際的な環境が好きな人", ["国际化", "交通强", "餐饮选择多"], ["房租很高", "生活成本高"]],
  ["shinjuku", "新宿", "新宿", "新宿", "Shinjuku / Shin-Okubo", 105000, 1250, 98, 88, 95, 72, 86, "留学生、工作族、喜欢热闹的人", "留學生、上班族、喜歡熱鬧的人", "留学生・にぎやかな街が好きな人", ["交通最方便", "中文和外国人资源多", "打工机会多"], ["人多复杂", "安静居住感较弱"]],
  ["bunkyo", "文京区", "文京區", "文京区", "Bunkyo / Hongo", 96000, 1180, 82, 72, 82, 92, 60, "学生、家庭、重视安静的人", "學生、家庭、重視安靜的人", "学生・ファミリー", ["文教氛围好", "治安好"], ["娱乐和夜生活少", "房租不算低"]],
  ["taito-ueno", "上野", "上野", "上野", "Ueno / Asakusa", 82000, 1120, 86, 78, 82, 74, 72, "留学生、预算中等、喜欢下町的人", "留學生、預算中等、喜歡下町的人", "下町が好きな人", ["交通方便", "房租相对可控", "生活店铺多"], ["部分区域较杂", "游客多"]],
  ["sumida-kinshicho", "墨田区", "墨田區", "墨田区", "Kinshicho / Skytree", 79000, 1100, 82, 70, 78, 72, 58, "想省房租又要进城方便的人", "想省房租又想進城方便的人", "家賃を抑えたい人", ["房租较低", "到市中心方便"], ["区域差异较大", "中文资源一般"]],
  ["koto", "江东区", "江東區", "江東区", "Toyosu / Kameido", 88000, 1130, 82, 68, 80, 82, 55, "家庭、通勤族、喜欢新城区的人", "家庭、通勤族、喜歡新市區的人", "ファミリー・通勤重視", ["居住环境新", "大型商场多"], ["热门区域房租上升", "夜生活少"]],
  ["shinagawa", "品川区", "品川區", "品川区", "Shinagawa / Gotanda", 105000, 1220, 94, 74, 85, 82, 62, "工作族、常去机场或新干线的人", "上班族、常去機場或新幹線的人", "出張が多い人", ["交通强", "就业机会多"], ["房租偏高", "生活成本偏高"]],
  ["meguro", "目黑区", "目黑區", "目黒区", "Nakameguro / Jiyugaoka", 118000, 1220, 84, 65, 88, 86, 52, "重视生活品质的人", "重視生活品質的人", "暮らしの雰囲気重視", ["环境好", "餐饮咖啡多"], ["房租高", "中文资源少"]],
  ["ota-kamata", "大田区", "大田區", "大田区", "Kamata / Haneda", 78000, 1120, 82, 76, 78, 76, 65, "预算优先、机场相关工作者", "預算優先、機場相關工作者", "空港利用が多い人", ["房租可控", "去羽田方便"], ["到部分市中心略远", "区域差异大"]],
  ["setagaya", "世田谷区", "世田谷區", "世田谷区", "Sangenjaya / Shimokitazawa", 95000, 1150, 80, 68, 84, 86, 55, "家庭、喜欢安静住宅区的人", "家庭、喜歡安靜住宅區的人", "落ち着いた住宅街が好きな人", ["住宅环境好", "生活便利"], ["通勤看线路", "热门站房租高"]],
  ["shibuya", "涩谷区", "澀谷區", "渋谷区", "Shibuya / Ebisu", 125000, 1320, 96, 78, 92, 72, 68, "年轻工作族、喜欢潮流热闹的人", "年輕上班族、喜歡潮流熱鬧的人", "若い会社員・流行が好きな人", ["机会多", "交通强", "娱乐多"], ["房租高", "人流大"]],
  ["nakano", "中野区", "中野區", "中野区", "Nakano", 82000, 1120, 84, 78, 82, 78, 66, "留学生、工作族、想平衡预算的人", "留學生、上班族、想平衡預算的人", "バランス重視", ["去新宿方便", "房租相对适中"], ["热门区域竞争高", "部分街区较旧"]],
  ["suginami", "杉并区", "杉並區", "杉並区", "Koenji / Ogikubo", 78000, 1100, 82, 76, 80, 84, 58, "想省房租、喜欢生活感的人", "想省房租、喜歡生活感的人", "家賃と暮らしやすさ重視", ["生活氛围好", "房租可控"], ["通勤看线路", "中文资源一般"]],
  ["toshima-ikebukuro", "池袋", "池袋", "池袋", "Ikebukuro / Toshima", 88000, 1150, 94, 90, 90, 72, 92, "留学生、中文资源优先、喜欢热闹的人", "留學生、中文資源優先、喜歡熱鬧的人", "中国語リソース重視", ["中文资源多", "交通方便", "购物餐饮强"], ["人多复杂", "安静感较弱"]],
  ["kita-akabane", "北区", "北區", "北区", "Akabane / Oji", 70000, 1080, 82, 76, 76, 78, 58, "想省房租、通勤到池袋上野的人", "想省房租、通勤到池袋上野的人", "家賃を抑えたい人", ["房租低", "交通不错"], ["商业密度一般", "中文资源一般"]],
  ["arakawa-nippori", "荒川区", "荒川區", "荒川区", "Nippori / Minowa", 69000, 1060, 82, 76, 72, 76, 62, "预算优先、常去上野日暮里的人", "預算優先、常去上野日暮里的人", "予算重視", ["房租低", "去上野方便"], ["生活便利度中等", "部分区域老旧"]],
  ["itabashi", "板桥", "板橋", "板橋", "Itabashi / Narimasu", 73000, 1050, 72, 76, 72, 82, 58, "想省房租、喜欢安静的人", "想省房租、喜歡安靜的人", "静かに住みたい人", ["房租较低", "住宅区安静"], ["交通便利度不如核心区", "中文资源较少"]],
  ["nerima", "练马区", "練馬區", "練馬区", "Nerima", 72000, 1050, 72, 68, 72, 86, 45, "家庭、预算优先、喜欢安静的人", "家庭、預算優先、喜歡安靜的人", "ファミリー・静かな環境", ["房租低", "治安较好"], ["到市中心时间较长", "中文资源少"]],
  ["adachi-kitasenju", "足立区", "足立區", "足立区", "Kita-Senju", 66000, 1040, 80, 76, 74, 70, 58, "预算优先、想住北千住附近的人", "預算優先、想住北千住附近的人", "北千住周辺に住みたい人", ["房租低", "北千住交通强"], ["区域印象差异大", "安全感需看街区"]],
  ["katsushika", "葛饰区", "葛飾區", "葛飾区", "Katsushika", 64000, 1030, 68, 68, 68, 78, 45, "想最大限度省房租的人", "想最大限度省房租的人", "家賃最優先", ["房租很低", "生活节奏慢"], ["通勤时间较长", "中文资源少"]],
  ["edogawa-kasai", "江户川区", "江戶川區", "江戸川区", "Kasai / Koiwa", 70000, 1040, 72, 78, 74, 78, 70, "家庭、预算优先、需要中文资源的人", "家庭、預算優先、需要中文資源的人", "家族・中国語リソース重視", ["房租较低", "部分区域中文资源多"], ["到西侧通勤较远", "区域选择要看线路"]],
  ["takadanobaba", "高田马场", "高田馬場", "高田馬場", "Takadanobaba", 76000, 1100, 90, 88, 86, 74, 84, "留学生、预算中等、需要学校资源的人", "留學生、預算中等、需要學校資源的人", "留学生・学校周辺", ["留学生多", "交通方便", "餐饮便宜"], ["站周边较吵", "热门房源竞争大"]],
  ["shinokubo", "新大久保", "新大久保", "新大久保", "Shin-Okubo", 86000, 1130, 88, 86, 86, 68, 78, "喜欢热闹、多语言资源的人", "喜歡熱鬧、多語言資源的人", "多文化エリアが好きな人", ["多语言资源多", "餐饮丰富"], ["人流密集", "居住安静度较弱"]],
  ["kichijoji", "吉祥寺", "吉祥寺", "吉祥寺", "Kichijoji", 90000, 1150, 82, 74, 88, 86, 58, "喜欢生活品质、家庭和工作族", "喜歡生活品質、家庭和上班族", "暮らしやすさ重視", ["生活便利", "环境好"], ["房租偏高", "进城需看线路"]],
  ["tachikawa", "立川", "立川", "立川", "Tachikawa", 68000, 1080, 78, 72, 78, 80, 48, "预算优先、可接受较长通勤的人", "預算優先、可接受較長通勤的人", "郊外で便利に暮らしたい人", ["房租低", "商业设施多"], ["离都心远", "中文资源少"]],
  ["hachioji", "八王子", "八王子", "八王子", "Hachioji", 56000, 1030, 66, 70, 68, 80, 45, "学生、想省房租的人", "學生、想省房租的人", "学生・家賃重視", ["房租很低", "大学多"], ["到都心较远", "打工时薪较低"]],
];

export const areaItems: AreaItem[] = seeds.map(([id, nameZhCN, nameZhTW, nameJa, nameEn, averageRent, averageWage, transportScore, foreignerFriendlyScore, livingConvenienceScore, safetyScore, chineseResourceScore, recommendedForZhCN, recommendedForZhTW, recommendedForJa, prosZhCN, consZhCN]) => ({
  id,
  name: nameZhCN,
  subtitle: nameEn,
  rent: averageRent,
  wage: averageWage,
  tags: prosZhCN.slice(0, 2),
  updatedAt,
  nameZhCN,
  nameZhTW,
  nameJa,
  nameEn,
  averageRent,
  averageWage,
  transportScore,
  foreignerFriendlyScore,
  livingConvenienceScore,
  safetyScore,
  chineseResourceScore,
  recommendedForZhCN,
  recommendedForZhTW,
  recommendedForJa,
  prosZhCN,
  prosZhTW: prosZhCN.map((item) => item.replaceAll("房租", "房租").replaceAll("中文", "中文")),
  prosJa: prosZhCN,
  consZhCN,
  consZhTW: consZhCN.map((item) => item.replaceAll("房租", "房租").replaceAll("中文", "中文")),
  consJa: consZhCN,
}));
