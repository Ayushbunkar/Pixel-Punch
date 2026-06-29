"use client";

import { useCallback } from "react";
import { Share2, Check } from "lucide-react";
import toast from "react-hot-toast";

export function ShareResults() {
  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success("Link copied to clipboard!");
    }).catch(() => {
      toast.error("Could not copy link. Please copy the URL manually.");
    });
  }, []);

  return (
    <button
      type="button"
      id="cost-scan-share-btn"
      onClick={handleShare}
      className="inline-flex items-center justify-center px-5 py-2 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 rounded-lg font-bold text-xs transition-all duration-200 shadow-sm gap-2 h-9 min-w-[150px]"
      aria-label="Copy results link to clipboard"
    >
      <Share2 className="w-3.5 h-3.5" strokeWidth={2} />
      Share Results
    </button>
  );
}
