import { Eye } from "lucide-react";
import Link from "next/link";
import { ArticleItem } from "@/data/articles";

export function ArticleCard({ article }: { article: ArticleItem }) {
  return (
    <Link href={article.href} className="grid grid-cols-[88px_1fr] gap-3 rounded-3xl border border-white/50 bg-white/75 p-3 shadow-[0_18px_45px_rgba(37,99,235,0.08)] backdrop-blur-xl">
      <img className="h-24 w-full rounded-2xl object-cover" src={article.image} alt="" />
      <div className="min-w-0">
        <h3 className="text-[15px] font-black leading-snug">{article.title}</h3>
        <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{article.excerpt}</p>
        <p className="mt-2 flex items-center justify-between text-xs font-bold text-[#64748B]">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {article.views}
          </span>
          <span>{article.date}</span>
        </p>
      </div>
    </Link>
  );
}
