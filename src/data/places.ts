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
