export default function SkeletonCard() {
  return (
    <div className="relative bg-[#111827]/60 backdrop-blur-md p-5 rounded-3xl border border-slate-700/30 overflow-hidden">

      {/* Shimmer sweep layer */}
      <div
        className="absolute inset-0 -translate-x-full animate-shimmer"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.05) 60%, transparent 100%)',
          backgroundSize: '600px 100%',
        }}
      />

      {/* Category badge */}
      <div className="h-[22px] w-16 bg-slate-800/80 rounded-full mb-3" />

      {/* Site name */}
      <div className="h-4 w-36 bg-slate-800 rounded-lg mb-2" />

      {/* Username */}
      <div className="h-3 w-24 bg-slate-800/60 rounded-lg mb-5" />

      {/* Password field */}
      <div className="h-11 w-full bg-[#0B0F19]/80 rounded-xl border border-slate-800/40 mb-3" />

      {/* Strength meter */}
      <div className="flex gap-1 mb-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-[3px] flex-1 bg-slate-800/80 rounded-full" />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <div className="h-10 flex-1 bg-slate-800/80 rounded-xl" />
        <div className="h-10 w-10 bg-slate-800/80 rounded-xl" />
      </div>
    </div>
  );
}