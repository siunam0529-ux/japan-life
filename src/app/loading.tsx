export default function Loading() {
  return (
    <main className="jl-tool-theme min-h-screen text-stone-950">
      <div className="jl-tool-shell mx-auto min-h-screen max-w-[430px] px-4 py-5">
        <div className="flex items-center justify-between">
          <div className="h-11 w-11 rounded-2xl bg-white shadow-sm" />
          <div className="h-9 w-28 rounded-full bg-white shadow-sm" />
        </div>
        <section className="mt-6 rounded-[28px] bg-white p-5 shadow-[0_12px_35px_rgba(32,38,34,0.08)]">
          <div className="h-8 w-36 animate-pulse rounded-full bg-stone-100" />
          <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-stone-100" />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-stone-100" />
        </section>
        <section className="mt-4 grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((item) => (
            <div className="h-28 animate-pulse rounded-[22px] bg-white shadow-[0_10px_28px_rgba(32,38,34,0.06)]" key={item} />
          ))}
        </section>
      </div>
    </main>
  );
}
