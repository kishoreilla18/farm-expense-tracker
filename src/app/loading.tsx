export default function GlobalLoading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 py-12 text-center">
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 animate-ping rounded-full bg-sprout/20 absolute"></div>
        <img
          src="/icons/icon-main.jpg"
          alt="Loading..."
          className="relative h-14 w-14 rounded-2xl shadow-md border border-forest/20 object-cover animate-pulse"
        />
      </div>
      <p className="mt-4 font-display text-base font-semibold text-forest">Loading your farm data...</p>
      <p className="text-xs text-ink/60 mt-1">Please wait a moment</p>
    </div>
  );
}
