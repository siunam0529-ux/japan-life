import type { CommunityLocale, CommunityPost, CommunityPostType } from "@/lib/community/types";

const mockAuthorIds = ["current-user", "mock-user-miki", "mock-user-ken", "mock-user-aya", "mock-user-lin"] as const;
const mockAuthorNames: Record<(typeof mockAuthorIds)[number], string> = {
  "current-user": "Nam",
  "mock-user-aya": "Aya",
  "mock-user-ken": "Ken",
  "mock-user-lin": "Lin",
  "mock-user-miki": "Miki",
};

type MockSeed = {
  area: string;
  authorName: string;
  buddyType?: string;
  budget?: string;
  content: string;
  featuredReason?: string;
  isFeatured?: boolean;
  isOfficialRecommended?: boolean;
  isPinned?: boolean;
  itemStatus?: string;
  people?: string;
  price?: string;
  tags: string[];
  time?: string;
  title: string;
  type: CommunityPostType;
};

const zhCnSeeds: MockSeed[] = [
  { area: "池袋", authorName: "小夏", content: "750円一份，量很大，适合打工休息时去。", featuredReason: "省钱生活经验很实用", isFeatured: true, tags: ["池袋美食", "省钱生活", "一人食"], title: "池袋这家中华料理午餐很便宜", type: "share" },
  { area: "板桥区", authorName: "Miki", content: "第一次办手续，有几项不太懂。", featuredReason: "很适合第一次办手续的人参考", isOfficialRecommended: true, tags: ["手续求助", "在日生活"], title: "区役所这张表怎么填？", type: "help" },
  { area: "练马", authorName: "Aki", content: "需要自取，地点在练马。", isPinned: true, itemStatus: "出品中", price: "0円", tags: ["搬家出清", "闲置"], title: "搬家出清：小冰箱免费送", type: "secondhand" },
  { area: "上野", authorName: "Yuki", buddyType: "散步搭子", content: "想拍照、喝咖啡，2〜3 人都可以。", people: "2〜3人", tags: ["同城搭子", "东京散步"], time: "周末下午", title: "周末想找人一起去上野散步", type: "buddy" },
  { area: "新宿", authorName: "Ken", content: "明天面试便利店，有点紧张。", tags: ["打工日语", "求助"], title: "打工面试日语怎么说比较自然？", type: "help" },
  { area: "东京", authorName: "Hana", content: "8点后便当经常半价，适合省钱。", tags: ["省钱生活", "生活分享"], title: "日本超市晚上的折扣真的香", type: "share" },
  { area: "东京", authorName: "Lin", budget: "可商量", content: "简单陪同即可，费用可商量。", tags: ["手续求助", "在日生活"], time: "下周", title: "想找人陪同去医院翻译", type: "helper" },
  { area: "涩谷", authorName: "阿树", content: "吧台座很多，一个人也舒服。", tags: ["一人食", "东京散步"], title: "东京一个人吃饭不会尴尬的店", type: "share" },
];

const zhTwSeeds: MockSeed[] = [
  { area: "池袋", authorName: "阿晴", content: "午餐大概 800円，份量幾夠，附近打工休息可以去。", tags: ["池袋美食", "慳錢生活", "一人食"], title: "池袋邊間午餐平又大份？", type: "share" },
  { area: "板橋區", authorName: "Ming", content: "第一次去區役所，有幾欄唔係好明。", tags: ["手續求助", "在日生活"], title: "有冇人知區役所呢張表點填？", type: "help" },
  { area: "練馬", authorName: "Ming", content: "要自取，小雪櫃仲用到，搬屋所以送出。", itemStatus: "出品中", price: "0円", tags: ["搬屋清物", "二手"], title: "搬屋清物：小雪櫃免費送", type: "secondhand" },
  { area: "上野", authorName: "Kiki", buddyType: "散步搭子", content: "想影相同飲咖啡，兩三個人都可以。", people: "2〜3人", tags: ["同城搭子", "東京散步"], time: "週末下午", title: "今個週末想搵人去上野散步", type: "buddy" },
  { area: "新宿", authorName: "Leo", content: "聽日便利店面試，想練幾句自然啲嘅講法。", tags: ["打工日文", "求助"], title: "便利店面試日文點講自然啲？", type: "help" },
  { area: "東京", authorName: "Yau", content: "夜晚八點後好多便當半價，真係幫到慳生活費。", tags: ["慳錢生活", "生活分享"], title: "日本超市夜晚半價便當好抵", type: "share" },
  { area: "東京", authorName: "Ann", budget: "可商量", content: "普通陪同翻譯就可以，時間同費用可以再夾。", tags: ["手續求助", "在日生活"], time: "下星期", title: "想搵人陪我去醫院翻譯", type: "helper" },
  { area: "澀谷", authorName: "Ann", content: "有吧枱位，一個人食都唔會尷尬。", tags: ["一人食", "東京散步"], title: "東京一個人食飯都舒服嘅店", type: "share" },
];

const jaSeeds: MockSeed[] = [
  { area: "池袋", authorName: "さくら", content: "750円くらいで量も多く、休憩時間に行きやすいお店でした。", featuredReason: "節約生活の参考になります", isFeatured: true, tags: ["池袋グルメ", "節約生活", "一人ごはん"], title: "池袋で安くて量が多いランチを見つけた", type: "share" },
  { area: "板橋区", authorName: "Aoi", content: "初めての手続きで、何を書けばいいか迷っています。", tags: ["手続き相談", "在日生活"], title: "区役所のこの書類の書き方を教えてほしい", type: "help" },
  { area: "練馬", authorName: "Aoi", content: "引き取りに来られる方にお譲りします。まだ普通に使えます。", itemStatus: "出品中", price: "0円", tags: ["引っ越し", "譲ります"], title: "引っ越しのため小型冷蔵庫を譲ります", type: "secondhand" },
  { area: "上野", authorName: "Riku", buddyType: "散歩", content: "写真を撮ったり、カフェに寄ったりしたいです。", people: "2〜3人", tags: ["友達募集", "東京散歩"], time: "週末午後", title: "週末に上野を一緒に散歩できる人いますか", type: "buddy" },
  { area: "新宿", authorName: "Nao", content: "明日コンビニの面接があり、自然な言い方を確認したいです。", tags: ["バイト日本語", "手続き相談"], title: "コンビニ面接の日本語を自然に言いたい", type: "help" },
  { area: "東京", authorName: "Momo", content: "夜の割引弁当がかなり助かります。節約したい人におすすめです。", tags: ["節約生活", "生活分享"], title: "スーパーの夜の割引がかなり助かる", type: "share" },
  { area: "東京", authorName: "Haru", budget: "相談可", content: "簡単な付き添い通訳をお願いしたいです。費用は相談できます。", tags: ["手続き相談", "在日生活"], time: "来週", title: "病院の付き添い通訳をお願いしたい", type: "helper" },
  { area: "渋谷", authorName: "Haru", content: "カウンター席が多く、一人でも入りやすい雰囲気でした。", tags: ["一人ごはん", "東京散歩"], title: "東京で一人でも入りやすい店", type: "share" },
];

const seedsByLocale: Record<CommunityLocale, MockSeed[]> = {
  ja: jaSeeds,
  "zh-cn": zhCnSeeds,
  "zh-tw": zhTwSeeds,
};

export const communityMockPosts: CommunityPost[] = Object.entries(seedsByLocale).flatMap(([locale, seeds]) =>
  seeds.map((seed, index) => {
    const authorId = mockAuthorIds[index % mockAuthorIds.length];
    return {
      id: `mock-community-${locale}-${index + 1}`,
      communityLocale: locale as CommunityLocale,
      authorId,
      commentCount: 3 + ((index * 5) % 14),
      comments: 3 + ((index * 5) % 14),
      createdAt: `05/${String(31 - (index % 5)).padStart(2, "0")} ${String(10 + (index % 9)).padStart(2, "0")}:${String((index * 7) % 60).padStart(2, "0")}`,
      favoriteCount: 5 + ((index * 9) % 34),
      favorites: 5 + ((index * 9) % 34),
      featuredReason: undefined,
      images: [],
      isAnonymous: false,
      isFeatured: false,
      isOfficialRecommended: false,
      isPinned: false,
      likeCount: 18 + ((index * 17) % 112),
      likes: 18 + ((index * 17) % 112),
      pinnedUntil: null,
      status: "published",
      ...seed,
      authorName: seed.authorName || mockAuthorNames[authorId],
      isSolved: seed.type === "help" ? false : undefined,
    };
  }),
);
