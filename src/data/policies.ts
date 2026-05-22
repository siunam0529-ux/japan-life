export type PolicyItem = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  href: string;
  updatedAt: string;
};

export const policyItems: PolicyItem[] = [
  {
    id: "tokyo-018",
    title: "018サポート",
    subtitle: "东京都面向儿童成长的补助制度，申请条件请以官网为准。",
    tag: "育儿支援",
    href: "/resources",
    updatedAt: "2026-05-21",
  },
  {
    id: "health-insurance",
    title: "国民健康保险",
    subtitle: "搬家、入境、退职后常需要确认的健康保险手续。",
    tag: "生活手续",
    href: "/resources",
    updatedAt: "2026-05-21",
  },
];
