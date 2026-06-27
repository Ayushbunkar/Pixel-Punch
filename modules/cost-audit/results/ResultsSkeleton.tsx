export function ResultsSkeleton() {
  return (
    <div className="min-h-screen bg-[#eef4ff] flex items-center justify-center">
      <div className="text-center w-full max-w-3xl px-4 animate-pulse">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-slate-600 text-sm mb-12">Loading your results…</p>
        
        {/* Header placeholder */}
        <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/3 mx-auto mb-10"></div>
        
        {/* Cards placeholders */}
        <div className="space-y-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200"></div>
          ))}
        </div>
        
        {/* Insights placeholder */}
        <div className="h-40 bg-white rounded-xl border border-slate-200 mb-8 p-6 text-left">
          <div className="h-4 bg-slate-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-3 bg-slate-200 rounded w-full"></div>
            <div className="h-3 bg-slate-200 rounded w-5/6"></div>
            <div className="h-3 bg-slate-200 rounded w-4/5"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
