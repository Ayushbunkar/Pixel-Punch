// ── Unified Brand Styling Constants ────────────────────────────────────────────
export const BRAND_COLORS = {
  primary: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", lightText: "#3b82f6" },
  accent: { bg: "#f8fafc", border: "#e2e8f0", text: "#334155", lightText: "#64748b" },
  success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a", lightText: "#22c55e" },
  warning: { bg: "#fffbeb", border: "#fcd34d", text: "#d97706", lightText: "#f59e0b" },
  danger: { bg: "#fff1f2", border: "#fca5a5", text: "#dc2626", lightText: "#ef4444" },
};

export const PDF_COLOR_CONFIG: Record<string, { bgColor: string; textColor: string; borderColor: string; dotColor: string; labelColor: string }> = {
  red:   { bgColor: "#fee2e2",  textColor: "#dc2626",  borderColor: "#fca5a5", dotColor: "#dc2626",  labelColor: "Action Needed" },
  amber: { bgColor: "#fffbeb",  textColor: "#d97706",  borderColor: "#fcd34d", dotColor: "#d97706",  labelColor: "Needs Attention" },
  green: { bgColor: "#f0fdf4",  textColor: "#16a34a",  borderColor: "#86efac", dotColor: "#16a34a",  labelColor: "Looking Good" },
};

export const TIER_CONFIG = {
  1: { bg: "#fff1f2", text: "#be123c", border: "#fca5a5", badge: "#dc2626", description: "An immediate, full AI Cost Audit is strongly recommended to stop active cost leakage." },
  2: { bg: "#fffbeb", text: "#92400e", border: "#fcd34d", badge: "#d97706", description: "A targeted architectural optimization sprint is advised to reduce identified waste." },
  3: { bg: "#f0fdf4", text: "#14532d", border: "#86efac", badge: "#16a34a", description: "Periodic monitoring and a lightweight quarterly review is suggested." },
  4: { bg: "#f8fafc", text: "#334155", border: "#e2e8f0", badge: "#64748b", description: "No immediate action required at your current scale." },
};

export const REPORT_TITLES = {
  cost: {
    header: "AI Cost Audit",
    executive: "AI Cost Audit Executive Report",
    executiveSubtitle: "Diagnostic analysis of cost leakage, architecture risk, and urgency.",
    technical: "Full Technical Audit",
    findings: "Key Findings",
    recommendations: "Expert Recommendations",
  },
  opportunity: {
    header: "AI Opportunity Audit",
    executive: "AI Opportunity Audit Executive Report",
    executiveSubtitle: "Diagnostic analysis of readiness, business value, and automation potential.",
    technical: "Full Technical Audit",
    findings: "Key Findings",
    recommendations: "Expert Recommendations",
  },
};

export const CSS_STYLES = {
  paper: "width: 794px; max-width: 100%; box-sizing: border-box;",
  container: "background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07);",
  header: "display: flex; justify-content: space-between; align-items: center; padding: 24px; border-bottom: 1px solid #e2e8f0; margin-bottom: 24px;",
  section: "background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;",
  sectionHeader: "font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; margin: 0 0 16px 0;",
  sectionHeaderSmall: "font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin: 0 0 12px 0;",
  badge: "display: inline-block; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 999px; padding: 2px 10px; font-size: 9px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.5px;",
  bullet: "margin-bottom: 8px; font-size: 14px; color: #475569; line-height: 1.6;",
};

export const PDF_STYLES = {
  paper: "width: 720px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07);",
  header: "display: flex; justify-content: space-between; align-items: center; padding: 10px 0 20px 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 20px;",
  footer: "margin-top: 40px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center;",
  body: "font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a;",
  section: "background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;",
  sectionHeader: "font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin: 0 0 20px 0;",
  sectionHeaderSmall: "font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin: 0 0 12px 0;",
  badge: "display: inline-block; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 999px; padding: 2px 10px; font-size: 9px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.5px;",
};
