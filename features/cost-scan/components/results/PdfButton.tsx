"use client";

import { useState, useCallback } from "react";
import { Loader2, Download } from "lucide-react";
import toast from "react-hot-toast";

interface PdfButtonProps {
  submissionId?: string;
}

export function PdfButton({ submissionId }: PdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const exportPdf = useCallback(async () => {
    setLoading(true);
    const toastId = toast.loading("Generating your PDF report…");

    try {
      const html2pdf = (await import("html2pdf.js")).default;

      const element = document.getElementById("pdf-report-content");
      if (!element) throw new Error("Could not find PDF template in DOM.");

      const opt = {
        margin:      [15, 15, 15, 15],
        filename:    `Pixel-Punch-Cost-Audit-${submissionId?.slice(0, 8) ?? "report"}.pdf`,
        image:       { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale:       2,
          useCORS:     true,
          logging:     false,
          width:       794,
          windowWidth: 794,
        },
        jsPDF: {
          unit:        "mm" as const,
          format:      "a4",
          orientation: "portrait" as const,
          compress:    true,
        },
        pagebreak: { mode: ["css", "legacy"] as const },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("PDF downloaded successfully!", { id: toastId });

    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "PDF export failed. Please try again.",
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  return (
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
  );
}
