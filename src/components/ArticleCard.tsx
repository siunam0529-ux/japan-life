import { Eye } from "lucide-react";
import Link from "next/link";
import { ArticleItem } from "@/data/articles";

export function ArticleCard({ article }: { article: ArticleItem }) {
  return (
    <Link href={article.href} className="grid grid-cols-[88px_1fr] gap-3 rounded-[18px] border border-stone-200/70 bg-white p-3 shadow-[0_8px_22px_rgba(32,38,34,0.07)]">
      <img className="h-24 w-full rounded-[14px] object-cover" src={article.image} alt="" />
      <div className="min-w-0">
        <h3 className="text-[15px] font-black leading-snug">{article.title}</h3>
        <p className="mt-1 text-xs font-bold leading-5 text-stone-500">{article.excerpt}</p>
        <p className="mt-2 flex items-center justify-between text-xs font-bold text-stone-500">
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
