"use client";

import React from "react";
import { StoredScanResult } from "@/modules/cost-audit/types";

interface Props {
  result: StoredScanResult;
}

const RAG_CONFIG = {
  red:   { bg: "#fff1f2", color: "#dc2626", border: "#fca5a5", dot: "#dc2626", label: "Action Needed" },
  amber: { bg: "#fffbeb", color: "#d97706", border: "#fcd34d", dot: "#d97706", label: "Needs Attention" },
  green: { bg: "#f0fdf4", color: "#16a34a", border: "#86efac", dot: "#16a34a", label: "Looking Good" },
};

const TIER_LABELS: Record<number, string> = {
  1: "An immediate, full AI Cost Audit is strongly recommended to stop active cost leakage.",
  2: "A targeted architectural optimization sprint is advised to reduce identified waste.",
  3: "Periodic monitoring and a lightweight quarterly review is suggested.",
  4: "No immediate action required at your current scale.",
};

const TIER_COLORS: Record<number, { bg: string; border: string; text: string; badge: string }> = {
  1: { bg: "#fff1f2", border: "#fca5a5", text: "#be123c", badge: "#dc2626" },
  2: { bg: "#fffbeb", border: "#fcd34d", text: "#92400e", badge: "#d97706" },
  3: { bg: "#f0fdf4", border: "#86efac", text: "#14532d", badge: "#16a34a" },
  4: { bg: "#f8fafc", border: "#e2e8f0", text: "#334155", badge: "#64748b" },
};

export const PdfReportTemplate: React.FC<Props> = ({ result }) => {
  const spend = RAG_CONFIG[result.scorecard.spend];
  const arch  = RAG_CONFIG[result.scorecard.architecture];
  const pain  = RAG_CONFIG[result.scorecard.pain];
  const tierStyle = TIER_COLORS[result.tier];
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const parseInlineMarkdown = (text: string) => {
    const boldParts = text.split(/\*\*([^*]+)\*\*/g);
    return boldParts.map((part, i) => {
      const isBold = i % 2 === 1;
      const italicParts = part.split(/[_*]([^*_]+)[_*]/g);
      const content = italicParts.map((subpart, j) => {
        const isItalic = j % 2 === 1;
        if (isItalic) {
          return <span key={j} style={{ fontStyle: "italic", color: "#475569" }}>{subpart}</span>;
        }
        return subpart;
      });

      if (isBold) {
        return <strong key={i} style={{ color: "#0f172a", fontWeight: "bold" }}>{content}</strong>;
      }
      return <span key={i}>{content}</span>;
    });
  };

  // Simple Markdown parser specifically sized for PDF printing
  const renderMarkdown = (md: string) => {
    return md.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) {
        return (
          <h2 key={idx} style={{ fontSize: "14px", fontWeight: "bold", color: "#0f172a", marginTop: "14px", marginBottom: "6px", borderBottom: "1px solid #e2e8f0", paddingBottom: "3px", pageBreakInside: "avoid" }}>
            {parseInlineMarkdown(trimmed.replace(/^#\s+/, ""))}
          </h2>
        );
      }
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={idx} style={{ fontSize: "11.5px", fontWeight: "bold", color: "#1e293b", marginTop: "10px", marginBottom: "4px", pageBreakInside: "avoid" }}>
            {parseInlineMarkdown(trimmed.replace(/^###\s+/, ""))}
          </h3>
        );
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <li key={idx} style={{ fontSize: "10px", color: "#475569", marginLeft: "12px", marginBottom: "3px", lineHeight: "1.4", listStyleType: "disc", pageBreakInside: "avoid" }}>
            {parseInlineMarkdown(trimmed.replace(/^[-*]\s+/, ""))}
          </li>
        );
      }
      if (trimmed === "---") {
        return <hr key={idx} style={{ marginTop: "10px", marginBottom: "10px", border: "0", borderTop: "1px solid #e2e8f0" }} />;
      }
      if (trimmed === "") {
        return <div key={idx} style={{ height: "4px" }} />;
      }
      return (
        <p key={idx} style={{ fontSize: "10px", color: "#475569", marginBottom: "5px", lineHeight: "1.4", pageBreakInside: "avoid" }}>
          {parseInlineMarkdown(trimmed)}
        </p>
      );
    });
  };
//sdfffdsfdsdfs
  return (
    <div id="pdf-report-content" style={{ width: "794px", backgroundColor: "#f8fafc", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: "#0f172a", boxSizing: "border-box" }}>
      
      {/* ── PAGE 1: DIAGNOSTIC SCORECARD ────────────────────────────────────────── */}
      <div style={{ width: "794px", minHeight: "1060px", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 0", pageBreakAfter: "always" }}>
        <div style={{ width: "720px", backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 32px rgba(0,0,0,0.07)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ height: "5px", background: "linear-gradient(90deg, #0d6efd 0%, #6610f2 100%)" }} />
          <div style={{ padding: "28px 32px 24px 32px", display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img src="/logo.jpg" alt="Pixel Punch" style={{ height: "36px", width: "auto", objectFit: "contain" }} />
                <div style={{ height: "24px", width: "1px", backgroundColor: "#e2e8f0", margin: "0 4px" }} />
                <div>
                  <p style={{ margin: 0, fontSize: "11px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>AI Cost Architecture Diagnostics</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0 0 2px 0", fontSize: "11px", color: "#64748b" }}>
                  Report Date: <strong style={{ color: "#1e293b" }}>{today}</strong>
                </p>
                <p style={{ margin: "0 0 2px 0", fontSize: "11px", color: "#64748b" }}>
                  Ref: <strong style={{ color: "#1e293b" }}>#{result.submissionId.slice(0, 8).toUpperCase()}</strong>
                </p>
                {result.confidenceScore && (
                  <p style={{ margin: "0 0 6px 0", fontSize: "11px", color: "#64748b" }}>
                    Confidence: <strong style={{ color: "#4f46e5" }}>{result.confidenceScore}</strong>
                  </p>
                )}
                <div style={{ display: "inline-block", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "999px", padding: "2px 10px", fontSize: "10px", fontWeight: "700", color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Confidential</div>
              </div>
            </div>

            <div style={{ height: "1px", background: "#e2e8f0" }} />

            <div>
              <h1 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.5px" }}>
                AI Cost Architecture Audit Summary
              </h1>
              <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: "1.5" }}>
                This report summarises the diagnostic results of your AI infrastructure cost scan — identifying spend risk, architectural inefficiencies, and business urgency to prioritise the right next step.
              </p>
            </div>

            {/* Diagnostic Scorecard Section */}
            <div>
              <p style={{ margin: "0 0 8px 0", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", color: "#94a3b8" }}>
                Diagnostic Scorecard
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                {[
                  { label: "Spend & Visibility",    desc: "Cost tracking & attribution", cfg: spend },
                  { label: "Architecture Risk",     desc: "Infrastructure design & leakage", cfg: arch  },
                  { label: "Business Urgency",      desc: "Operational pain & savings target", cfg: pain  },
                ].map(({ label, desc, cfg }) => (
                  <div key={label} style={{ flex: 1, minWidth: 0, border: `1.5px solid ${cfg.border}`, borderRadius: "10px", padding: "12px 14px", backgroundColor: cfg.bg }}>
                    <p style={{ margin: "0 0 3px 0", fontSize: "10.5px", fontWeight: "800", color: "#334155", textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</p>
                    <p style={{ margin: "0 0 8px 0", fontSize: "10px", color: "#64748b", lineHeight: "1.35" }}>{desc}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ flexShrink: 0, width: "8px", height: "8px", borderRadius: "50%", backgroundColor: cfg.dot }} />
                      <span style={{ fontSize: "12px", fontWeight: "700", color: cfg.color }}>{cfg.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence Verification Section */}
            {result.confidenceScore && (
              <div>
                <p style={{ margin: "0 0 8px 0", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", color: "#94a3b8" }}>
                  AI Infrastructure Audit Evidence Verification
                </p>
                <div style={{ display: "flex", gap: "16px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 16px" }}>
                  {/* Confidence Indicator */}
                  <div style={{ flex: "0 0 120px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRight: "1px solid #e2e8f0", paddingRight: "16px" }}>
                    <span style={{ fontSize: "9px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Audit Confidence</span>
                    <span style={{ fontSize: "24px", fontWeight: "900", color: "#4f46e5" }}>{result.confidenceScore}</span>
                    <span style={{ fontSize: "8px", fontWeight: "700", textTransform: "uppercase", color: "#4f46e5", backgroundColor: "#eeebff", padding: "1px 6px", borderRadius: "4px", marginTop: "4px" }}>
                      {Number(result.confidenceScore.replace("%", "")) >= 70 
                        ? "High Data Depth" 
                        : Number(result.confidenceScore.replace("%", "")) >= 40 
                          ? "Medium Data Depth" 
                          : "Low Data Depth"}
                    </span>
                  </div>
                  
                  {/* Cost Evidence Summary */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                      <span style={{ color: "#64748b", fontWeight: "500" }}>Billed Provider:</span>
                      <strong style={{ color: "#0f172a" }}>{result.costAnalysis?.normalizedData?.provider || "Self-reported Provider"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                      <span style={{ color: "#64748b", fontWeight: "500" }}>Audited Spend Run:</span>
                      <strong style={{ color: "#4f46e5" }}>{result.costAnalysis?.normalizedData?.monthlySpend || "No direct billing data"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px" }}>
                      <span style={{ color: "#64748b", fontWeight: "500" }}>Identified Waste:</span>
                      <strong style={{ color: "#dc2626" }}>{result.costAnalysis?.normalizedData?.unusedResources || "Unoptimized staging endpoints"}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Key Diagnostic Insights Section */}
            <div>
              <p style={{ margin: "0 0 8px 0", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", color: "#94a3b8" }}>
                Key Diagnostic Insights
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {result.insights.map((insight, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 12px" }}>
                    <div style={{ flexShrink: 0, width: "20px", minWidth: "20px", fontSize: "12px", fontWeight: "800", color: "#94a3b8", lineHeight: "1.5", textAlign: "center" }}>
                      {idx + 1}.
                    </div>
                    <p style={{ margin: 0, fontSize: "11.5px", lineHeight: "1.5", color: "#334155", flex: 1, minWidth: 0 }}>{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Our Recommendation Section */}
            <div>
              <p style={{ margin: "0 0 8px 0", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", color: "#94a3b8" }}>
                Our Recommendation
              </p>
              <div style={{ backgroundColor: tierStyle.bg, border: `1.5px solid ${tierStyle.border}`, borderRadius: "10px", padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ flexShrink: 0, width: "32px", height: "32px", minWidth: "32px", minHeight: "32px", borderRadius: "8px", backgroundColor: tierStyle.badge, textAlign: "center", lineHeight: "32px", fontSize: "15px", fontWeight: "900", color: "#ffffff" }}>
                  {result.tier}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 3px 0", fontSize: "9px", fontWeight: "800", color: tierStyle.text, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                    Tier {result.tier} — Priority Assessment
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: tierStyle.text, lineHeight: "1.4" }}>
                    {TIER_LABELS[result.tier]}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ height: "1px", background: "#e2e8f0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <img src="/logo.jpg" alt="Pixel Punch" style={{ height: "24px", width: "auto", objectFit: "contain" }} />
                <div style={{ height: "16px", width: "1px", backgroundColor: "#e2e8f0", margin: "0 4px" }} />
                <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8" }}>contact@pixelpunch.org • +1 (657) 200-1336</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0 0 1px 0", fontSize: "10px", color: "#94a3b8" }}>pixelpunch.org</p>
                <p style={{ margin: 0, fontSize: "10px", color: "#cbd5e1" }}>© {new Date().getFullYear()} Pixel Punch. All rights reserved.</p>
              </div>
            </div>

          </div>
          <div style={{ height: "4px", background: "linear-gradient(90deg, #0d6efd 0%, #6610f2 100%)" }} />
        </div>
      </div>

      {/* ── PAGE 2: DETAILED AI INFRASTRUCTURE COST AUDIT REPORT ──────────────── */}
      {result.auditReport && (
        <div style={{ width: "794px", minHeight: "1060px", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "30px 0" }}>
          <div style={{ width: "720px", backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 32px rgba(0,0,0,0.07)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ height: "5px", background: "linear-gradient(90deg, #0d6efd 0%, #6610f2 100%)" }} />
            <div style={{ padding: "28px 30px 24px 30px", display: "flex", flexDirection: "column", gap: "16px" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <img src="/logo.jpg" alt="Pixel Punch" style={{ height: "28px", width: "auto", objectFit: "contain" }} />
                  <div style={{ height: "18px", width: "1px", backgroundColor: "#e2e8f0", margin: "0 4px" }} />
                  <span style={{ fontSize: "10px", fontWeight: "750", color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>Cost Audit Report</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "9px", fontWeight: "800", backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.5px", padding: "2px 8px" }}>
                    AI Generated Findings
                  </span>
                </div>
              </div>

              <div style={{ height: "1px", background: "#e2e8f0" }} />

              {/* Row 1: Side-by-Side Findings & Recommendations */}
              <div style={{ display: "flex", gap: "16px", marginBottom: "4px" }}>
                
                {result.findings && result.findings.length > 0 && (
                  <div style={{ flex: 1, backgroundColor: "#fff5f5", border: "1px solid #fee2e2", borderRadius: "10px", padding: "12px 14px" }}>
                    <h3 style={{ fontSize: "10.5px", fontWeight: "900", color: "#b91c1c", margin: "0 0 6px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Key Findings
                    </h3>
                    <ul style={{ margin: 0, padding: 0, listStyleType: "none" }}>
                      {result.findings.map((f, i) => (
                        <li key={i} style={{ fontSize: "9.5px", color: "#475569", marginBottom: "4px", lineHeight: "1.35", display: "flex", alignItems: "flex-start", gap: "4px" }}>
                          <strong style={{ color: "#ef4444" }}>•</strong>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.recommendations && result.recommendations.length > 0 && (
                  <div style={{ flex: 1, backgroundColor: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: "10px", padding: "12px 14px" }}>
                    <h3 style={{ fontSize: "10.5px", fontWeight: "900", color: "#15803d", margin: "0 0 6px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Expert Recommendations
                    </h3>
                    <ul style={{ margin: 0, padding: 0, listStyleType: "none" }}>
                      {result.recommendations.map((r, i) => (
                        <li key={i} style={{ fontSize: "9.5px", color: "#475569", marginBottom: "4px", lineHeight: "1.35", display: "flex", alignItems: "flex-start", gap: "4px" }}>
                          <strong style={{ color: "#22c55e" }}>•</strong>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>

              {/* Row 2: Full Width Detailed Report */}
              <div style={{ backgroundColor: "#fafaf9", border: "1px solid #f5f5f4", borderRadius: "10px", padding: "16px 20px" }}>
                {renderMarkdown(result.auditReport)}
              </div>

              <div style={{ height: "1px", background: "#e2e8f0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <img src="/logo.jpg" alt="Pixel Punch" style={{ height: "20px", width: "auto", objectFit: "contain" }} />
                  <p style={{ margin: 0, fontSize: "9px", color: "#94a3b8" }}>Ref: #{result.submissionId.slice(0, 8).toUpperCase()} • Detailed AI Cost Audit</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: "9px", color: "#cbd5e1" }}>© {new Date().getFullYear()} Pixel Punch.</p>
                </div>
              </div>

            </div>
            <div style={{ height: "4px", background: "linear-gradient(90deg, #0d6efd 0%, #6610f2 100%)" }} />
          </div>
        </div>
      )}

    </div>
  );
};

