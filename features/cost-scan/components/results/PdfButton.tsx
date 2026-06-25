"use client";

import { useState, useCallback } from "react";
import { Loader2, Download } from "lucide-react";

interface PdfButtonProps {
  submissionId: string;
}

export function PdfButton({ submissionId }: PdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportPdf = useCallback(async () => {
    // A simple, instant way to "export to PDF" is to trigger the browser's
    // native print dialog, combined with @media print CSS rules.
    window.print();
  }, []);

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        id="cost-scan-pdf-export-btn"
        onClick={exportPdf}
        disabled={loading}
        className="pp-btn-ghost text-sm border border-slate-300 hover:border-slate-400 text-slate-700"
        aria-label="Download PDF Report"
        title="PDF export"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-1.5" strokeWidth={2} />
            Download PDF Report
          </>
        )}
      </button>
      {error && <p className="text-center text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
