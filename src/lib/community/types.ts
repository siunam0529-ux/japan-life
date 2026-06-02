export type CommunityPostType = "share" | "help" | "secondhand" | "buddy" | "helper";
export type CommunityLocale = "zh-cn" | "zh-tw" | "ja";
export type CommunityViewLocale = "all" | CommunityLocale;
export type CommunityPostStatus = "published" | "pending" | "reported" | "hidden" | "deleted";
export type CommunityCommentStatus = "published" | "reported" | "hidden" | "deleted";
export type CommunityReportStatus = "pending" | "resolved" | "ignored";
export type CommunityReportTargetType = "post" | "comment" | "user";
export type CommunityNotificationType = "comment" | "reply" | "like" | "favorite" | "report_result" | "post_approved" | "post_hidden" | "system";
export type CommunityNotificationTargetType = "post" | "comment" | "report" | "user" | "system";

export type CommunityPostImage = string | {
  alt: string;
  coverText?: string;
  id: string;
  path?: string;
  previewColor: string;
  title?: string;
  type: "local-preview" | "placeholder" | "text-cover";
  url?: string;
  width?: number;
  height?: number;
} | {
  alt: string;
  path: string;
  url: string;
  width?: number;
  height?: number;
};

export type CommunityUserProfile = {
  id: string;
  accountId?: string;
  displayName: string;
  avatar: string;
  bio: string;
  area: string;
  languages: string[];
  interests: string[];
  joinedAt: string;
  postCount: number;
  likeReceivedCount: number;
  favoriteReceivedCount: number;
  commentReceivedCount: number;
  isAnonymousDefault: boolean;
};

export type CommunityPost = {
  id: string;
  communityLocale: CommunityLocale;
  type: CommunityPostType;
  title: string;
  content: string;
  area: string;
  authorName: string;
  authorId: string;
  isAnonymous: boolean;
  images: CommunityPostImage[];
  tags: string[];
  likes: number;
  comments: number;
  favorites: number;
  views: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  viewCount: number;
  reportCount?: number;
  status: CommunityPostStatus;
  isFeatured: boolean;
  isPinned: boolean;
  isOfficialRecommended: boolean;
  featuredReason?: string;
  pinnedUntil?: string | null;
  isSolved?: boolean;
  itemStatus?: string;
  condition?: string;
  pickupMethod?: string;
  price?: string;
  budget?: string;
  buddyType?: string;
  helperCategory?: string;
  helpCategory?: string;
  shareCategory?: string;
  time?: string;
  people?: string;
  createdAt: string;
  updatedAt?: string;
};

export type CommunityComment = {
  id: string;
  communityLocale: CommunityLocale;
  postId: string;
  parentId?: string;
  authorName: string;
  authorId: string;
  content: string;
  isAnonymous: boolean;
  likeCount?: number;
  reportCount?: number;
  status: CommunityCommentStatus;
  createdAt: string;
};


export type CommunityReport = {
  id: string;
  userId?: string;
  targetType: CommunityReportTargetType;
  targetId: string;
  reason: string;
  detail: string;
  createdAt: string;
  status: CommunityReportStatus;
};

export type CommunityNotification = {
  id: string;
  userId: string;
  type: CommunityNotificationType;
  title: string;
  message: string;
  targetType?: CommunityNotificationTargetType;
  targetId?: string;
  postId?: string;
  communityLocale: CommunityLocale;
  isRead: boolean;
  createdAt: string;
};

export const communityPostTypeLabels: Record<CommunityPostType, string> = {
  buddy: "搭子",
  help: "求助",
  helper: "帮忙",
  secondhand: "闲置",
  share: "分享",
};

export const communityPostTypes: { id: CommunityPostType; label: string; description: string }[] = [
  { id: "share", label: "生活分享", description: "美食、散步、省钱、生活经验" },
  { id: "help", label: "求助提问", description: "手续、打工、租房、日语" },
  { id: "secondhand", label: "闲置转让", description: "搬家出清、二手物品" },
  { id: "buddy", label: "找搭子", description: "散步、拍照、语言交换" },
  { id: "helper", label: "找人帮忙", description: "搬运、陪同、翻译、跑腿" },
];

export const communityLocales: CommunityLocale[] = ["zh-cn", "zh-tw", "ja"];
export const communityViewLocales: CommunityViewLocale[] = ["all", ...communityLocales];
export const communityPostStatuses: CommunityPostStatus[] = ["published", "pending", "reported", "hidden", "deleted"];
export const communityCommentStatuses: CommunityCommentStatus[] = ["published", "reported", "hidden", "deleted"];
export const communityReportStatuses: CommunityReportStatus[] = ["pending", "resolved", "ignored"];
export const communityNotificationTypes: CommunityNotificationType[] = ["comment", "reply", "like", "favorite", "report_result", "post_approved", "post_hidden", "system"];
export const communityNotificationTargetTypes: CommunityNotificationTargetType[] = ["post", "comment", "report", "user", "system"];

export const communityNotificationTypeLabels: Record<CommunityNotificationType, string> = {
  comment: "有人评论了你的帖子",
  favorite: "有人收藏了你的帖子",
  like: "有人点赞了你的帖子",
  post_approved: "你的帖子已通过审核",
  post_hidden: "你的帖子已被隐藏",
  reply: "有人回复了你的评论",
  report_result: "你的举报已处理",
  system: "系统通知",
};

export const communityReportReasons = ["诈骗", "广告", "色情低俗", "辱骂骚扰", "违法内容", "虚假信息", "其他"] as const;
export const communityRiskKeywords = ["银行卡", "在留卡", "换汇", "黑工", "代收包裹", "高薪日结", "援交", "陪睡", "赌博", "毒品", "贷款", "信用卡套现", "出售账号", "假证", "护照买卖", "银行卡买卖", "账号出租", "代实名认证", "裸聊", "约炮", "特殊服务"] as const;
export const communitySafetyDisclaimer = "请勿发布诈骗、违法交易、色情低俗、骚扰攻击或泄露隐私的内容。";

export const communityLocaleBadges: Record<CommunityLocale, { label: string; longLabel: string; tone: string }> = {
  ja: { label: "社区", longLabel: "生活社区", tone: "bg-[rgba(37,99,235,0.12)] text-[#1d4ed8]" },
  "zh-cn": { label: "社区", longLabel: "生活社区", tone: "bg-[rgba(37,99,235,0.12)] text-[#1d4ed8]" },
  "zh-tw": { label: "社区", longLabel: "生活社区", tone: "bg-[rgba(37,99,235,0.12)] text-[#1d4ed8]" },
};

export const communityLocaleConfigs: Record<CommunityLocale, {
  buttonLabel: string;
  cardAccent: string;
  description: string;
  enterLabel: string;
  localeBadge: string;
  newPostTitle: string;
  postButtonLabel: string;
  searchPlaceholder: string;
  subtitle: string;
  switchLabel: string;
  tabs: { buddy: string; daily: string; help: string; nearby: string; recommend: string; secondhand: string };
  title: string;
  typeTitle: string;
  labels: { area: string; content: string; tags: string; title: string };
}> = {
  "zh-cn": {
    buttonLabel: "进入生活社区",
    cardAccent: "from-blue-500/18 to-sky-300/18",
    description: "生活分享、求助、闲置、搭子、找人帮忙",
    enterLabel: "进入",
    labels: { area: "地区", content: "内容", tags: "标签", title: "标题" },
    localeBadge: "社区",
    newPostTitle: "发布内容",
    postButtonLabel: "发布",
    searchPlaceholder: "搜索美食、租房、打工、Japan Life ID...",
    subtitle: "分享在日生活，看看附近的人都在做什么",
    switchLabel: "社区",
    tabs: { buddy: "搭子", daily: "日常", help: "求助", nearby: "附近", recommend: "推荐", secondhand: "闲置" },
    title: "生活社区",
    typeTitle: "选择类型",
  },
  "zh-tw": {
    buttonLabel: "进入生活社区",
    cardAccent: "from-blue-500/18 to-sky-300/18",
    description: "生活分享、求助、闲置、搭子、找人帮忙",
    enterLabel: "进入",
    labels: { area: "地区", content: "内容", tags: "标签", title: "标题" },
    localeBadge: "社区",
    newPostTitle: "发布内容",
    postButtonLabel: "发布",
    searchPlaceholder: "搜索美食、租房、打工、Japan Life ID...",
    subtitle: "分享在日生活，看看附近的人都在做什么",
    switchLabel: "社区",
    tabs: { buddy: "搭子", daily: "日常", help: "求助", nearby: "附近", recommend: "推荐", secondhand: "闲置" },
    title: "生活社区",
    typeTitle: "选择类型",
  },
  ja: {
    buttonLabel: "进入生活社区",
    cardAccent: "from-blue-500/18 to-sky-300/18",
    description: "生活分享、求助、闲置、搭子、找人帮忙",
    enterLabel: "进入",
    labels: { area: "地区", content: "内容", tags: "标签", title: "标题" },
    localeBadge: "社区",
    newPostTitle: "发布内容",
    postButtonLabel: "发布",
    searchPlaceholder: "搜索美食、租房、打工、Japan Life ID...",
    subtitle: "分享在日生活，看看附近的人都在做什么",
    switchLabel: "社区",
    tabs: { buddy: "搭子", daily: "日常", help: "求助", nearby: "附近", recommend: "推荐", secondhand: "闲置" },
    title: "生活社区",
    typeTitle: "选择类型",
  },
};

export function isCommunityLocale(value: string): value is CommunityLocale {
  return communityLocales.includes(value as CommunityLocale);
}

export function isCommunityViewLocale(value: string): value is CommunityViewLocale {
  return value === "all" || isCommunityLocale(value);
}

export function isCommunityPostType(value: string): value is CommunityPostType {
  return communityPostTypes.some((item) => item.id === value);
}

export function isCommunityPostStatus(value: string): value is CommunityPostStatus {
  return communityPostStatuses.includes(value as CommunityPostStatus);
}

export function isCommunityCommentStatus(value: string): value is CommunityCommentStatus {
  return communityCommentStatuses.includes(value as CommunityCommentStatus);
}

export function isCommunityReportStatus(value: string): value is CommunityReportStatus {
  return communityReportStatuses.includes(value as CommunityReportStatus);
}

export function isCommunityNotificationType(value: string): value is CommunityNotificationType {
  return communityNotificationTypes.includes(value as CommunityNotificationType);
}

export function isCommunityNotificationTargetType(value: string): value is CommunityNotificationTargetType {
  return communityNotificationTargetTypes.includes(value as CommunityNotificationTargetType);
}

export function hasCommunityRiskKeyword(value: string) {
  return communityRiskKeywords.some((keyword) => value.includes(keyword));
}

export function getCommunityPostTypeLabel(type: CommunityPostType) {
  return communityPostTypeLabels[type];
}
