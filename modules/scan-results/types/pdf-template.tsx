"use client";

import React from "react";

export type Rag = "red" | "amber" | "green";

export interface ScanData {
  submissionId: string;
  scorecard: {
    spend?: Rag;
    architecture?: Rag;
    pain?: Rag;
    readiness?: Rag;
    value?: Rag;
    opportunity?: Rag;
  };
  confidenceScore?: string;
  findings: string[];
  recommendations: string[];
  nextSteps?: string[];
  auditReport: string;
}

interface Props {
  data: ScanData;
  reportType?: "cost" | "opportunity";
}

const RAG_CONFIG: Record<Rag, { bg: string; border: string; text: string; label: string }> = {
  red: { bg: "#fff1f2", border: "#fca5a5", text: "#dc2626", label: "Critical Attention" },
  amber: { bg: "#fffbeb", border: "#fcd34d", text: "#d97706", label: "Needs Review" },
  green: { bg: "#f0fdf4", border: "#86efac", text: "#16a34a", label: "Healthy" },
};

const PAGE_STYLE: React.CSSProperties = {
  width: "794px",
  minHeight: "1123px",
  boxSizing: "border-box",
  padding: "24px",
  pageBreakAfter: "always",
};

const CARD_STYLE: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  boxShadow: "0 4px 24px rgba(2,6,23,0.08)",
  padding: "22px",
};

const avoidBreakStyle: React.CSSProperties = {
  breakInside: "avoid",
  pageBreakInside: "avoid",
};

const allowBreakStyle: React.CSSProperties = {
  breakInside: "auto",
  pageBreakInside: "auto",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  hyphens: "auto",
};

const parseInlineMarkdown = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|\*[^*]+\*|[^\*_]+)/g).filter(Boolean);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ fontWeight: 700, color: "#0f172a" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return (
        <em key={i} style={{ fontStyle: "italic", color: "#334155" }}>
          {part.slice(1, -1)}
        </em>
      );
    }

    return <span key={i}>{part}</span>;
  });
};

const renderMarkdown = (markdown: string): React.ReactNode => {
  const lines = markdown.split("\n");

  return lines.map((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return <div key={idx} style={{ height: "6px" }} />;
    }

    if (trimmed === "---" || trimmed === "***") {
      return <hr key={idx} style={{ margin: "10px 0", border: 0, borderTop: "1px solid #e2e8f0" }} />;
    }

    if (trimmed.startsWith("# ")) {
      return (
        <h2
          key={idx}
          style={{
            ...avoidBreakStyle,
            margin: "14px 0 8px",
            fontSize: "15px",
            fontWeight: 800,
            color: "#0f172a",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "4px",
          }}
        >
          {parseInlineMarkdown(trimmed.replace(/^#\s+/, ""))}
        </h2>
      );
    }

    if (trimmed.startsWith("## ")) {
      return (
        <h3
          key={idx}
          style={{
            ...avoidBreakStyle,
            margin: "12px 0 6px",
            fontSize: "12px",
            fontWeight: 700,
            color: "#1e293b",
          }}
        >
          {parseInlineMarkdown(trimmed.replace(/^##\s+/, ""))}
        </h3>
      );
    }

    if (trimmed.startsWith("### ")) {
      return (
        <h4
          key={idx}
          style={{
            ...avoidBreakStyle,
            margin: "10px 0 4px",
            fontSize: "11px",
            fontWeight: 700,
            color: "#334155",
          }}
        >
          {parseInlineMarkdown(trimmed.replace(/^###\s+/, ""))}
        </h4>
      );
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return (
        <p key={idx} style={{ ...allowBreakStyle, margin: "0 0 5px 0", fontSize: "10px", color: "#475569", lineHeight: 1.55 }}>
          <span style={{ color: "#4f46e5", fontWeight: 700, marginRight: "6px" }}>•</span>
          {parseInlineMarkdown(trimmed.replace(/^[-*]\s+/, ""))}
        </p>
      );
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const cleaned = trimmed.replace(/^(\d+)\.\s+/, "$1. ");
      return (
        <p key={idx} style={{ ...allowBreakStyle, margin: "0 0 5px 0", fontSize: "10px", color: "#475569", lineHeight: 1.55 }}>
          {parseInlineMarkdown(cleaned)}
        </p>
      );
    }

    return (
      <p key={idx} style={{ ...allowBreakStyle, margin: "0 0 6px 0", fontSize: "10px", color: "#475569", lineHeight: 1.6 }}>
        {parseInlineMarkdown(trimmed)}
      </p>
    );
  });
};

export const PdfReportTemplate: React.FC<Props> = ({ data, reportType = "cost" }) => {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const isCost = reportType === "cost";
  const scoreKeys = isCost
    ? (["spend", "architecture", "pain"] as const)
    : (["readiness", "value", "opportunity"] as const);

  const scoreLabels: Record<typeof scoreKeys[number], string> = isCost
    ? {
        spend: "Spend & Visibility",
        architecture: "Architecture Risk",
        pain: "Business Urgency",
      }
    : {
        readiness: "Technical AI Readiness",
        value: "Business Value Potential",
        opportunity: "Automation Opportunity",
      };

  const scoreValues = scoreKeys
    .map((key) => data.scorecard[key])
    .filter((value): value is Rag => Boolean(value));

  const ragToNumber = (value: Rag) => (value === "green" ? 3 : value === "amber" ? 2 : 1);
  const mean = scoreValues.length
    ? scoreValues.reduce((sum, current) => sum + ragToNumber(current), 0) / scoreValues.length
    : 2;

  const overallRag: Rag = mean >= 2.6 ? "green" : mean >= 1.8 ? "amber" : "red";

  const reportTitle = isCost ? "AI Cost Audit Executive Report" : "AI Opportunity Audit Executive Report";
  const reportSubtitle = isCost
    ? "Diagnostic analysis of cost leakage, architecture risk, and urgency."
    : "Diagnostic analysis of readiness, business value, and automation potential.";

  return (
    <div
      id="pdf-report-content"
      style={{
        width: "794px",
        backgroundColor: "#eef2ff",
        color: "#0f172a",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div style={PAGE_STYLE}>
        <div style={{ ...CARD_STYLE, ...avoidBreakStyle }}>
          <div style={{ height: "5px", borderRadius: "999px", marginBottom: "14px", background: "linear-gradient(90deg,#312e81 0%,#4f46e5 50%,#7c3aed 100%)" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
            <div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.6px", textTransform: "uppercase" }}>
                Pixel Punch Diagnostics
              </p>
              <h1 style={{ margin: "6px 0 4px", fontSize: "22px", lineHeight: 1.25, fontWeight: 800, color: "#0f172a" }}>{reportTitle}</h1>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: 1.4 }}>{reportSubtitle}</p>
            </div>

            <div style={{ textAlign: "right" }}>
              <p style={{ margin: "0 0 3px", fontSize: "11px", color: "#64748b" }}>Date: <strong style={{ color: "#0f172a" }}>{today}</strong></p>
              <p style={{ margin: "0 0 3px", fontSize: "11px", color: "#64748b" }}>Reference: <strong style={{ color: "#0f172a" }}>#{data.submissionId.slice(0, 8).toUpperCase()}</strong></p>
              {data.confidenceScore && <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>Confidence: <strong style={{ color: "#4f46e5" }}>{data.confidenceScore}</strong></p>}
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: 800, letterSpacing: "0.9px", color: "#94a3b8", textTransform: "uppercase" }}>
              Scorecard Overview
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              {scoreKeys.map((key) => {
                const rag = data.scorecard[key] ?? "amber";
                const cfg = RAG_CONFIG[rag];
                return (
                  <div
                    key={key}
                    style={{
                      ...avoidBreakStyle,
                      flex: 1,
                      border: `1.5px solid ${cfg.border}`,
                      backgroundColor: cfg.bg,
                      borderRadius: "10px",
                      padding: "11px 12px",
                    }}
                  >
                    <p style={{ margin: "0 0 6px", fontSize: "10px", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.35px" }}>
                      {scoreLabels[key]}
                    </p>
                    <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: cfg.text }}>{cfg.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ ...avoidBreakStyle, marginBottom: "12px", border: `1.5px solid ${RAG_CONFIG[overallRag].border}`, backgroundColor: RAG_CONFIG[overallRag].bg, borderRadius: "10px", padding: "12px" }}>
            <p style={{ margin: "0 0 4px", fontSize: "10px", fontWeight: 800, color: "#64748b", letterSpacing: "0.8px", textTransform: "uppercase" }}>
              Executive Summary
            </p>
            <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.55, color: "#334155" }}>
              Overall diagnostic status is <strong style={{ color: RAG_CONFIG[overallRag].text }}>{RAG_CONFIG[overallRag].label}</strong>. Prioritize the recommendations below to improve scorecard health and reduce operational risk.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
            <div style={{ ...avoidBreakStyle, flex: 1, border: "1px solid #e2e8f0", borderRadius: "10px", backgroundColor: "#f8fafc", padding: "12px" }}>
              <p style={{ margin: "0 0 7px", fontSize: "10px", fontWeight: 800, color: "#dc2626", letterSpacing: "0.7px", textTransform: "uppercase" }}>
                Key Findings ({data.findings.length})
              </p>
              {data.findings.slice(0, 8).map((finding, idx) => (
                <p key={idx} style={{ ...allowBreakStyle, margin: "0 0 5px", fontSize: "10px", color: "#475569", lineHeight: 1.55 }}>
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>•</span> {finding}
                </p>
              ))}
            </div>

            <div style={{ ...avoidBreakStyle, flex: 1, border: "1px solid #e2e8f0", borderRadius: "10px", backgroundColor: "#f8fafc", padding: "12px" }}>
              <p style={{ margin: "0 0 7px", fontSize: "10px", fontWeight: 800, color: "#16a34a", letterSpacing: "0.7px", textTransform: "uppercase" }}>
                Recommendations ({data.recommendations.length})
              </p>
              {data.recommendations.slice(0, 8).map((rec, idx) => (
                <p key={idx} style={{ ...allowBreakStyle, margin: "0 0 5px", fontSize: "10px", color: "#475569", lineHeight: 1.55 }}>
                  <span style={{ color: "#22c55e", fontWeight: 700 }}>•</span> {rec}
                </p>
              ))}
            </div>
          </div>

          {!!data.nextSteps?.length && (
            <div style={{ ...avoidBreakStyle, border: "1px solid #e2e8f0", borderRadius: "10px", backgroundColor: "#f8fafc", padding: "12px" }}>
              <p style={{ margin: "0 0 7px", fontSize: "10px", fontWeight: 800, color: "#4f46e5", letterSpacing: "0.7px", textTransform: "uppercase" }}>
                Next Steps ({data.nextSteps.length})
              </p>
              {data.nextSteps.slice(0, 10).map((step, idx) => (
                <p key={idx} style={{ ...allowBreakStyle, margin: "0 0 5px", fontSize: "10px", color: "#475569", lineHeight: 1.55 }}>
                  {idx + 1}. {step}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ ...PAGE_STYLE, pageBreakAfter: "auto" }}>
        <div style={CARD_STYLE}>
          <div style={{ height: "5px", borderRadius: "999px", marginBottom: "14px", background: "linear-gradient(90deg,#312e81 0%,#4f46e5 50%,#7c3aed 100%)" }} />
          <h2 style={{ ...avoidBreakStyle, margin: "0 0 10px", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>Full Audit Report</h2>

          <div style={{ ...allowBreakStyle, border: "1px solid #e2e8f0", borderRadius: "10px", backgroundColor: "#fafafa", padding: "14px" }}>
            {renderMarkdown(data.auditReport || "")}
          </div>
        </div>
      </div>
    </div>
  );
};
