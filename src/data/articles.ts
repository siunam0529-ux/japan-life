export type ArticleItem = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  views: string;
  image: string;
  href: string;
  updatedAt: string;
};

export const articleItems: ArticleItem[] = [
  {
    id: "rent-tokyo",
    title: "东京哪里租房更划算？",
    excerpt: "从区域、交通、房型和预算一起看，帮你避开只看房租的误区。",
    date: "05-20",
    views: "2.1k",
    image: "/thumb-rent.svg",
    href: "/areas",
    updatedAt: "2026-05-21",
  },
  {
    id: "student-work-limit",
    title: "留学生28小时怎么避免超时？",
    excerpt: "用打工时间记录开关，把每周剩余时间看清楚。",
    date: "05-19",
    views: "1.6k",
    image: "/thumb-work.svg",
    href: "/tools/work-hours",
    updatedAt: "2026-05-21",
  },
];
