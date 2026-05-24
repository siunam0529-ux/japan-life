export type PlaceItem = {
  id: string;
  name: string;
  nameZhTW?: string;
  nameJa?: string;
  subtitle: string;
  subtitleZhTW?: string;
  subtitleJa?: string;
  category: string;
  categoryZhTW?: string;
  categoryJa?: string;
  area: string;
  areaZhTW?: string;
  areaJa?: string;
  address?: string;
  addressZhTW?: string;
  addressJa?: string;
  averageSpend?: string;
  hours?: string;
  phone?: string;
  website?: string;
  mapUrl?: string;
  map_url?: string;
  imageUrl?: string;
  gallery?: PlaceGalleryImage[];
  supportsChinese?: boolean;
  supportsJapanese?: boolean;
  foreignerFriendly?: boolean;
  isDemo?: boolean;
  tags: string[];
  tagsZhTW?: string[];
  tagsJa?: string[];
  updatedAt: string;
};

export type PlaceGalleryImage = {
  url: string;
  title: string;
  titleZhTW?: string;
  titleJa?: string;
};

export const placeItems: PlaceItem[] = [
  {
    id: "demo-ikebukuro-chinese",
    name: "池袋中华料理 Sakura",
    nameZhTW: "池袋中華料理 Sakura",
    nameJa: "池袋中華料理 Sakura",
    subtitle: "支持中文沟通，适合初到日本时和朋友聚餐。",
    subtitleZhTW: "支援中文溝通，適合初到日本時和朋友聚餐。",
    subtitleJa: "中国語対応。来日直後の食事や友人との利用にも使いやすいお店です。",
    category: "餐厅",
    categoryZhTW: "餐廳",
    categoryJa: "飲食店",
    area: "丰岛区 / 池袋",
    areaZhTW: "豐島區 / 池袋",
    areaJa: "豊島区 / 池袋",
    address: "東京都豊島区東池袋1-1-1",
    addressZhTW: "東京都豐島區東池袋1-1-1",
    addressJa: "東京都豊島区東池袋1-1-1",
    averageSpend: "¥1,000〜¥2,000",
    hours: "11:00〜22:00",
    phone: "03-1234-5678",
    website: "https://example.com",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=%E6%9D%B1%E4%BA%AC%E9%83%BD%E8%B1%8A%E5%B3%B6%E5%8C%BA%E6%9D%B1%E6%B1%A0%E8%A2%8B1-1-1",
    imageUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=400&q=80",
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80",
        title: "店铺外观",
        titleZhTW: "店鋪外觀",
        titleJa: "店舗外観",
      },
      {
        url: "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80",
        title: "菜单与菜品",
        titleZhTW: "菜單與餐點",
        titleJa: "メニューと料理",
      },
      {
        url: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=900&q=80",
        title: "推荐菜品",
        titleZhTW: "推薦餐點",
        titleJa: "おすすめ料理",
      },
      {
        url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
        title: "店内座位",
        titleZhTW: "店內座位",
        titleJa: "店内席",
      },
    ],
    supportsChinese: true,
    supportsJapanese: true,
    foreignerFriendly: true,
    isDemo: true,
    tags: ["参考店铺", "支持中文", "外国人友好"],
    tagsZhTW: ["參考店鋪", "支援中文", "外國人友好"],
    tagsJa: ["参考店舗", "中国語対応", "外国人にやさしい"],
    updatedAt: "2026-05-21",
  },
  {
    id: "listing-open",
    name: "店铺申请上架",
    nameZhTW: "店鋪申請上架",
    nameJa: "店舗掲載申請",
    subtitle: "想让店铺进入 Japan Life，可以提交资料申请上架",
    subtitleZhTW: "想讓店鋪進入 Japan Life，可以提交資料申請上架",
    subtitleJa: "Japan Life に店舗を掲載したい場合は、資料を送信して申請できます",
    category: "申请入口",
    categoryZhTW: "申請入口",
    categoryJa: "申請入口",
    area: "东京23区",
    areaZhTW: "東京23區",
    areaJa: "東京23区",
    supportsChinese: true,
    supportsJapanese: true,
    foreignerFriendly: true,
    tags: ["外国人友好", "人工核实"],
    tagsZhTW: ["外國人友好", "人工核實"],
    tagsJa: ["外国人にやさしい", "運営確認"],
    updatedAt: "2026-05-21",
  },
];
