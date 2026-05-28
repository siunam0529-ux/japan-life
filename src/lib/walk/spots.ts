import type { NearbyPlace, NearbyPlaceType, WalkDifficulty, WalkRouteStep, WalkSpot, WalkStepsEstimate, WalkTag, WalkTask } from "@/lib/walk/types";
export type { NearbyPlace, NearbyPlaceType, WalkDifficulty, WalkRouteStep, WalkSpot, WalkStepsEstimate, WalkTag, WalkTask } from "@/lib/walk/types";

export const walkTags: WalkTag[] = ["安静", "文艺", "一个人", "下雨天", "深夜", "小众", "昭和感", "咖啡", "书店", "猫", "公园", "河边", "商店街", "夜景", "低预算", "适合拍照", "老街", "复古", "学生感", "生活感"];

type WalkSpotSeed = Omit<WalkSpot, "nearbyPlaces" | "routeSteps" | "tasks"> & {
  type: "book" | "cafe" | "classic" | "local" | "night" | "park" | "river" | "shopping" | "student";
};

type WalkSpotSeedInput = Partial<WalkSpotSeed> &
  Pick<WalkSpotSeed, "englishName" | "id" | "latitude" | "longitude" | "reason" | "station" | "type" | "walkTask" | "ward">;

type NearbyPlaceSeed = Omit<NearbyPlace, "id" | "latitude" | "longitude" | "note"> & {
  idSuffix: string;
  latitude?: number;
  longitude?: number;
  note?: string;
};

type WalkSpotContentOverride = Partial<WalkSpotSeed> & {
  nearbyPlaces?: NearbyPlaceSeed[];
  routeSteps?: WalkRouteStep[];
  tasks?: WalkTask[];
};

const imageMap: Record<WalkSpotSeed["type"], string> = {
  book: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=1200&q=80",
  cafe: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=1200&q=80",
  classic: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
  local: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&q=80",
  night: "https://images.unsplash.com/photo-1505069446780-4ef442b5207f?auto=format&fit=crop&w=1200&q=80",
  park: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  river: "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1200&q=80",
  shopping: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80",
  student: "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=1200&q=80",
};

const typeDefaults: Record<WalkSpotSeed["type"], Pick<WalkSpotSeed, "bestTime" | "budget" | "difficulty" | "duration" | "stepsEstimate" | "subtitle" | "title" | "weatherTags">> = {
  book: { bestTime: "下午", budget: "¥500-2,000", difficulty: "轻松", duration: "1-2小时", stepsEstimate: "3000步以内", subtitle: "书店、纸张味和安静街角", title: "在书店街慢慢换气", weatherTags: ["阴天", "下雨", "寒冷"] },
  cafe: { bestTime: "下午", budget: "¥800-2,000", difficulty: "轻松", duration: "1-2小时", stepsEstimate: "3000步以内", subtitle: "咖啡、小店和短距离散步", title: "找一家咖啡店坐一下", weatherTags: ["阴天", "下雨", "微风"] },
  classic: { bestTime: "上午", budget: "¥500-1,500", difficulty: "轻松", duration: "1-2小时", stepsEstimate: "3000步以内", subtitle: "老街、招牌和生活小店", title: "走进东京的旧日常", weatherTags: ["晴天", "阴天", "微风"] },
  local: { bestTime: "下午", budget: "¥500-1,800", difficulty: "轻松", duration: "1小时", stepsEstimate: "3000步以内", subtitle: "住宅街、商店街和日常生活", title: "看看真实的东京生活", weatherTags: ["晴天", "阴天", "微风"] },
  night: { bestTime: "晚上", budget: "¥800-2,500", difficulty: "轻松", duration: "1小时", stepsEstimate: "3000步以内", subtitle: "灯光、小巷和短夜散步", title: "晚上短短走一圈", weatherTags: ["夜晚", "微风"] },
  park: { bestTime: "上午", budget: "¥0-1,200", difficulty: "普通", duration: "1-2小时", stepsEstimate: "3000〜6000步", subtitle: "公园、绿意和慢慢走", title: "去有绿意的地方放空", weatherTags: ["晴天", "微风", "炎热"] },
  river: { bestTime: "傍晚", budget: "¥0-1,500", difficulty: "普通", duration: "1-2小时", stepsEstimate: "3000〜6000步", subtitle: "河边、桥和城市风景", title: "沿着水边把心情放慢", weatherTags: ["晴天", "阴天", "微风"] },
  shopping: { bestTime: "下午", budget: "¥500-2,000", difficulty: "轻松", duration: "1-2小时", stepsEstimate: "3000步以内", subtitle: "商店街、小店和橱窗", title: "沿着商店街随便看看", weatherTags: ["晴天", "阴天", "下雨"] },
  student: { bestTime: "下午", budget: "¥500-1,500", difficulty: "轻松", duration: "1-2小时", stepsEstimate: "3000步以内", subtitle: "学生街、书店和便宜小店", title: "走一点学生感的街区", weatherTags: ["晴天", "阴天", "微风"] },
};

const typeMoodTags: Record<WalkSpotSeed["type"], WalkTag[]> = {
  book: ["书店", "安静", "文艺", "下雨天", "一个人"],
  cafe: ["咖啡", "安静", "文艺", "一个人", "适合拍照"],
  classic: ["老街", "昭和感", "安静", "生活感", "适合拍照"],
  local: ["生活感", "低预算", "商店街", "一个人", "安静"],
  night: ["深夜", "夜景", "适合拍照", "一个人", "生活感"],
  park: ["公园", "安静", "一个人", "低预算", "适合拍照"],
  river: ["河边", "安静", "一个人", "适合拍照", "咖啡"],
  shopping: ["商店街", "生活感", "低预算", "一个人", "适合拍照"],
  student: ["学生感", "低预算", "书店", "生活感", "一个人"],
};

const nearbyCoordinateOffsets: Record<NearbyPlaceType, { latitude: number; longitude: number }> = {
  咖啡店: { latitude: 0.0008, longitude: 0.0005 },
  书店: { latitude: 0.0004, longitude: -0.0007 },
  旧书店: { latitude: 0.00045, longitude: -0.00075 },
  神社: { latitude: -0.0008, longitude: -0.0004 },
  公园: { latitude: 0.0011, longitude: -0.0002 },
  商店街: { latitude: -0.0004, longitude: 0.0009 },
  拉面店: { latitude: -0.0006, longitude: 0.0004 },
  便利店: { latitude: 0.0002, longitude: 0.0002 },
  河边: { latitude: 0.0009, longitude: -0.0009 },
  猫咖: { latitude: -0.0002, longitude: 0.0007 },
  小巷: { latitude: -0.0005, longitude: -0.0006 },
  甜品店: { latitude: 0.0005, longitude: 0.0008 },
};

const baseWalkSpotSeeds: WalkSpotSeedInput[] = [
  { id: "nakano", station: "中野", englishName: "Nakano", ward: "中野区", latitude: 35.706, longitude: 139.6657, type: "shopping", moodTags: ["文艺", "一个人", "商店街", "低预算", "生活感"], reason: "适合一个人慢慢逛商店街和小店，不需要特意安排路线。", walkTask: "沿着商店街走一段，找一家没去过的小店停一下。" },
  { id: "koenji", station: "高円寺", englishName: "Koenji", ward: "杉並区", latitude: 35.7055, longitude: 139.6497, type: "shopping", moodTags: ["文艺", "复古", "小众", "低预算", "适合拍照"], reason: "适合找古着店、咖啡店和有个性的小路。", walkTask: "不查评分，随便走进一条看起来有趣的小路。" },
  { id: "asagaya", station: "阿佐ヶ谷", englishName: "Asagaya", ward: "杉並区", latitude: 35.7046, longitude: 139.6359, type: "classic", moodTags: ["安静", "昭和感", "生活感", "一个人", "商店街"], reason: "没有太强的观光感，适合看东京普通生活的细节。", walkTask: "找一家老喫茶店或小店，看看店里的灯和椅子。" },
  { id: "ogikubo", station: "荻窪", englishName: "Ogikubo", ward: "杉並区", latitude: 35.7043, longitude: 139.6201, type: "book", moodTags: ["安静", "一个人", "书店", "昭和感", "低预算"], reason: "适合一个人吃点简单的东西，再慢慢逛书店和街角。", walkTask: "找一本标题让你停下来的书，翻几页就好。" },
  { id: "nishi-ogikubo", station: "西荻窪", englishName: "Nishi-ogikubo", ward: "杉並区", latitude: 35.7038, longitude: 139.5995, type: "cafe", moodTags: ["文艺", "咖啡", "小众", "一个人", "复古"], reason: "小店和咖啡店分散在住宅街里，适合慢慢发现。", walkTask: "挑一家不显眼的咖啡店，坐下十分钟。" },
  { id: "kichijoji", station: "吉祥寺", englishName: "Kichijoji", ward: "武蔵野市", latitude: 35.7031, longitude: 139.5798, type: "park", moodTags: ["公园", "咖啡", "生活感", "一个人", "适合拍照"], reason: "井之头公园和街区都适合慢慢走。", walkTask: "从商店街走到公园，途中只进一家闻起来舒服的小店。" },
  { id: "inokashira-park", station: "井の頭公園", englishName: "Inokashira Park", ward: "三鷹市", latitude: 35.7001, longitude: 139.5833, type: "park", moodTags: ["公园", "安静", "一个人", "低预算", "适合拍照"], reason: "适合把散步变成休息，走累了就坐在水边。", walkTask: "绕池塘走一圈，找一个可以坐下五分钟的位置。" },
  { id: "mitaka", station: "三鷹", englishName: "Mitaka", ward: "三鷹市", latitude: 35.7027, longitude: 139.5607, type: "local", moodTags: ["安静", "生活感", "一个人", "低预算", "小众"], reason: "街区节奏比吉祥寺慢一点，适合不赶时间地走。", walkTask: "沿着住宅街走十五分钟，找一个舒服的街角。" },
  { id: "kokubunji", station: "国分寺", englishName: "Kokubunji", ward: "国分寺市", latitude: 35.7001, longitude: 139.4808, type: "student", moodTags: ["学生感", "低预算", "生活感", "公园", "一个人"], reason: "有学生街和绿地，适合轻松吃点东西再走一段。", walkTask: "找一家便宜小店，买一份能边走边吃的小东西。" },
  { id: "kunitachi", station: "国立", englishName: "Kunitachi", ward: "国立市", latitude: 35.6993, longitude: 139.4467, type: "student", moodTags: ["学生感", "安静", "适合拍照", "一个人", "生活感"], reason: "宽一点的街道和学生感让人容易放慢脚步。", walkTask: "沿着笔直的街道走一段，拍一张安静的街景。" },
  { id: "tachikawa", station: "立川", englishName: "Tachikawa", ward: "立川市", latitude: 35.6983, longitude: 139.4137, type: "park", moodTags: ["公园", "咖啡", "生活感", "适合拍照", "一个人"], reason: "城市功能和公园距离近，适合想走久一点的日子。", walkTask: "先买一杯饮料，再往有绿意的方向走。" },
  { id: "showa-kinen-park", station: "昭和記念公園", englishName: "Showa Kinen Park", ward: "立川市", latitude: 35.7032, longitude: 139.3949, type: "park", moodTags: ["公园", "安静", "低预算", "适合拍照", "一个人"], reason: "适合想彻底离开街道噪音、慢慢走很久的时候。", walkTask: "找一条树影多的路，不看手机走二十分钟。" },
  { id: "takao", station: "高尾", englishName: "Takao", ward: "八王子市", latitude: 35.6425, longitude: 139.2825, type: "park", difficulty: "稍微累", stepsEstimate: "6000步以上", moodTags: ["公园", "安静", "适合拍照", "低预算", "一个人"], reason: "适合想看一点山和空气的日子，但不用做成正式登山。", walkTask: "在站前附近慢慢走，找一个能看到绿色的位置休息。" },
  { id: "shimokitazawa", station: "下北沢", englishName: "Shimokitazawa", ward: "世田谷区", latitude: 35.6616, longitude: 139.6669, type: "cafe", moodTags: ["文艺", "小众", "咖啡", "适合拍照", "复古"], reason: "适合古着、剧场、小咖啡店和随机小巷。", walkTask: "进一家古着店，只挑一件颜色像今天心情的小东西。" },
  { id: "higashi-kitazawa", station: "東北沢", englishName: "Higashi-kitazawa", ward: "世田谷区", latitude: 35.6658, longitude: 139.6729, type: "local", moodTags: ["安静", "小众", "咖啡", "一个人", "生活感"], reason: "比下北沢更安静一点，适合短距离换气。", walkTask: "从车站往人少的一侧走，找一个小店门口停一下。" },
  { id: "yoyogi-uehara", station: "代々木上原", englishName: "Yoyogi-uehara", ward: "渋谷区", latitude: 35.669, longitude: 139.6797, type: "cafe", moodTags: ["安静", "一个人", "咖啡", "文艺", "生活感"], reason: "住宅街和小店之间的距离刚刚好，适合轻松走一小时。", walkTask: "找一家面包店，买一个明天早上也能吃的小面包。" },
  { id: "yoyogi-hachiman", station: "代々木八幡", englishName: "Yoyogi-hachiman", ward: "渋谷区", latitude: 35.6687, longitude: 139.6894, type: "cafe", moodTags: ["咖啡", "老街", "安静", "一个人", "适合拍照"], reason: "神社、坡道和小咖啡店很近，适合不太费力的散步。", walkTask: "先去安静的路边停一下，再找咖啡店休息。" },
  { id: "yoyogi-park", station: "代々木公園", englishName: "Yoyogi Park", ward: "渋谷区", latitude: 35.6717, longitude: 139.6949, type: "park", moodTags: ["公园", "安静", "适合拍照", "低预算", "一个人"], reason: "绿意多，适合想把脑袋清空的时候。", walkTask: "找一条树荫路，慢慢走到不想走为止。" },
  { id: "gotokuji", station: "豪徳寺", englishName: "Gotokuji", ward: "世田谷区", latitude: 35.6537, longitude: 139.6473, type: "classic", moodTags: ["猫", "老街", "安静", "生活感", "适合拍照"], reason: "小街区和猫的印象很强，适合慢慢走老街和住宅街。", walkTask: "找一条安静小路，拍一张有生活感的门口。" },
  { id: "kyodo", station: "経堂", englishName: "Kyodo", ward: "世田谷区", latitude: 35.6515, longitude: 139.6366, type: "student", moodTags: ["学生感", "商店街", "低预算", "生活感", "一个人"], reason: "学生感和商店街都很自然，适合低预算散步。", walkTask: "看看今天街上的人都在做什么，记住一个小细节。" },
  { id: "sangenjaya", station: "三軒茶屋", englishName: "Sangenjaya", ward: "世田谷区", latitude: 35.6436, longitude: 139.6698, type: "night", moodTags: ["深夜", "文艺", "昭和感", "小众", "夜景"], reason: "夜晚小巷里的灯和招牌很有生活感，适合短散步。", walkTask: "从车站往三角地带走，不看地图，让灯牌带路十分钟。" },
  { id: "ikejiri-ohashi", station: "池尻大橋", englishName: "Ikejiri-ohashi", ward: "世田谷区", latitude: 35.6506, longitude: 139.6849, type: "river", moodTags: ["河边", "咖啡", "一个人", "适合拍照", "生活感"], reason: "靠近目黑川，适合沿水边把心情放慢。", walkTask: "沿着河边走十五分钟，中途不看手机。" },
  { id: "shoin-jinja-mae", station: "松陰神社前", englishName: "Shoin-jinja-mae", ward: "世田谷区", latitude: 35.6439, longitude: 139.6536, type: "classic", moodTags: ["老街", "商店街", "安静", "生活感", "低预算"], reason: "小商店街和神社附近很适合轻松短走。", walkTask: "找一家看起来本地的小店，只看橱窗也可以。" },
  { id: "futako-tamagawa", station: "二子玉川", englishName: "Futako-tamagawa", ward: "世田谷区", latitude: 35.6115, longitude: 139.6263, type: "river", moodTags: ["河边", "公园", "适合拍照", "一个人", "咖啡"], reason: "多摩川边开阔，适合想呼吸一点空气的时候。", walkTask: "往河边走，找一个可以看天空的位置坐一下。" },
  { id: "komazawa-daigaku", station: "駒沢大学", englishName: "Komazawa-daigaku", ward: "世田谷区", latitude: 35.6335, longitude: 139.6613, type: "park", moodTags: ["公园", "学生感", "低预算", "一个人", "生活感"], reason: "公园和学生街气氛轻松，适合慢慢绕一圈。", walkTask: "去公园边走一段，再找一家小店买饮料。" },
  { id: "jiyugaoka", station: "自由が丘", englishName: "Jiyugaoka", ward: "目黒区", latitude: 35.6074, longitude: 139.6688, type: "cafe", moodTags: ["文艺", "咖啡", "适合拍照", "一个人", "生活感"], reason: "适合轻松逛小店，给下午一点甜味。", walkTask: "找一家甜品店，只买一个小甜点。" },
  { id: "okusawa", station: "奥沢", englishName: "Okusawa", ward: "世田谷区", latitude: 35.6045, longitude: 139.6722, type: "local", moodTags: ["安静", "生活感", "小众", "一个人", "低预算"], reason: "比自由が丘安静，适合在住宅街里短短换气。", walkTask: "沿着安静小路走十分钟，找一个喜欢的门口。" },
  { id: "denenchofu", station: "田園調布", englishName: "Denenchofu", ward: "大田区", latitude: 35.5968, longitude: 139.6673, type: "local", moodTags: ["安静", "适合拍照", "一个人", "生活感", "小众"], reason: "街道整齐安静，适合想慢慢观察住宅街的时候。", walkTask: "找一条树多的路，拍一张没有人的街景。" },
  { id: "yutenji", station: "祐天寺", englishName: "Yutenji", ward: "目黒区", latitude: 35.6372, longitude: 139.6913, type: "local", moodTags: ["安静", "咖啡", "一个人", "生活感", "小众"], reason: "小店和住宅街都不吵，适合轻松放空。", walkTask: "找一家没排队的小咖啡店，坐一下再回车站。" },
  { id: "gakugei-daigaku", station: "学芸大学", englishName: "Gakugei-daigaku", ward: "目黒区", latitude: 35.6287, longitude: 139.6854, type: "shopping", moodTags: ["商店街", "生活感", "低预算", "一个人", "咖啡"], reason: "商店街有日常感，适合随便逛和看本地生活。", walkTask: "顺着商店街走，不买也可以慢慢看。" },
  { id: "toritsu-daigaku", station: "都立大学", englishName: "Toritsu-daigaku", ward: "目黒区", latitude: 35.6179, longitude: 139.6764, type: "local", moodTags: ["安静", "生活感", "一个人", "咖啡", "小众"], reason: "安静街区和小店平衡得很好，适合不想热闹的下午。", walkTask: "找一个看起来舒服的窗边座位。" },
  { id: "nakameguro", station: "中目黒", englishName: "Naka-meguro", ward: "目黒区", latitude: 35.6444, longitude: 139.6991, type: "river", moodTags: ["河边", "文艺", "咖啡", "一个人", "适合拍照"], reason: "河边、小店和餐馆都近，适合轻松但不无聊的一天。", walkTask: "从车站走到河边，记下一家窗边座位多的店。" },
  { id: "meguro-river", station: "目黒川", englishName: "Meguro River", ward: "目黒区", latitude: 35.6443, longitude: 139.6996, type: "river", moodTags: ["河边", "安静", "文艺", "一个人", "适合拍照"], reason: "适合一边走一边想事情，水边节奏会让人慢下来。", walkTask: "沿河走十五分钟，只记住一个喜欢的窗户。" },
  { id: "daikanyama", station: "代官山", englishName: "Daikanyama", ward: "渋谷区", latitude: 35.6481, longitude: 139.7034, type: "cafe", moodTags: ["文艺", "书店", "咖啡", "适合拍照", "一个人"], reason: "书店、绿意和小路都很近，适合整理心情。", walkTask: "进书店翻三本封面喜欢的书，不买也可以。" },
  { id: "ebisu", station: "恵比寿", englishName: "Ebisu", ward: "渋谷区", latitude: 35.6467, longitude: 139.7101, type: "night", moodTags: ["夜景", "咖啡", "适合拍照", "一个人", "生活感"], reason: "白天和晚上都能短走，适合找一点城市灯光。", walkTask: "找一个能看到街灯的位置，站五分钟。" },
  { id: "shibuya", station: "渋谷", englishName: "Shibuya", ward: "渋谷区", latitude: 35.658, longitude: 139.7016, type: "night", moodTags: ["夜景", "适合拍照", "咖啡", "生活感", "深夜"], reason: "热闹但信息量高，适合短时间感受城市流动。", walkTask: "不去最热闹的路，找一条旁边的小路走十分钟。" },
  { id: "shinsen", station: "神泉", englishName: "Shinsen", ward: "渋谷区", latitude: 35.6572, longitude: 139.6934, type: "night", moodTags: ["小众", "深夜", "咖啡", "适合拍照", "生活感"], reason: "离渋谷很近但安静一些，适合短夜散步。", walkTask: "从热闹处退开一点，找一条灯光舒服的小路。" },
  { id: "harajuku", station: "原宿", englishName: "Harajuku", ward: "渋谷区", latitude: 35.6702, longitude: 139.7027, type: "park", moodTags: ["公园", "适合拍照", "咖啡", "一个人", "生活感"], reason: "人多时可以往绿地和小路走，节奏会轻一点。", walkTask: "避开最拥挤的路，往树多的方向走。" },
  { id: "omotesando", station: "表参道", englishName: "Omotesando", ward: "港区", latitude: 35.6652, longitude: 139.7125, type: "cafe", moodTags: ["咖啡", "适合拍照", "文艺", "一个人", "生活感"], reason: "橱窗和小巷都适合慢慢看，走累了也容易找到咖啡店。", walkTask: "只看橱窗，不进店，也给自己一段漂亮空气。" },
  { id: "gaienmae", station: "外苑前", englishName: "Gaienmae", ward: "港区", latitude: 35.6706, longitude: 139.7173, type: "park", moodTags: ["公园", "适合拍照", "安静", "一个人", "咖啡"], reason: "绿意和街道都清爽，适合晴天或微风天。", walkTask: "沿着树多的路走，拍一张有光的街景。" },
  { id: "nogizaka", station: "乃木坂", englishName: "Nogizaka", ward: "港区", latitude: 35.6665, longitude: 139.7264, type: "cafe", moodTags: ["安静", "文艺", "咖啡", "适合拍照", "一个人"], reason: "美术馆和安静街区附近，适合慢慢走和休息。", walkTask: "找一个安静入口，站一会儿再继续走。" },
  { id: "roppongi", station: "六本木", englishName: "Roppongi", ward: "港区", latitude: 35.6628, longitude: 139.7311, type: "night", moodTags: ["夜景", "适合拍照", "咖啡", "深夜", "生活感"], reason: "适合看一点城市夜色，但只做短距离散步就好。", walkTask: "找一段灯光好看的路，慢慢走完再回车站。" },
  { id: "azabu-juban", station: "麻布十番", englishName: "Azabu-juban", ward: "港区", latitude: 35.6566, longitude: 139.7368, type: "classic", moodTags: ["商店街", "生活感", "咖啡", "适合拍照", "一个人"], reason: "老商店街和现代街区混在一起，适合轻松逛。", walkTask: "在商店街买一个小点心，边走边看招牌。" },
  { id: "shirokanedai", station: "白金台", englishName: "Shirokanedai", ward: "港区", latitude: 35.6379, longitude: 139.7261, type: "park", moodTags: ["安静", "公园", "适合拍照", "一个人", "生活感"], reason: "街道安静，绿意也多，适合想走得干净一点的日子。", walkTask: "找一条树影多的小路，慢慢走十分钟。" },
  { id: "hiroo", station: "広尾", englishName: "Hiroo", ward: "渋谷区", latitude: 35.6515, longitude: 139.7223, type: "cafe", moodTags: ["咖啡", "安静", "生活感", "一个人", "适合拍照"], reason: "生活感和安静街区很舒服，适合短散步和咖啡休息。", walkTask: "找一个不用排队的座位，喝点东西再走。" },
  { id: "meguro", station: "目黒", englishName: "Meguro", ward: "品川区", latitude: 35.6339, longitude: 139.7156, type: "river", moodTags: ["河边", "生活感", "咖啡", "一个人", "适合拍照"], reason: "从车站往河边走，能很快进入适合散步的节奏。", walkTask: "往水边走，不用走远，找一个可以停下的位置。" },
  { id: "fudomae", station: "不動前", englishName: "Fudomae", ward: "品川区", latitude: 35.6251, longitude: 139.7134, type: "local", moodTags: ["生活感", "安静", "商店街", "低预算", "一个人"], reason: "不是旅游地，但小街区很适合看日常。", walkTask: "从车站慢慢绕一圈，看看今天街上的小店。" },
  { id: "musashi-koyama", station: "武蔵小山", englishName: "Musashi-koyama", ward: "品川区", latitude: 35.6205, longitude: 139.7045, type: "shopping", moodTags: ["商店街", "生活感", "低预算", "下雨天", "一个人"], reason: "长商店街适合雨天和低预算散步。", walkTask: "沿着商店街走，挑一家最有生活感的店看看。" },
  { id: "togoshi-ginza", station: "戸越銀座", englishName: "Togoshi-ginza", ward: "品川区", latitude: 35.6156, longitude: 139.7152, type: "shopping", moodTags: ["商店街", "生活感", "低预算", "适合拍照", "一个人"], reason: "适合边走边看本地小吃和招牌，不用太用力计划。", walkTask: "只买一个小吃，慢慢走完一小段商店街。" },
  { id: "gotanda", station: "五反田", englishName: "Gotanda", ward: "品川区", latitude: 35.6264, longitude: 139.7234, type: "river", moodTags: ["河边", "夜景", "生活感", "一个人", "咖啡"], reason: "水边和城市感近，适合下班后短短走一圈。", walkTask: "沿河走一段，不看手机，听听周围声音。" },
  { id: "shinjuku", station: "新宿", englishName: "Shinjuku", ward: "新宿区", latitude: 35.6896, longitude: 139.7006, type: "night", moodTags: ["夜景", "深夜", "适合拍照", "生活感", "咖啡"], reason: "信息量很大，适合短距离观察城市，不适合硬逛太久。", walkTask: "找一条相对安静的侧街，走十分钟就好。" },
  { id: "shinjuku-gyoenmae", station: "新宿御苑前", englishName: "Shinjuku-gyoenmae", ward: "新宿区", latitude: 35.6886, longitude: 139.7101, type: "park", moodTags: ["公园", "安静", "咖啡", "一个人", "适合拍照"], reason: "离热闹的新宿很近，但能很快安静下来。", walkTask: "往绿意多的方向走，找一段不吵的路。" },
  { id: "yotsuya-sanchome", station: "四谷三丁目", englishName: "Yotsuya-sanchome", ward: "新宿区", latitude: 35.6879, longitude: 139.7207, type: "classic", moodTags: ["老街", "小众", "安静", "生活感", "适合拍照"], reason: "小巷和老店比较多，适合随便绕一圈。", walkTask: "走进一条平时不会走的小路，拍一张安静街景。" },
  { id: "yotsuya", station: "四ツ谷", englishName: "Yotsuya", ward: "新宿区", latitude: 35.686, longitude: 139.7301, type: "student", moodTags: ["学生感", "安静", "书店", "生活感", "一个人"], reason: "学校、坡道和安静街道混在一起，适合慢慢走。", walkTask: "找一段坡道，慢慢从上往下走。" },
  { id: "sendagaya", station: "千駄ヶ谷", englishName: "Sendagaya", ward: "渋谷区", latitude: 35.6812, longitude: 139.7117, type: "park", moodTags: ["公园", "安静", "适合拍照", "一个人", "生活感"], reason: "绿地和城市边界感很舒服，适合短暂放空。", walkTask: "往树多的方向走，不赶路地绕一小圈。" },
  { id: "kita-sando", station: "北参道", englishName: "Kita-sando", ward: "渋谷区", latitude: 35.6786, longitude: 139.7051, type: "cafe", moodTags: ["咖啡", "安静", "小众", "适合拍照", "一个人"], reason: "比原宿安静，适合找咖啡和小路。", walkTask: "找一家小咖啡店，坐在角落休息一会儿。" },
  { id: "yoyogi", station: "代々木", englishName: "Yoyogi", ward: "渋谷区", latitude: 35.6831, longitude: 139.702, type: "local", moodTags: ["生活感", "低预算", "一个人", "咖啡", "安静"], reason: "在新宿旁边但更适合短短散步和吃点简单的东西。", walkTask: "从车站出来往人少的一侧走，找一家小店。" },
  { id: "hatsudai", station: "初台", englishName: "Hatsudai", ward: "渋谷区", latitude: 35.6812, longitude: 139.6867, type: "local", moodTags: ["生活感", "安静", "小众", "一个人", "低预算"], reason: "剧场和住宅街附近，适合轻松短走。", walkTask: "找一个安静的路口，观察一分钟人流。" },
  { id: "sasazuka", station: "笹塚", englishName: "Sasazuka", ward: "渋谷区", latitude: 35.6738, longitude: 139.6671, type: "shopping", moodTags: ["商店街", "生活感", "低预算", "一个人", "下雨天"], reason: "商店街和生活圈很自然，适合低预算走走。", walkTask: "沿商店街走到尽头，再换一条路回车站。" },
  { id: "kagurazaka", station: "神楽坂", englishName: "Kagurazaka", ward: "新宿区", latitude: 35.7039, longitude: 139.7344, type: "classic", moodTags: ["老街", "安静", "适合拍照", "文艺", "一个人"], reason: "适合走石板路、小巷和安静餐厅街。", walkTask: "找一条没有走过的坡道，从上往下走。" },
  { id: "iidabashi", station: "飯田橋", englishName: "Iidabashi", ward: "千代田区", latitude: 35.7017, longitude: 139.7456, type: "river", moodTags: ["河边", "书店", "生活感", "一个人", "咖啡"], reason: "水边、学校和办公街之间的距离刚好适合短走。", walkTask: "沿着水边走一段，再找一家咖啡店休息。" },
  { id: "jimbocho", station: "神保町", englishName: "Jimbocho", ward: "千代田区", latitude: 35.6959, longitude: 139.7576, type: "book", moodTags: ["书店", "安静", "文艺", "下雨天", "一个人"], reason: "适合下雨天慢慢逛书店。", walkTask: "走进一家旧书店，翻一本完全不在计划里的书。" },
  { id: "ochanomizu", station: "御茶ノ水", englishName: "Ochanomizu", ward: "千代田区", latitude: 35.6993, longitude: 139.7655, type: "student", moodTags: ["学生感", "书店", "河边", "适合拍照", "一个人"], reason: "桥、乐器店和学生街气氛混在一起，适合轻松观察。", walkTask: "从桥上看一会儿电车，再慢慢走回街区。" },
  { id: "suidobashi", station: "水道橋", englishName: "Suidobashi", ward: "千代田区", latitude: 35.702, longitude: 139.7537, type: "student", moodTags: ["学生感", "生活感", "低预算", "一个人", "书店"], reason: "学校和小店很多，适合便宜吃点东西再走。", walkTask: "找一家学生感的小店，只看菜单也可以。" },
  { id: "kudanshita", station: "九段下", englishName: "Kudanshita", ward: "千代田区", latitude: 35.6956, longitude: 139.7519, type: "classic", moodTags: ["安静", "老街", "公园", "适合拍照", "一个人"], reason: "周围有安静街道和绿意，适合想走得稳一点的时候。", walkTask: "沿着树多的路走，找一个可以停下的地方。" },
  { id: "ichigaya", station: "市ヶ谷", englishName: "Ichigaya", ward: "千代田区", latitude: 35.691, longitude: 139.7357, type: "river", moodTags: ["河边", "安静", "学生感", "一个人", "低预算"], reason: "水边和学校附近很适合短距离换气。", walkTask: "沿水边走十分钟，拍一张安静的桥。" },
  { id: "otemachi", station: "大手町", englishName: "Otemachi", ward: "千代田区", latitude: 35.6846, longitude: 139.7649, type: "local", moodTags: ["夜景", "生活感", "适合拍照", "一个人", "咖啡"], reason: "办公街下班后有另一种安静，适合短走。", walkTask: "找一条人少的办公街，慢慢走到下一个路口。" },
  { id: "tokyo-station", station: "東京駅", englishName: "Tokyo Station", ward: "千代田区", latitude: 35.6812, longitude: 139.7671, type: "night", moodTags: ["夜景", "适合拍照", "咖啡", "一个人", "生活感"], reason: "车站周边适合看城市光和人流，但短走就够。", walkTask: "找一个能看到红砖和灯光的位置，站五分钟。" },
  { id: "marunouchi", station: "丸の内", englishName: "Marunouchi", ward: "千代田区", latitude: 35.6817, longitude: 139.763, type: "night", moodTags: ["夜景", "适合拍照", "咖啡", "一个人", "生活感"], reason: "街道整齐，适合晚上轻轻走一段。", walkTask: "沿着灯光漂亮的路走，不进店也可以。" },
  { id: "hibiya", station: "日比谷", englishName: "Hibiya", ward: "千代田区", latitude: 35.6745, longitude: 139.7597, type: "park", moodTags: ["公园", "夜景", "咖啡", "适合拍照", "一个人"], reason: "公园和城市街景都近，适合白天或傍晚。", walkTask: "从公园边走到有灯光的街角，慢慢绕回。" },
  { id: "ginza", station: "銀座", englishName: "Ginza", ward: "中央区", latitude: 35.6719, longitude: 139.765, type: "night", moodTags: ["夜景", "适合拍照", "咖啡", "生活感", "一个人"], reason: "适合看橱窗和城市灯光，不一定要消费。", walkTask: "只看橱窗，找一个最喜欢的招牌。" },
  { id: "tsukiji", station: "築地", englishName: "Tsukiji", ward: "中央区", latitude: 35.6655, longitude: 139.7707, type: "classic", moodTags: ["老街", "生活感", "低预算", "适合拍照", "一个人"], reason: "早一点去更有生活感，适合看市场周边的小街。", walkTask: "找一条有早晨气息的小路，慢慢走完。" },
  { id: "tsukishima", station: "月島", englishName: "Tsukishima", ward: "中央区", latitude: 35.6638, longitude: 139.7849, type: "river", moodTags: ["河边", "老街", "生活感", "适合拍照", "一个人"], reason: "水边和老街很近，适合慢慢绕。", walkTask: "从小巷走到水边，找一个能看见桥的位置。" },
  { id: "toyosu", station: "豊洲", englishName: "Toyosu", ward: "江東区", latitude: 35.6549, longitude: 139.7962, type: "river", moodTags: ["河边", "夜景", "公园", "适合拍照", "一个人"], reason: "开阔水边适合傍晚和夜景散步。", walkTask: "沿着水边走一段，找一个风舒服的位置。" },
  { id: "kiyosumi-shirakawa", station: "清澄白河", englishName: "Kiyosumi-shirakawa", ward: "江東区", latitude: 35.6828, longitude: 139.7987, type: "cafe", moodTags: ["咖啡", "安静", "一个人", "文艺", "下雨天"], reason: "适合找咖啡店休息，慢慢走街区。", walkTask: "选一家没有排队的咖啡店，写下今天想放下的小事。" },
  { id: "morishita", station: "森下", englishName: "Morishita", ward: "江東区", latitude: 35.6877, longitude: 139.797, type: "local", moodTags: ["生活感", "安静", "低预算", "一个人", "小众"], reason: "比清澄白河更日常，适合看本地街区。", walkTask: "找一家普通小店，观察门口的日常细节。" },
  { id: "monzen-nakacho", station: "門前仲町", englishName: "Monzen-nakacho", ward: "江東区", latitude: 35.6719, longitude: 139.7963, type: "classic", moodTags: ["老街", "商店街", "生活感", "适合拍照", "一个人"], reason: "寺社和商店街都近，适合慢慢走出生活感。", walkTask: "沿着参道方向走，找一个安静角落停一下。" },
  { id: "kiba", station: "木場", englishName: "Kiba", ward: "江東区", latitude: 35.6695, longitude: 139.8061, type: "park", moodTags: ["公园", "河边", "低预算", "一个人", "生活感"], reason: "公园和水边空间比较开阔，适合放空。", walkTask: "找一条水边路，慢慢走到下一个桥。" },
  { id: "kuramae", station: "蔵前", englishName: "Kuramae", ward: "台東区", latitude: 35.7042, longitude: 139.7908, type: "cafe", moodTags: ["咖啡", "文艺", "小众", "河边", "适合拍照"], reason: "适合咖啡、杂货店和隅田川附近散步。", walkTask: "找一家手作杂货店，只看一个想带回家的杯子。" },
  { id: "asakusa", station: "浅草", englishName: "Asakusa", ward: "台東区", latitude: 35.7148, longitude: 139.7967, type: "classic", moodTags: ["老街", "昭和感", "夜景", "适合拍照", "一个人"], reason: "白天热闹，晚上更适合慢慢看灯和街道。", walkTask: "从雷门附近走到水边，找一个能看夜景的位置。" },
  { id: "asakusabashi", station: "浅草橋", englishName: "Asakusabashi", ward: "台東区", latitude: 35.6975, longitude: 139.7847, type: "local", moodTags: ["生活感", "小众", "商店街", "低预算", "一个人"], reason: "手艺材料店和小街多，适合随便看看。", walkTask: "找一家看起来有年代感的小店，只看门口。" },
  { id: "ryogoku", station: "両国", englishName: "Ryogoku", ward: "墨田区", latitude: 35.6969, longitude: 139.7933, type: "river", moodTags: ["河边", "老街", "生活感", "适合拍照", "一个人"], reason: "水边和老街感都在，适合慢慢走一段。", walkTask: "沿着桥附近走，拍一张有水和街道的照片。" },
  { id: "kinshicho", station: "錦糸町", englishName: "Kinshicho", ward: "墨田区", latitude: 35.6969, longitude: 139.8144, type: "local", moodTags: ["生活感", "夜景", "低预算", "一个人", "商店街"], reason: "热闹但很日常，适合观察真实城市生活。", walkTask: "找一条人不太多的商店街，慢慢走一段。" },
  { id: "oshiage", station: "押上", englishName: "Oshiage", ward: "墨田区", latitude: 35.7101, longitude: 139.8129, type: "night", moodTags: ["夜景", "适合拍照", "河边", "生活感", "一个人"], reason: "天空树周边适合夜景短走，不需要排队进景点。", walkTask: "找一个能看到塔但人少的位置，站五分钟。" },
  { id: "ueno", station: "上野", englishName: "Ueno", ward: "台東区", latitude: 35.7138, longitude: 139.777, type: "park", moodTags: ["公园", "老街", "生活感", "低预算", "一个人"], reason: "公园、市场和街区都近，适合想多走一点。", walkTask: "从公园边走到小街，找一个能坐下的位置。" },
  { id: "okachimachi", station: "御徒町", englishName: "Okachimachi", ward: "台東区", latitude: 35.7074, longitude: 139.7746, type: "shopping", moodTags: ["商店街", "生活感", "低预算", "适合拍照", "一个人"], reason: "市场感和小店密度高，适合随便看。", walkTask: "沿着商店街走，只买一个小东西。" },
  { id: "yushima", station: "湯島", englishName: "Yushima", ward: "文京区", latitude: 35.7081, longitude: 139.7699, type: "classic", moodTags: ["老街", "安静", "文艺", "一个人", "适合拍照"], reason: "神社和坡道附近很安静，适合慢慢绕。", walkTask: "找一段坡道，拍一张安静街景。" },
  { id: "nezu", station: "根津", englishName: "Nezu", ward: "文京区", latitude: 35.7174, longitude: 139.7657, type: "classic", moodTags: ["猫", "老街", "安静", "昭和感", "一个人"], reason: "老街和寺社气氛自然，适合慢慢找小店。", walkTask: "不看地图，沿着小巷走到下一个路口。" },
  { id: "sendagi", station: "千駄木", englishName: "Sendagi", ward: "文京区", latitude: 35.725, longitude: 139.7638, type: "classic", moodTags: ["猫", "老街", "安静", "商店街", "生活感"], reason: "商店街和老房子细节很多，适合慢慢看。", walkTask: "买一个小点心，边走边看老招牌。" },
  { id: "yanaka", station: "谷中", englishName: "Yanaka", ward: "台東区", latitude: 35.7275, longitude: 139.766, type: "classic", moodTags: ["猫", "老街", "昭和感", "安静", "适合拍照"], reason: "适合慢慢走老街，看猫和小店。", walkTask: "找一条老街小路，拍一张有生活感的照片。" },
  { id: "nippori", station: "日暮里", englishName: "Nippori", ward: "荒川区", latitude: 35.7278, longitude: 139.7709, type: "classic", moodTags: ["老街", "猫", "生活感", "低预算", "一个人"], reason: "通往谷中的路很适合慢慢走，生活感很强。", walkTask: "从车站往老街方向走，找一个安静拐角。" },
  { id: "sugamo", station: "巣鴨", englishName: "Sugamo", ward: "豊島区", latitude: 35.7335, longitude: 139.7393, type: "classic", moodTags: ["商店街", "昭和感", "生活感", "低预算", "一个人"], reason: "商店街很有本地感，适合不赶时间地看人和店。", walkTask: "沿着商店街走，找一个最有年代感的招牌。" },
  { id: "komagome", station: "駒込", englishName: "Komagome", ward: "豊島区", latitude: 35.7365, longitude: 139.7468, type: "park", moodTags: ["公园", "安静", "低预算", "一个人", "适合拍照"], reason: "绿意和住宅街安静，适合轻松散步。", walkTask: "找一条树多的路，走到心情慢下来。" },
  { id: "otsuka", station: "大塚", englishName: "Otsuka", ward: "豊島区", latitude: 35.7316, longitude: 139.7283, type: "classic", moodTags: ["昭和感", "商店街", "生活感", "夜景", "低预算"], reason: "路面电车和老街感很适合拍照和短走。", walkTask: "沿着电车附近走一段，找一个有灯的街角。" },
  { id: "ikebukuro", station: "池袋", englishName: "Ikebukuro", ward: "豊島区", latitude: 35.7295, longitude: 139.7109, type: "night", moodTags: ["夜景", "书店", "生活感", "深夜", "适合拍照"], reason: "热闹但选择多，适合短时间找书店或咖啡。", walkTask: "避开最拥挤的出口，找一家书店附近停一下。" },
  { id: "mejiro", station: "目白", englishName: "Mejiro", ward: "豊島区", latitude: 35.7212, longitude: 139.7066, type: "student", moodTags: ["学生感", "安静", "一个人", "生活感", "低预算"], reason: "街区比较安静，适合轻轻走一圈。", walkTask: "找一条人少的路，慢慢走到下一个路口。" },
  { id: "zoshigaya", station: "雑司が谷", englishName: "Zoshigaya", ward: "豊島区", latitude: 35.7202, longitude: 139.7155, type: "classic", moodTags: ["老街", "安静", "小众", "一个人", "适合拍照"], reason: "老街和寺社附近很安静，适合放空。", walkTask: "找一个安静的入口，停下来呼吸一下。" },
  { id: "ekoda", station: "江古田", englishName: "Ekoda", ward: "練馬区", latitude: 35.7375, longitude: 139.6726, type: "student", moodTags: ["学生感", "低预算", "商店街", "生活感", "一个人"], reason: "学生街和生活圈很自然，适合便宜轻松地走。", walkTask: "找一家小饭馆或咖啡店，只看菜单也可以。" },
  { id: "oyama", station: "大山", englishName: "Oyama", ward: "板橋区", latitude: 35.7479, longitude: 139.7027, type: "shopping", moodTags: ["商店街", "生活感", "低预算", "昭和感", "一个人"], reason: "长商店街很适合看真实东京生活。", walkTask: "沿商店街走一段，找一家看起来本地的小店。" },
  { id: "kami-itabashi", station: "上板橋", englishName: "Kami-itabashi", ward: "板橋区", latitude: 35.7637, longitude: 139.6762, type: "local", moodTags: ["生活感", "低预算", "商店街", "一个人", "安静"], reason: "不是旅游地，但适合感受真实东京生活。", walkTask: "从车站附近绕一圈，看看普通街区今天的样子。" },
] satisfies WalkSpotSeedInput[];

function normalizeSeed(seed: WalkSpotSeedInput): WalkSpotSeed {
  const defaults = typeDefaults[seed.type];
  const moodTags = Array.from(new Set([...(seed.moodTags ?? []), ...typeMoodTags[seed.type]])).slice(0, 6);
  const budget = seed.budget ?? defaults.budget;
  const difficulty = seed.difficulty ?? defaults.difficulty;
  return {
    ...defaults,
    ...seed,
    area: seed.area ?? `东京・${seed.ward}`,
    budget,
    difficulty,
    image: seed.image ?? imageMap[seed.type],
    moodTags,
    stepsEstimate: seed.stepsEstimate ?? buildStepsEstimate(difficulty),
    suitableFor: seed.suitableFor ?? buildSuitableForFromTags(moodTags, budget, difficulty),
    weatherTags: seed.weatherTags ?? defaults.weatherTags,
  };
}

function getNearbyTemplates(spot: WalkSpotSeed): NearbyPlaceSeed[] {
  const templates: NearbyPlaceSeed[] = [
    { bestFor: ["休息", "一个人", "雨天"], budget: "¥500-1,200", description: "适合散步中途坐一下", distance: "350m", idSuffix: "cafe-01", name: "駅前の小さな喫茶店", type: "咖啡店" },
  ];
  if (spot.moodTags.includes("书店")) templates.push({ bestFor: ["文艺", "一个人", "雨天"], budget: "¥0-2,000", description: "可以慢慢翻几页，不一定要买", distance: "420m", idSuffix: "book-01", name: "商店街の古い本屋", type: "旧书店" });
  else if (spot.moodTags.includes("公园")) templates.push({ bestFor: ["休息", "绿荫", "少花钱"], budget: "¥0", description: "走累了可以坐一会儿", distance: "320m", idSuffix: "park-01", name: "木陰のベンチ", type: "公园" });
  else if (spot.moodTags.includes("河边")) templates.push({ bestFor: ["放空", "拍照", "微风"], budget: "¥0", description: "适合看水和桥，短暂停一下", distance: "500m", idSuffix: "river-01", name: "川沿いのベンチ", type: "河边" });
  else templates.push({ bestFor: ["顺路", "小店", "少花钱"], budget: "¥0-1,500", description: "适合随便走走看看", distance: "460m", idSuffix: "shotengai-01", name: "駅前の小さな商店街", type: "商店街" });

  if (spot.moodTags.includes("猫")) templates.push({ bestFor: ["猫", "安静", "短暂停留"], budget: "¥800-1,500", description: "如果想休息，可以找附近猫主题小店", distance: "550m", idSuffix: "cat-01", name: "猫に会えそうな小さな店", type: "猫咖" });
  else if (spot.moodTags.includes("老街") || spot.moodTags.includes("昭和感")) templates.push({ bestFor: ["安静", "老街", "拍照"], budget: "¥0", description: "不显眼的小路旁，适合短暂停一下", distance: "300m", idSuffix: "alley-01", name: "路地裏の小さな道", type: "小巷" });
  else templates.push({ bestFor: ["补给", "深夜", "省钱"], budget: "¥150-800", description: "买瓶水或热饮，给散步留一点余裕", distance: "180m", idSuffix: "konbini-01", name: "近くのコンビニ", type: "便利店" });

  if (spot.moodTags.includes("低预算")) templates.push({ bestFor: ["热食", "低预算", "短暂停留"], budget: "¥800-1,300", description: "散步后吃一碗热的再回家", distance: "280m", idSuffix: "ramen-01", name: "駅前の小さなラーメン店", type: "拉面店" });
  else templates.push({ bestFor: ["甜味", "休息", "拍照"], budget: "¥500-1,300", description: "适合给下午一点小奖励", distance: "380m", idSuffix: "sweet-01", name: "路地裏の小さな甘味店", type: "甜品店" });
  return templates.slice(0, 4);
}

function buildNearbyPlaces(spot: WalkSpotSeed, places: NearbyPlaceSeed[] = getNearbyTemplates(spot)): NearbyPlace[] {
  return places.map((place) => {
    const offset = nearbyCoordinateOffsets[place.type];
    return {
      ...place,
      id: `${spot.id}-${place.idSuffix}`,
      latitude: place.latitude ?? Number((spot.latitude + offset.latitude).toFixed(6)),
      longitude: place.longitude ?? Number((spot.longitude + offset.longitude).toFixed(6)),
      note: place.note ?? "实际营业时间请以地图 APP 为准",
    };
  });
}

function buildRouteSteps(spot: WalkSpotSeed): WalkRouteStep[] {
  const middle = spot.moodTags.includes("书店")
    ? "先沿着书店或小店多的路慢慢走"
    : spot.moodTags.includes("河边")
      ? "往水边方向走，找一段风舒服的路"
      : spot.moodTags.includes("公园")
        ? "往绿意多的方向走，不用急着到终点"
        : spot.moodTags.includes("商店街")
          ? "沿着商店街慢慢看橱窗和招牌"
          : "绕进一条平时不会走的小路";
  return [
    { stepTitle: `从${spot.station}站出发`, stepDescription: "先不要急着查评分，沿着人少的一侧慢慢走。" },
    { stepTitle: "进入今天的街区", stepDescription: middle },
    { stepTitle: "找一个停下来的点", stepDescription: spot.moodTags.includes("下雨天") ? "进咖啡店或书店躲一会儿雨。" : "找一个可以坐下或拍照的位置，休息五分钟。" },
    { stepTitle: "换一条路回车站", stepDescription: "把今天发现的小地方记下来，下次可以再来。" },
  ];
}

function buildTasks(spot: WalkSpotSeed) {
  const secondTask = spot.moodTags.includes("咖啡") ? "买一杯咖啡慢慢喝" : spot.moodTags.includes("书店") ? "翻一本完全不在计划里的书" : spot.moodTags.includes("河边") ? "沿水边走十分钟不看手机" : "拍一张安静街景";
  return [spot.walkTask, secondTask, "走进一条平时不会走的小路"];
}

function buildStepsEstimate(difficulty: WalkDifficulty): WalkStepsEstimate {
  if (difficulty === "稍微累") return "6000步以上";
  if (difficulty === "普通") return "3000〜6000步";
  return "3000步以内";
}

function buildSuitableForFromTags(tags: WalkTag[], budget: string, difficulty: WalkDifficulty) {
  const next = new Set<string>();
  if (tags.includes("一个人")) next.add("一个人");
  if (tags.includes("安静")) next.add("想放空");
  if (tags.includes("下雨天")) next.add("下雨天");
  if (tags.includes("咖啡")) next.add("咖啡休息");
  if (tags.includes("适合拍照")) next.add("拍照");
  if (tags.includes("商店街")) next.add("随便逛");
  if (budget.includes("¥0") || budget.includes("¥500") || tags.includes("低预算")) next.add("低预算");
  if (difficulty === "轻松") next.add("今天有点累");
  return Array.from(next).slice(0, 5);
}

function nearby(idSuffix: string, type: NearbyPlaceType, name: string, distance: string, description: string, budget: string, bestFor: string[]): NearbyPlaceSeed {
  return { bestFor, budget, description, distance, idSuffix, name, type };
}

function route(station: string, middleTitle: string, middleDescription: string, restDescription: string): WalkRouteStep[] {
  return [
    { stepTitle: `从${station}站出发`, stepDescription: "先把步速放慢，沿着人比较自然的一侧开始走。" },
    { stepTitle: middleTitle, stepDescription: middleDescription },
    { stepTitle: "找一个停下来的点", stepDescription: restDescription },
    { stepTitle: "换一条小路回去", stepDescription: "不要原路返回，绕一点点路，把今天看到的小细节记下来。" },
  ];
}

const prioritySpotContent: Record<string, WalkSpotContentOverride> = {
  nakano: {
    title: "一个人也很好逛的商店街",
    subtitle: "小店、旧楼和很普通但舒服的生活感",
    moodTags: ["文艺", "一个人", "商店街", "低预算", "生活感", "适合拍照"],
    reason: "中野适合没有目的地慢慢走。商店街热闹但不端着，转进旁边的小路又会安静下来。",
    walkTask: "从商店街走到小巷，找一家看起来本地人会进去的小店停一下。",
    tasks: ["找一家没去过的小店", "拍一张商店街转角的招牌", "只用 1,000 円以内给自己买点小东西"],
    routeSteps: route("中野", "沿着商店街慢慢走", "先看招牌和橱窗，不用急着进店。", "找一家小咖啡店或普通小店，在门口停一会儿。"),
    nearbyPlaces: [
      nearby("cafe-01", "咖啡店", "商店街裏の小さな喫茶店", "280m", "适合逛累后坐一下", "¥500-1,200", ["休息", "一个人", "雨天"]),
      nearby("shotengai-01", "商店街", "駅前のアーケード商店街", "120m", "下雨天也能慢慢走", "¥0-1,500", ["低预算", "下雨天", "生活感"]),
      nearby("ramen-01", "拉面店", "路地裏の小さなラーメン店", "350m", "散步后吃一碗热的刚好", "¥800-1,300", ["热食", "低预算"]),
      nearby("konbini-01", "便利店", "近くのコンビニ", "180m", "买瓶水继续走", "¥150-800", ["补给", "省钱"]),
    ],
  },
  koenji: {
    title: "去有点个性的街角换气",
    subtitle: "古着、音乐感和不太规整的小路",
    moodTags: ["文艺", "复古", "小众", "低预算", "适合拍照", "商店街"],
    reason: "高円寺的好处是不需要安排路线，随便走进一条小路，也容易遇到有意思的橱窗和招牌。",
    walkTask: "不查评分，随便走进一条看起来有趣的小路，给今天的心情选一个颜色。",
    tasks: ["找一块有年代感的招牌", "只逛不买地看三家小店", "拍一张没有正脸人像的街景"],
    routeSteps: route("高円寺", "从商店街绕进小路", "先看古着店和小店门口，再慢慢往住宅街方向走。", "找一家不太显眼的咖啡店或小店，站在门口看一分钟。"),
    nearbyPlaces: [
      nearby("cafe-01", "咖啡店", "古着店近くの小さな喫茶店", "260m", "适合整理一下今天的心情", "¥600-1,200", ["休息", "文艺"]),
      nearby("shotengai-01", "商店街", "駅前の小さな商店街", "160m", "不用花钱也能看很久", "¥0-1,500", ["低预算", "复古"]),
      nearby("alley-01", "小巷", "路地裏の細い道", "300m", "适合短短绕一下", "¥0", ["拍照", "小众"]),
      nearby("konbini-01", "便利店", "近くのコンビニ", "200m", "买热饮继续走", "¥150-800", ["补给", "省钱"]),
    ],
  },
  asagaya: {
    title: "看一点普通东京的温度",
    subtitle: "老喫茶、商店街和安静住宅街",
    moodTags: ["安静", "昭和感", "生活感", "一个人", "商店街", "老街"],
    reason: "阿佐ヶ谷没有太强的观光感，适合慢慢看店门口的灯、手写菜单和普通人的生活节奏。",
    walkTask: "找一家老喫茶店或小店，看看店里的灯和椅子。",
    tasks: ["找一张手写菜单", "沿商店街走到人变少为止", "拍一张有旧招牌的街角"],
    routeSteps: route("阿佐ヶ谷", "沿着商店街看旧招牌", "不急着购物，主要看店门口和橱窗的小细节。", "找一家有老椅子的喫茶店，或在安静小路边停一下。"),
    nearbyPlaces: [
      nearby("cafe-01", "咖啡店", "昔ながらの小さな喫茶店", "300m", "适合慢慢坐一下", "¥500-1,100", ["昭和感", "休息"]),
      nearby("shotengai-01", "商店街", "駅前の商店街", "140m", "生活感很自然", "¥0-1,500", ["生活感", "低预算"]),
      nearby("alley-01", "小巷", "住宅街の静かな路地", "360m", "适合放慢脚步", "¥0", ["安静", "拍照"]),
      nearby("sweet-01", "甜品店", "路地裏の小さな甘味店", "420m", "给下午一点小奖励", "¥500-1,200", ["甜味", "休息"]),
    ],
  },
  ogikubo: {
    title: "书店和热汤之间的小散步",
    subtitle: "安静街角、旧书和低预算晚饭",
    moodTags: ["安静", "一个人", "书店", "昭和感", "低预算", "文艺"],
    reason: "荻窪适合一个人短短换气，先翻几页书，再找个不夸张的小店吃点热的。",
    walkTask: "找一本标题让你停下来的书，翻几页就好。",
    tasks: ["翻一本不在计划里的书", "找一家普通但有热气的小店", "记录一个今天看到的书名"],
    routeSteps: route("荻窪", "先沿着书店或小店多的路走", "不用买书，看到有意思的标题停一下就好。", "找一家能坐下来的小店，喝点热的或吃点简单的东西。"),
    nearbyPlaces: [
      nearby("book-01", "旧书店", "商店街の古い本屋", "260m", "可以慢慢翻几页", "¥0-2,000", ["书店", "雨天"]),
      nearby("cafe-01", "咖啡店", "駅近くの静かな喫茶店", "330m", "适合一个人休息", "¥500-1,200", ["安静", "休息"]),
      nearby("ramen-01", "拉面店", "駅前の小さなラーメン店", "220m", "散步后吃一碗热的", "¥800-1,300", ["热食", "低预算"]),
      nearby("alley-01", "小巷", "古い店の残る小道", "380m", "适合短短绕一下", "¥0", ["昭和感", "拍照"]),
    ],
  },
  "nishi-ogikubo": {
    title: "慢慢找一间小咖啡店",
    subtitle: "住宅街里的小店和不显眼的门口",
    moodTags: ["文艺", "咖啡", "小众", "一个人", "复古", "安静"],
    reason: "西荻窪的小店分散在住宅街里，适合没有目的地地发现，不用把散步做成打卡。",
    walkTask: "挑一家不显眼的咖啡店，坐下十分钟。",
    tasks: ["找一个安静门口", "买一杯咖啡慢慢喝", "走进一条树影多的小路"],
    routeSteps: route("西荻窪", "从车站旁的小店慢慢散开", "往住宅街方向走，不要只停留在最热闹的出口。", "选一家没有排队的小咖啡店，短短坐一下。"),
    nearbyPlaces: [
      nearby("cafe-01", "咖啡店", "住宅街の小さな喫茶店", "300m", "适合安静坐一会儿", "¥600-1,400", ["咖啡", "一个人"]),
      nearby("book-01", "旧书店", "商店街の古い本屋", "420m", "可以顺手翻几页", "¥0-2,000", ["文艺", "雨天"]),
      nearby("alley-01", "小巷", "木造家の残る小道", "360m", "适合拍安静街景", "¥0", ["小众", "拍照"]),
      nearby("sweet-01", "甜品店", "路地裏の小さな甘味店", "430m", "给散步一点甜味", "¥500-1,300", ["甜味", "休息"]),
    ],
  },
  kichijoji: {
    title: "从街区走到公园",
    subtitle: "热闹小店和井之头公园之间刚刚好",
    moodTags: ["公园", "咖啡", "生活感", "一个人", "适合拍照", "安静"],
    reason: "吉祥寺可以先看街区，再走到公园。热闹和安静切换得很自然，适合一个人慢慢走。",
    walkTask: "从商店街走到公园，途中只进一家闻起来舒服的小店。",
    tasks: ["从街区走到公园", "找一个可以坐下看水的位置", "只进一家小店，不把行程塞满"],
    routeSteps: route("吉祥寺", "先从小店多的街区出发", "慢慢往井之头公园方向走，中途不要安排太多店。", "在公园边找个位置坐五分钟，看水或树影。"),
    nearbyPlaces: [
      nearby("park-01", "公园", "井の頭公園のベンチ", "450m", "走累了可以坐一下", "¥0", ["公园", "放空"]),
      nearby("cafe-01", "咖啡店", "公園近くの小さなカフェ", "320m", "适合散步中途休息", "¥700-1,500", ["咖啡", "休息"]),
      nearby("shotengai-01", "商店街", "駅前の小さな商店街", "150m", "可以随便看看", "¥0-1,500", ["生活感", "低预算"]),
      nearby("sweet-01", "甜品店", "路地裏の小さな甘味店", "360m", "适合下午一点小奖励", "¥500-1,300", ["甜味", "拍照"]),
    ],
  },
  "inokashira-park": {
    title: "围着水边慢慢放空",
    subtitle: "树影、水面和不需要赶路的时间",
    moodTags: ["公园", "安静", "一个人", "低预算", "适合拍照"],
    reason: "井の頭公園适合把散步变成休息。走累了就坐在水边，不需要再安排别的目的地。",
    walkTask: "绕池塘走一圈，找一个可以坐下五分钟的位置。",
    tasks: ["围着水边走一圈", "找一张长椅坐五分钟", "拍一张水面或树影"],
    routeSteps: route("井の頭公園", "沿着水边慢慢走", "不要急着绕完一圈，看到舒服的位置就停下来。", "找一张长椅，放下手机坐五分钟。"),
    nearbyPlaces: [
      nearby("park-01", "公园", "池のそばのベンチ", "180m", "适合坐下放空", "¥0", ["安静", "低预算"]),
      nearby("cafe-01", "咖啡店", "公園入口近くの小さなカフェ", "360m", "散步前后都适合休息", "¥600-1,300", ["咖啡", "休息"]),
      nearby("konbini-01", "便利店", "近くのコンビニ", "280m", "买水很方便", "¥150-800", ["补给", "低预算"]),
      nearby("alley-01", "小巷", "公園裏の静かな道", "400m", "人少的时候很舒服", "¥0", ["安静", "拍照"]),
    ],
  },
  mitaka: {
    title: "比吉祥寺再慢一点",
    subtitle: "住宅街、绿意和普通街角",
    moodTags: ["安静", "生活感", "一个人", "低预算", "小众", "商店街"],
    reason: "三鷹的节奏比吉祥寺慢一点，适合不赶时间地走，看住宅街和小店之间的日常。",
    walkTask: "沿着住宅街走十五分钟，找一个舒服的街角。",
    tasks: ["沿住宅街走十五分钟", "找一个树影下的街角", "买一瓶水，慢慢走回车站"],
    routeSteps: route("三鷹", "往安静住宅街方向走", "不要走最热闹的路，试着找一段树多的小路。", "在小店或公园边停一下，给自己一点空白时间。"),
    nearbyPlaces: [
      nearby("cafe-01", "咖啡店", "住宅街の小さな喫茶店", "340m", "适合短短休息", "¥500-1,200", ["安静", "一个人"]),
      nearby("park-01", "公园", "木陰の小さなベンチ", "430m", "可以坐着放空", "¥0", ["绿荫", "低预算"]),
      nearby("shotengai-01", "商店街", "駅前の小さな商店街", "210m", "生活感自然", "¥0-1,500", ["生活感", "顺路"]),
      nearby("konbini-01", "便利店", "近くのコンビニ", "160m", "补水后继续走", "¥150-800", ["补给", "省钱"]),
    ],
  },
  kokubunji: {
    title: "学生感和绿意之间走一段",
    subtitle: "便宜小店、书店和轻松街区",
    moodTags: ["学生感", "低预算", "生活感", "公园", "一个人", "书店"],
    reason: "国分寺有学生街和绿地，适合轻松吃点东西，再慢慢走一段，不用花很多钱。",
    walkTask: "找一家便宜小店，买一份能边走边吃的小东西。",
    tasks: ["用 1,000 円以内完成一次散步", "找一家小书店或文具店", "走到绿意多一点的方向"],
    routeSteps: route("国分寺", "先看学生街的小店", "沿着便宜小店和书店多的方向走，保持轻松。", "在绿意多一点的地方停下来，吃完手里的小东西。"),
    nearbyPlaces: [
      nearby("book-01", "旧书店", "商店街の古い本屋", "360m", "适合慢慢翻几页", "¥0-2,000", ["书店", "学生感"]),
      nearby("park-01", "公园", "緑の多い小さな広場", "480m", "适合吃完东西后休息", "¥0", ["公园", "低预算"]),
      nearby("ramen-01", "拉面店", "駅前の小さなラーメン店", "260m", "低预算热食", "¥800-1,300", ["热食", "低预算"]),
      nearby("konbini-01", "便利店", "近くのコンビニ", "180m", "买饮料继续走", "¥150-800", ["补给", "省钱"]),
    ],
  },
  kunitachi: {
    title: "走一条宽一点的安静路",
    subtitle: "学生街、树影和很舒服的留白",
    moodTags: ["学生感", "安静", "适合拍照", "一个人", "生活感", "低预算"],
    reason: "国立的街道宽一点，树和学生感让人容易把脚步放慢，适合拍干净的街景。",
    walkTask: "沿着笔直的街道走一段，拍一张安静的街景。",
    tasks: ["拍一张有树影的街景", "不看手机走十五分钟", "找一家普通小店买饮料"],
    routeSteps: route("国立", "沿着宽一点的路直走", "不要急着转弯，先让街道的节奏把心情放慢。", "在树影下或小店门口停一下，看看今天的光。"),
    nearbyPlaces: [
      nearby("cafe-01", "咖啡店", "並木道近くの小さなカフェ", "330m", "适合看街景休息", "¥600-1,300", ["咖啡", "安静"]),
      nearby("book-01", "书店", "学生街の小さな本屋", "420m", "顺路翻几页", "¥0-2,000", ["学生感", "书店"]),
      nearby("park-01", "公园", "木陰の小さな広場", "500m", "适合放空", "¥0", ["公园", "低预算"]),
      nearby("konbini-01", "便利店", "近くのコンビニ", "200m", "补给方便", "¥150-800", ["补给"]),
    ],
  },
  tachikawa: {
    title: "城市和公园之间的长一点散步",
    subtitle: "买杯饮料，再往绿意多的方向走",
    moodTags: ["公园", "咖啡", "生活感", "适合拍照", "一个人", "安静"],
    reason: "立川适合想走久一点的日子。城市功能很方便，往公园方向走又能慢慢安静下来。",
    walkTask: "先买一杯饮料，再往有绿意的方向走。",
    tasks: ["买一杯饮料带着走", "往树多的方向走二十分钟", "找一张可以坐下的长椅"],
    routeSteps: route("立川", "从城市街区往绿意方向走", "先经过方便的小店，再慢慢把路线带到公园附近。", "找一张长椅坐下，给这次散步一个明确的停顿。"),
    nearbyPlaces: [
      nearby("park-01", "公园", "緑の多い公園入口", "520m", "适合走久一点", "¥0", ["公园", "放空"]),
      nearby("cafe-01", "咖啡店", "駅近くの小さなカフェ", "260m", "出发前买饮料", "¥600-1,400", ["咖啡", "休息"]),
      nearby("konbini-01", "便利店", "近くのコンビニ", "150m", "补水很方便", "¥150-800", ["补给"]),
      nearby("sweet-01", "甜品店", "路地裏の小さな甘味店", "420m", "散步后的小奖励", "¥500-1,300", ["甜味"]),
    ],
  },
  "showa-kinen-park": {
    title: "把散步拉长一点",
    subtitle: "大片绿意、树影和适合放空的路",
    moodTags: ["公园", "安静", "低预算", "适合拍照", "一个人"],
    reason: "昭和記念公園适合想彻底离开街道噪音的时候。路线可以长一点，但不需要走成任务。",
    walkTask: "找一条树影多的路，不看手机走二十分钟。",
    tasks: ["不看手机走二十分钟", "找一块树影停下来", "拍一张只有路和树的照片"],
    routeSteps: route("昭和記念公園", "往树影多的方向走", "不用把公园走完，挑一段舒服的路就够了。", "在长椅或草地边停下来，把手机收起来几分钟。"),
    nearbyPlaces: [
      nearby("park-01", "公园", "木陰の広いベンチ", "300m", "适合安静坐下", "¥0", ["公园", "放空"]),
      nearby("cafe-01", "咖啡店", "公園近くの小さなカフェ", "620m", "走完后休息", "¥600-1,300", ["休息", "咖啡"]),
      nearby("konbini-01", "便利店", "近くのコンビニ", "450m", "进入公园前买水", "¥150-800", ["补给"]),
      nearby("alley-01", "小巷", "駅へ戻る静かな道", "520m", "回程适合慢慢走", "¥0", ["安静"]),
    ],
  },
  takao: {
    title: "不用登山也能看一点绿色",
    subtitle: "站前、山气和稍微远一点的换气",
    moodTags: ["公园", "安静", "适合拍照", "低预算", "一个人"],
    reason: "高尾适合想看一点山和空气的日子，但不必把它做成正式登山，站前和周边短走也很舒服。",
    walkTask: "在站前附近慢慢走，找一个能看到绿色的位置休息。",
    tasks: ["找一个能看到山色的位置", "买一瓶水慢慢走", "只走到觉得舒服为止"],
    routeSteps: route("高尾", "先在站前附近慢慢走", "不用急着进山，先感受一下空气和街区的变化。", "找一个能看到绿色的位置坐一会儿，保留体力回程。"),
    nearbyPlaces: [
      nearby("park-01", "公园", "緑が見える小さな広場", "380m", "适合看绿色休息", "¥0", ["公园", "安静"]),
      nearby("cafe-01", "咖啡店", "駅近くの小さな喫茶店", "260m", "出发前后都适合坐一下", "¥500-1,200", ["休息"]),
      nearby("konbini-01", "便利店", "近くのコンビニ", "140m", "补水和简单食物", "¥150-800", ["补给", "低预算"]),
      nearby("alley-01", "小巷", "山の見える静かな道", "420m", "适合短短散步", "¥0", ["拍照", "安静"]),
    ],
  },
  shimokitazawa: {
    title: "在小路里随机拐弯",
    subtitle: "古着、剧场感和小咖啡店",
    moodTags: ["文艺", "小众", "咖啡", "适合拍照", "复古", "商店街"],
    reason: "下北沢适合古着、剧场、小咖啡店和随机小巷。人多的时候就往旁边路走，节奏会舒服很多。",
    walkTask: "进一家古着店，只挑一件颜色像今天心情的小东西。",
    tasks: ["随便拐进一条小路", "看三家店但不急着买", "找一家没排队的小咖啡店"],
    routeSteps: route("下北沢", "先离开最拥挤的主路", "沿着小店和剧场感强的街角走，看到人多就换一条路。", "找一家没排队的小咖啡店，坐十分钟再继续。"),
    nearbyPlaces: [
      nearby("cafe-01", "咖啡店", "路地裏の小さなカフェ", "260m", "适合避开人流休息", "¥600-1,400", ["咖啡", "小众"]),
      nearby("shotengai-01", "商店街", "駅近くの小さな商店街", "180m", "随便看小店", "¥0-2,000", ["文艺", "复古"]),
      nearby("alley-01", "小巷", "劇場近くの細い道", "320m", "适合拍安静角落", "¥0", ["拍照", "小众"]),
      nearby("sweet-01", "甜品店", "路地裏の小さな甘味店", "390m", "走累后一点甜味", "¥500-1,300", ["休息"]),
    ],
  },
  "higashi-kitazawa": {
    title: "下北旁边的安静换气",
    subtitle: "人少一点的小路和住宅街咖啡",
    moodTags: ["安静", "小众", "咖啡", "一个人", "生活感", "低预算"],
    reason: "東北沢比下北沢安静一点，适合只想短距离换气，不想被热闹带着走的日子。",
    walkTask: "从车站往人少的一侧走，找一个小店门口停一下。",
    tasks: ["往人少的出口走", "找一个安静门口", "不看地图走十分钟"],
    routeSteps: route("東北沢", "往住宅街方向短短走", "避开太热闹的路线，沿着安静的小路换气。", "在小店门口或树影下停一分钟，再决定要不要继续。"),
    nearbyPlaces: [
      nearby("cafe-01", "咖啡店", "住宅街の小さなカフェ", "260m", "安静坐一下", "¥600-1,300", ["咖啡", "一个人"]),
      nearby("alley-01", "小巷", "人通りの少ない小道", "300m", "适合短短绕路", "¥0", ["安静", "小众"]),
      nearby("konbini-01", "便利店", "近くのコンビニ", "160m", "买热饮继续走", "¥150-800", ["补给"]),
      nearby("shotengai-01", "商店街", "駅前の小さな通り", "180m", "生活感很轻", "¥0-1,000", ["生活感"]),
    ],
  },
  "yoyogi-uehara": {
    title: "坡道和小店之间轻轻走",
    subtitle: "面包店、咖啡和安静住宅街",
    moodTags: ["安静", "一个人", "咖啡", "文艺", "生活感", "适合拍照"],
    reason: "代々木上原的住宅街和小店距离刚好，适合轻松走一小时，不需要追求热闹。",
    walkTask: "找一家面包店，买一个明天早上也能吃的小面包。",
    tasks: ["买一个小面包", "沿坡道慢慢走", "找一家安静咖啡店休息"],
    routeSteps: route("代々木上原", "沿着坡道和住宅街慢慢走", "看小店门口和安静街角，不需要安排太多目的地。", "买一个面包或咖啡，找地方短短休息。"),
    nearbyPlaces: [
      nearby("cafe-01", "咖啡店", "坂道近くの小さなカフェ", "280m", "适合安静坐一下", "¥700-1,500", ["咖啡", "安静"]),
      nearby("sweet-01", "甜品店", "路地裏の小さなベーカリー", "360m", "可以买一点明天吃的东西", "¥300-1,200", ["小店", "休息"]),
      nearby("alley-01", "小巷", "住宅街の静かな坂道", "220m", "适合拍生活感街景", "¥0", ["拍照", "生活感"]),
      nearby("konbini-01", "便利店", "近くのコンビニ", "180m", "补给方便", "¥150-800", ["补给"]),
    ],
  },
  "yoyogi-hachiman": {
    title: "神社旁边的短短散步",
    subtitle: "坡道、小咖啡和安静街角",
    moodTags: ["咖啡", "老街", "安静", "一个人", "适合拍照", "文艺"],
    reason: "代々木八幡有神社、坡道和小咖啡店，距离感刚好，适合不太费力地散步。",
    walkTask: "先去安静的路边停一下，再找咖啡店休息。",
    tasks: ["找一段安静坡道", "在神社附近停一下", "买一杯咖啡慢慢喝"],
    routeSteps: route("代々木八幡", "先绕到安静坡道", "让路线经过神社附近，再往小咖啡店多的方向走。", "找一家不拥挤的咖啡店或路边长椅，休息五分钟。"),
    nearbyPlaces: [
      nearby("cafe-01", "咖啡店", "神社近くの小さなカフェ", "260m", "适合安静休息", "¥700-1,500", ["咖啡", "安静"]),
      nearby("shrine-01", "神社", "静かな神社の入口", "220m", "适合短暂停一下", "¥0", ["安静", "拍照"]),
      nearby("alley-01", "小巷", "坂道の小さな路地", "280m", "生活感很好", "¥0", ["老街", "拍照"]),
      nearby("sweet-01", "甜品店", "路地裏の小さな甘味店", "390m", "给下午一点甜味", "¥500-1,300", ["休息"]),
    ],
  },
  "yoyogi-park": {
    title: "去大一点的绿意里放空",
    subtitle: "树荫、空地和不用消费的休息",
    moodTags: ["公园", "安静", "适合拍照", "低预算", "一个人"],
    reason: "代々木公園绿意多，适合想把脑袋清空的时候。它不需要路线，找一段舒服的树荫就好。",
    walkTask: "找一条树荫路，慢慢走到不想走为止。",
    tasks: ["沿树荫走十五分钟", "找一块空地坐一下", "拍一张只有天空和树的照片"],
    routeSteps: route("代々木公園", "往树荫多的方向走", "不需要走完整个公园，挑一段安静路线就够了。", "找一块能坐下的地方，什么都不做五分钟。"),
    nearbyPlaces: [
      nearby("park-01", "公园", "木陰の広いベンチ", "180m", "适合坐着放空", "¥0", ["公园", "低预算"]),
      nearby("cafe-01", "咖啡店", "公園入口近くのカフェ", "420m", "散步前后休息", "¥600-1,400", ["咖啡", "休息"]),
      nearby("konbini-01", "便利店", "近くのコンビニ", "260m", "买水很方便", "¥150-800", ["补给"]),
      nearby("alley-01", "小巷", "公園沿いの静かな道", "360m", "回程适合慢慢走", "¥0", ["安静"]),
    ],
  },
  gotokuji: {
    title: "去老街里找一点安静",
    subtitle: "小路、招财猫印象和住宅街生活感",
    moodTags: ["猫", "老街", "安静", "生活感", "适合拍照", "昭和感"],
    reason: "豪徳寺的小街区和猫的印象很强，但真正舒服的是住宅街里的慢节奏。",
    walkTask: "找一条安静小路，拍一张有生活感的门口。",
    tasks: ["找一条安静小路", "拍一张门口或招牌", "买一个小点心慢慢走"],
    routeSteps: route("豪徳寺", "从商店街慢慢绕进住宅街", "不要只找景点，看看普通门口和小店的生活感。", "在安静路边停一下，拍一张不会打扰别人的街景。"),
    nearbyPlaces: [
      nearby("cafe-01", "咖啡店", "路地裏の小さな喫茶店", "300m", "适合走累后休息", "¥500-1,200", ["休息", "安静"]),
      nearby("cat-01", "猫咖", "猫に会えそうな小さな店", "420m", "如果想休息，可以找猫主题小店", "¥800-1,500", ["猫", "休息"]),
      nearby("alley-01", "小巷", "住宅街の静かな小道", "260m", "适合慢慢拍街景", "¥0", ["老街", "拍照"]),
      nearby("sweet-01", "甜品店", "商店街の小さな甘味店", "360m", "散步中途的小奖励", "¥400-1,200", ["甜味"]),
    ],
  },
  kyodo: {
    title: "低预算也能轻松走",
    subtitle: "学生感、商店街和日常小店",
    moodTags: ["学生感", "商店街", "低预算", "生活感", "一个人", "书店"],
    reason: "経堂的学生感和商店街都很自然，适合想轻松走走、顺便买点便宜小东西的时候。",
    walkTask: "看看今天街上的人都在做什么，记住一个小细节。",
    tasks: ["用 1,000 円以内买点小东西", "找一家小书店或文具店", "沿商店街走到人变少的地方"],
    routeSteps: route("経堂", "沿着商店街慢慢走", "看小店、菜单和路过的人，不用急着买东西。", "找一家小书店、咖啡店或便利店，短短停一下。"),
    nearbyPlaces: [
      nearby("book-01", "书店", "商店街の小さな本屋", "300m", "适合顺路翻几页", "¥0-2,000", ["书店", "学生感"]),
      nearby("shotengai-01", "商店街", "駅前の商店街", "130m", "生活感自然", "¥0-1,500", ["生活感", "低预算"]),
      nearby("ramen-01", "拉面店", "駅前の小さなラーメン店", "260m", "散步后吃一碗热的", "¥800-1,300", ["热食", "低预算"]),
      nearby("konbini-01", "便利店", "近くのコンビニ", "150m", "买饮料继续走", "¥150-800", ["补给"]),
    ],
  },
};

function enrichWalkSpots(spots: WalkSpotSeedInput[]): WalkSpot[] {
  return spots.map((seed) => {
    const { nearbyPlaces, routeSteps, tasks, ...spotOverrides } = prioritySpotContent[seed.id] ?? {};
    const spot = normalizeSeed({ ...seed, ...spotOverrides });
    return {
      ...spot,
      nearbyPlaces: buildNearbyPlaces(spot, nearbyPlaces),
      routeSteps: routeSteps ?? buildRouteSteps(spot),
      tasks: tasks ?? buildTasks(spot),
    };
  });
}

export const walkSpots: WalkSpot[] = enrichWalkSpots(baseWalkSpotSeeds);

export function getWalkSpotPool(tag: WalkTag | "全部") {
  if (tag === "全部") return walkSpots;
  return walkSpots.filter((spot) => spot.moodTags.includes(tag) || spot.weatherTags.includes(tag));
}

export function pickRandomWalkSpot(currentId?: string, tag: WalkTag | "全部" = "全部") {
  const pool = getWalkSpotPool(tag);
  const candidates = pool.length > 1 && currentId ? pool.filter((spot) => spot.id !== currentId) : pool;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? walkSpots[0];
}
