import { RefreshCw, Sparkles } from "lucide-react";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import type { WalkCollection } from "@/lib/walk/collections";
import type { WalkSpot } from "@/lib/walk/spots";

export function WalkCollections({
  activeCollection,
  collections,
  onClear,
  onSelect,
  onShuffle,
  spot,
}: {
  activeCollection: WalkCollection | null;
  collections: WalkCollection[];
  onClear: () => void;
  onSelect: (collection: WalkCollection) => void;
  onShuffle: () => void;
  spot: WalkSpot;
}) {
  return (
    <section className="rounded-[28px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-lime-100 text-emerald-700">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-emerald-700">Tokyo Walk Collection</p>
          <h2 className="mt-1 text-lg font-black text-[#10231A]">今天想要哪种散步？</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">选一个专题，Japan Life 会在这个氛围里帮你随机一个地方。</p>
        </div>
      </div>

      <CollapsiblePanel className="mt-4 rounded-[22px] bg-emerald-50/40 p-3 shadow-none" contentClassName="mt-3" summary={activeCollection ? `当前：${activeCollection.title}` : "默认随机"} title="专题选择">
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {collections.map((collection) => {
            const active = activeCollection?.id === collection.id;
            return (
              <button
                aria-pressed={active}
                className={`relative h-32 w-[156px] shrink-0 overflow-hidden rounded-[24px] border text-left shadow-sm transition active:scale-[0.98] ${
                  active ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200"
                }`}
                key={collection.id}
                onClick={() => onSelect(collection)}
                type="button"
              >
                <img alt={`${collection.title}专题`} className="absolute inset-0 h-full w-full object-cover" src={collection.coverImage} />
                <span className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/72" />
                <span className="absolute left-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-lg shadow-sm">{collection.emoji}</span>
                <span className="absolute bottom-3 left-3 right-3">
                  <span className="block text-sm font-black text-white">{collection.title}</span>
                  <span className="mt-1 line-clamp-2 block text-[11px] font-bold leading-4 text-white/82">{collection.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </CollapsiblePanel>

      {activeCollection && (
        <div className="mt-4 rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black text-emerald-700">当前专题</p>
              <h3 className="mt-1 text-lg font-black text-[#10231A]">
                {activeCollection.emoji} {activeCollection.title}
              </h3>
            </div>
            <button className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-black text-emerald-700 shadow-sm" onClick={onClear} type="button">
              取消
            </button>
          </div>
          <p className="mt-2 text-sm font-bold leading-6 text-[#475569]">{activeCollection.intro}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {activeCollection.tags.slice(0, 4).map((tag) => (
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-emerald-700 shadow-sm" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white p-3">
            <div className="min-w-0">
              <p className="text-[11px] font-black text-[#64748B]">当前推荐地点</p>
              <p className="mt-0.5 truncate text-base font-black text-[#10231A]">{spot.station}</p>
            </div>
            <button className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-emerald-700 px-3 text-xs font-black text-white" onClick={onShuffle} type="button">
              <RefreshCw className="h-3.5 w-3.5" />
              换一个专题地点
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
