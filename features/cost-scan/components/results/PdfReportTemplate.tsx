"use client";

import React from "react";
import Image from "next/image";
import { StoredScanResult } from "@/features/cost-scan/types";

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

// Inline SVG of the Sparkles icon (same as lucide-react Sparkles)
const SparklesSVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22" height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#0d6efd"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    <path d="M20 3v4"/>
    <path d="M22 5h-4"/>
    <path d="M4 17v2"/>
    <path d="M5 18H3"/>
  </svg>
);

export const PdfReportTemplate: React.FC<Props> = ({ result }) => {
  const spend = RAG_CONFIG[result.scorecard.spend];
  const arch  = RAG_CONFIG[result.scorecard.architecture];
  const pain  = RAG_CONFIG[result.scorecard.pain];
  const tierStyle = TIER_COLORS[result.tier];
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    // Outer shell — exact A4 dimensions at 96 DPI, white bg
    <div
      id="pdf-report-content"
      style={{
        width: "794px",
        height: "1123px",
        backgroundColor: "#f8fafc",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        color: "#0f172a",
        boxSizing: "border-box",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",   // ← vertically center entire content
        padding: "0",
      }}
    >
      {/* ── CARD — centred white box ─────────────────────────────── */}
      <div style={{
        width: "720px",           // 37px margin each side
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 32px rgba(0,0,0,0.07)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}>

        {/* ── TOP ACCENT BAR ────────────────────────────────────── */}
        <div style={{ height: "5px", background: "linear-gradient(90deg, #0d6efd 0%, #6610f2 100%)" }} />

        {/* ── CARD BODY ─────────────────────────────────────────── */}
        <div style={{ padding: "32px 36px 28px 36px", display: "flex", flexDirection: "column", gap: "22px" }}>

          {/* ── HEADER ROW ──────────────────────────────────────── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {/* LOGO — actual logo.jpg */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img src="/logo.jpg" alt="Pixel Punch" style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "contain" }} />
              <div>
                <p style={{ margin: 0, fontSize: "19px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.5px", lineHeight: "1.1" }}>Pixel Punch</p>
                <p style={{ margin: 0, fontSize: "10.5px", color: "#64748b", marginTop: "2px" }}>AI Cost Architecture Diagnostics</p>
              </div>
            </div>
            {/* META */}
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: "0 0 2px 0", fontSize: "11px", color: "#64748b" }}>
                Report Date: <strong style={{ color: "#1e293b" }}>{today}</strong>
              </p>
              <p style={{ margin: "0 0 6px 0", fontSize: "11px", color: "#64748b" }}>
                Ref: <strong style={{ color: "#1e293b" }}>#{result.submissionId.slice(0, 8).toUpperCase()}</strong>
              </p>
              <div style={{
                display: "inline-block",
                backgroundColor: "#eff6ff", border: "1px solid #bfdbfe",
                borderRadius: "999px", padding: "2px 10px",
                fontSize: "10px", fontWeight: "700", color: "#1d4ed8", textTransform: "uppercase" as const, letterSpacing: "0.5px",
              }}>Confidential</div>
            </div>
          </div>

          {/* ── DIVIDER ─────────────────────────────────────────── */}
          <div style={{ height: "1px", background: "#e2e8f0" }} />

          {/* ── TITLE ───────────────────────────────────────────── */}
          <div>
            <h1 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.5px" }}>
              AI Cost Architecture Audit
            </h1>
            <p style={{ margin: 0, fontSize: "12.5px", color: "#475569", lineHeight: "1.6" }}>
              This report summarises the diagnostic results of your AI infrastructure cost scan — identifying spend risk, architectural inefficiencies, and business urgency to prioritise the right next step.
            </p>
          </div>

          {/* ── SCORECARD ───────────────────────────────────────── */}
          <div>
            <p style={{ margin: "0 0 10px 0", fontSize: "10px", fontWeight: "800", textTransform: "uppercase" as const, letterSpacing: "1px", color: "#94a3b8" }}>
              Diagnostic Scorecard
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              {[
                { label: "Spend & Visibility",    desc: "Cost tracking & attribution", cfg: spend },
                { label: "Architecture Risk",     desc: "Infrastructure design & leakage", cfg: arch  },
                { label: "Business Urgency",      desc: "Operational pain & savings target", cfg: pain  },
              ].map(({ label, desc, cfg }) => (
                <div key={label} style={{
                  flex: 1,
                  minWidth: 0,
                  border: `1.5px solid ${cfg.border}`,
                  borderRadius: "10px",
                  padding: "14px 16px",
                  backgroundColor: cfg.bg,
                }}>
                  <p style={{ margin: "0 0 3px 0", fontSize: "11px", fontWeight: "800", color: "#334155", textTransform: "uppercase" as const, letterSpacing: "0.4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</p>
                  <p style={{ margin: "0 0 10px 0", fontSize: "10.5px", color: "#64748b", lineHeight: "1.4" }}>{desc}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ flexShrink: 0, width: "8px", height: "8px", borderRadius: "50%", backgroundColor: cfg.dot }} />
                    <span style={{ fontSize: "12.5px", fontWeight: "700", color: cfg.color }}>{cfg.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── KEY INSIGHTS ────────────────────────────────────── */}
          <div>
            <p style={{ margin: "0 0 10px 0", fontSize: "10px", fontWeight: "800", textTransform: "uppercase" as const, letterSpacing: "1px", color: "#94a3b8" }}>
              Key Diagnostic Insights
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {result.insights.map((insight, idx) => (
                <div key={idx} style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "11px 14px",
                }}>
                  {/* Plain number — no background */}
                  <div style={{
                    flexShrink: 0,
                    width: "22px",
                    minWidth: "22px",
                    fontSize: "13px",
                    fontWeight: "800",
                    color: "#94a3b8",
                    lineHeight: "1.65",
                    textAlign: "center",
                  }}>
                    {idx + 1}.
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", lineHeight: "1.65", color: "#334155", flex: 1, minWidth: 0 }}>{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── RECOMMENDATION ──────────────────────────────────── */}
          <div>
            <p style={{ margin: "0 0 10px 0", fontSize: "10px", fontWeight: "800", textTransform: "uppercase" as const, letterSpacing: "1px", color: "#94a3b8" }}>
              Our Recommendation
            </p>
            <div style={{
              backgroundColor: tierStyle.bg,
              border: `1.5px solid ${tierStyle.border}`,
              borderRadius: "10px",
              padding: "18px 20px",
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
            }}>
              <div style={{
                flexShrink: 0,
                width: "34px",
                height: "34px",
                minWidth: "34px",
                minHeight: "34px",
                borderRadius: "8px",
                backgroundColor: tierStyle.badge,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: "900",
                color: "#ffffff",
                lineHeight: "1",
              }}>
                {result.tier}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 4px 0", fontSize: "10px", fontWeight: "800", color: tierStyle.text, textTransform: "uppercase" as const, letterSpacing: "0.8px" }}>
                  Tier {result.tier} — Priority Assessment
                </p>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: tierStyle.text, lineHeight: "1.5" }}>
                  {TIER_LABELS[result.tier]}
                </p>
              </div>
            </div>
          </div>

          {/* ── DIVIDER ─────────────────────────────────────────── */}
          <div style={{ height: "1px", background: "#e2e8f0" }} />

          {/* ── FOOTER ──────────────────────────────────────────── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <img src="/logo.jpg" alt="Pixel Punch" style={{ width: "28px", height: "28px", borderRadius: "6px", objectFit: "contain" }} />
              <div>
                <p style={{ margin: "0 0 1px 0", fontSize: "11px", fontWeight: "700", color: "#334155" }}>Pixel Punch</p>
                <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8" }}>contact@pixelpunch.org • +1 (657) 200-1336</p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: "0 0 1px 0", fontSize: "10px", color: "#94a3b8" }}>pixelpunch.org</p>
              <p style={{ margin: 0, fontSize: "10px", color: "#cbd5e1" }}>© {new Date().getFullYear()} Pixel Punch. All rights reserved.</p>
            </div>
          </div>

        </div>

        {/* ── BOTTOM ACCENT BAR ─────────────────────────────────── */}
        <div style={{ height: "4px", background: "linear-gradient(90deg, #0d6efd 0%, #6610f2 100%)" }} />
      </div>
    </div>
  );
};
