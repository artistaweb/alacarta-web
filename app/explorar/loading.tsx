export default function LoadingExplorar() {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl animate-pulse">
        <div className="h-7 w-40 rounded bg-white/10" />
        <div className="mt-2 h-4 w-32 rounded bg-white/10" />

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={`chip-${index}`}
              className="h-7 w-20 rounded-full bg-white/10"
            />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`card-${index}`}
              className="rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <div className="mb-4 overflow-hidden rounded-lg bg-white/10">
                <div className="aspect-[4/3] w-full" />
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="h-5 w-32 rounded bg-white/10" />
                <div className="h-5 w-10 rounded-full bg-white/10" />
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-4 w-full rounded bg-white/10" />
                <div className="h-4 w-5/6 rounded bg-white/10" />
              </div>
              <div className="mt-4 h-3 w-16 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
