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
      className="pp-btn-ghost text-sm border border-slate-300 hover:border-slate-400 text-slate-700"
      aria-label="Copy results link to clipboard"
    >
      <Share2 className="w-4 h-4 mr-1.5" strokeWidth={2} />
      Share Results
    </button>
  );
}
