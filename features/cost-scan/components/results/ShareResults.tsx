"use client";

import { useState, useCallback } from "react";
import { Share2 } from "lucide-react";

export function ShareResults() {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <button
      type="button"
      id="cost-scan-share-btn"
      onClick={handleShare}
      className="pp-btn-ghost text-sm border border-slate-300 hover:border-slate-400 text-slate-600"
      aria-label="Copy results link to clipboard"
    >
      {copied ? (
        <>✅ Link copied!</>
      ) : (
        <>
          <Share2 className="w-4 h-4 mr-1.5" strokeWidth={2} />
          Share Results
        </>
      )}
    </button>
  );
}
