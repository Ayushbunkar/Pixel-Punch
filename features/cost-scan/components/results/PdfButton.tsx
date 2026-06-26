"use client";

import { useState, useCallback } from "react";
import { Loader2, Download } from "lucide-react";

interface PdfButtonProps {
  submissionId?: string;
}

export function PdfButton({ submissionId }: PdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportPdf = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Dynamically import html2pdf so it doesn't break Next.js SSR
      const html2pdf = (await import("html2pdf.js")).default;
      
      const element = document.getElementById("pdf-report-content");
      if (!element) throw new Error("Could not find PDF template in DOM.");

      const opt = {
        margin:      [0, 0, 0, 0],
        filename:    `Pixel-Punch-Cost-Audit-${submissionId?.slice(0, 8) ?? "report"}.pdf`,
        image:       { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale:       2,
          useCORS:     true,
          logging:     false,
          width:       794,   // A4 at 96 DPI
          height:      1123,  // A4 at 96 DPI
          windowWidth: 794,
        },
        jsPDF: {
          unit:        "mm" as const,
          format:      "a4",  // strict A4 — always exactly 1 page
          orientation: "portrait" as const,
          compress:    true,
        },
      };

      await html2pdf().set(opt).from(element).save();

    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF export failed.");
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

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
