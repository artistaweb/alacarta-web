export default function LoadingRestaurant() {
  return (
    <main className="p-6">
      <div className="animate-pulse">
        <div className="h-8 w-2/3 rounded bg-white/10" />
        <div className="mt-4 space-y-3">
          <div className="h-4 w-11/12 rounded bg-white/10" />
          <div className="h-4 w-5/6 rounded bg-white/10" />
          <div className="h-4 w-2/3 rounded bg-white/10" />
        </div>

        <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="h-4 w-40 rounded bg-white/10" />
          <div className="mt-3 space-y-2">
            <div className="h-4 w-4/5 rounded bg-white/10" />
            <div className="h-4 w-1/2 rounded bg-white/10" />
          </div>
        </div>
      </div>
    </main>
  );
}
