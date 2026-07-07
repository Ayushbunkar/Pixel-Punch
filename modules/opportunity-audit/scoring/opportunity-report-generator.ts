// =============================================================================
// Pixel Punch — AI Opportunity Audit · Report Generator
// Generates detailed Markdown reports based on inputs, scores, and recommendations.
// =============================================================================

import type { FormState } from "../types";
import type { ConfigScoringResult } from "./opportunity-score-engine";
import type { AIRecommendation } from "./opportunity-recommendation-engine";
import { Logger } from "@/shared/utils/logger";

export interface ReportOutput {
  reportText: string;
  findings: string[];
  nextSteps: string[];
}

/**
 * Builds the system prompt for generating the detailed Markdown report.
 */
export function buildReportPrompt(
  input: FormState,
  scores: ConfigScoringResult,
  recommendations: AIRecommendation[]
): string {
  const dataSystemsStr = (input.data_systems || []).join(", ");
  const manualProcessesStr = (input.manual_processes || []).join(", ");
  const recsStr = recommendations
    .map((r, i) => `${i + 1}. ${r.opportunity} (Problem: ${r.problem} | Priority: ${r.priority})`)
    .join("\n");

  return `You are a senior AI Systems Architect and Lead Consultant at PixelPunch.
Your task is to analyze the client's operational context, systems, data, and calculated scores, and write a premium, detailed AI Opportunity Audit & Roadmap Report.

Here is the context provided about the client's business:
- Company name: ${input.company} (Size: ${input.company_size.replace("_", "-")} employees)
- Business Type: ${input.business_type}
- Contact Person: ${input.firstname} ${input.lastname} (Role: ${input.job_title})

Operational Answers:
1. Target Outcome to improve: ${input.main_outcome}
2. Biggest operational challenge today: ${input.biggest_challenge}
3. Systems holding data: ${dataSystemsStr}
4. Automation barrier: ${input.automation_barriers}
5. Workflow standardization: ${input.workflow_standardization}
6. Processes requiring manual effort: ${manualProcessesStr}
7. How employees find info: ${input.info_retrieval}
8. Systems connectivity: ${input.systems_connection}
9. Data quality description: ${input.data_quality}
10. Customer inquiry handling: ${input.inquiry_handling}
11. Common support requests: ${input.request_types}
12. Lead qualification: ${input.lead_qualification}
13. Desired AI use case (self-reported interest): ${input.desired_use_case}
14. Adoption blocker: ${input.adoption_blocker}
${input.extra_context ? `15. Additional context provided: ${input.extra_context}` : ""}

Calculated Category Scores (out of 100):
- Automation Opportunity: ${scores.automation_opportunity?.score}/100 (Classification: ${scores.automation_opportunity?.classification})
- AI Readiness: ${scores.ai_readiness?.score}/100 (Classification: ${scores.ai_readiness?.classification})
- Data Maturity: ${scores.data_maturity?.score}/100 (Classification: ${scores.data_maturity?.classification})
- Process Maturity: ${scores.process_maturity?.score}/100 (Classification: ${scores.process_maturity?.classification})
- Integration Readiness: ${scores.integration_readiness?.score}/100 (Classification: ${scores.integration_readiness?.classification})
- Business Impact potential: ${scores.business_impact?.score}/100 (Classification: ${scores.business_impact?.classification})

Top Tailored AI Opportunities Selected:
${recsStr}

Please write a detailed, professional consultive report in Markdown.
Your response MUST include the exact phrase: "I analyzed the provided business information..." to introduce your findings.
The report must include the following exact headers and format:

# AI Opportunity Audit & Roadmap Report

### Executive Summary
Provide a professional, tailored summary (2 paragraphs) explaining their current operational posture and how AI can unlock business value specifically for their ${input.business_type} business model.

### Current Operations & Inefficiencies
Describe their current operational challenges, manual bottlenecks (specifically addressing ${manualProcessesStr}), and what is blocking automation (Centralization, integrations, etc.).

### AI Readiness & Scorecard Analysis
Walk through the 6 dimension scores. Provide specific analytical feedback on their AI Readiness, Data Maturity, and Integration Readiness. Highlight the steps they need to take to prep their data stack.

### Top AI Opportunities
Detail the recommended AI opportunities. For each opportunity, explain the business problem it solves and how to implement it (e.g. RAG, custom email agents, API connections).

### Phased Implementation Roadmap
Present a phased roadmap:
- **Phase 1: Quick Wins (0-3 Months)** - low complexity, immediate ROI.
- **Phase 2: Core Enhancements (3-6 Months)** - integrations, custom chatbots.
- **Phase 3: Strategic Scaling (6-12+ Months)** - multi-agent systems.

### Recommended Next Steps
Provide a list of 3 actionable next steps for the client to proceed with PixelPunch (e.g. Schedule an API architecture review, map SOPs).

### Key Findings (List exactly 3-5 bullet points starting with "-" here)
- Bullet 1
- Bullet 2

### Expert Recommendations (List exactly 3-5 bullet points starting with "-" here)
- Bullet 1
- Bullet 2
`;
}

/**
 * Generates a clean fallback markdown report when no API keys are present.
 */
export function generateFallbackReport(
  input: FormState,
  scores: ConfigScoringResult,
  recommendations: AIRecommendation[]
): ReportOutput {
  const dataSystemsStr = (input.data_systems || []).join(", ") || "various systems";
  const manualProcessesStr = (input.manual_processes || []).join(", ") || "manual tasks";
  const recsBullets = recommendations && recommendations.length > 0
    ? recommendations
        .map((r, i) => `- **Opportunity ${i + 1}: ${r.opportunity || 'AI Opportunity'}**\n  * *Problem solved:* ${r.problem || 'N/A'}\n  * *Business Impact:* ${r.impact || 'N/A'}\n  * *Complexity & Priority:* ${r.complexity || 'N/A'} Complexity | ${r.priority || 'N/A'} Priority`)
        .join("\n\n")
    : "";

  const reportText = `# AI Opportunity Audit & Roadmap Report

### Executive Summary
I analyzed the provided business information for **${input.company || "the business"}** and generated a customized AI Opportunity Roadmap. Based on their operating profile, there is a clear opportunity to apply intelligent automation to streamline workflows, reduce manual dependencies, and speed up business outcomes.

Given that the primary objective is to improve **${(input.main_outcome || "operational efficiency").replace("_", " ")}**, we have aligned this roadmap with their target operational goals and systems context.

### Current Operations & Inefficiencies
The client currently experiences operational bottlenecks under **${(input.biggest_challenge || " operational challenges").replace("_", " ")}**, with core processes like **${manualProcessesStr}** requiring significant manual, repetitive effort. 

The primary barrier preventing automation is **${(input.automation_barriers || "lack of infrastructure").replace("_", " ")}**. Because key customer and operational data is stored in **${dataSystemsStr}**, data synchronization and system connectivity represent critical areas of focus.

### AI Readiness & Scorecard Analysis
The 6 category dimensions calculated for ${input.company || "the business"} show:
- **Automation Opportunity**: ${scores.automation_opportunity?.score || 0}/100 (${scores.automation_opportunity?.classification?.toUpperCase() || "N/A"})
- **AI Readiness**: ${scores.ai_readiness?.score || 0}/100 (${scores.ai_readiness?.classification?.toUpperCase() || "N/A"})
- **Data Maturity**: ${scores.data_maturity?.score || 0}/100 (${scores.data_maturity?.classification?.toUpperCase() || "N/A"})
- **Process Maturity**: ${scores.process_maturity?.score || 0}/100 (${scores.process_maturity?.classification?.toUpperCase() || "N/A"})
- **Integration Readiness**: ${scores.integration_readiness?.score || 0}/100 (${scores.integration_readiness?.classification?.toUpperCase() || "N/A"})
- **Business Impact**: ${scores.business_impact?.score || 0}/100 (${scores.business_impact?.classification?.toUpperCase() || "N/A"})

A lower Data and Integration readiness indicates that before deploying advanced agentic AI, the client should focus on centralizing data pipelines and mapping workflow steps.

### Top AI Opportunities
Based on the diagnostic scan, we recommend prioritizing these initiatives:
${recsBullets || "- No specific recommendations available."}

### Phased Implementation Roadmap
- **Phase 1: Quick Wins (0-3 Months)**: Focus on low-complexity automations such as standardizing customer data fields and setting up basic automated alerts.
- **Phase 2: Core Enhancements (3-6 Months)**: Deploy dedicated RAG search systems or support copilots to help team members find documents instantly.
- **Phase 3: Strategic Scaling (6-12+ Months)**: Deploy multi-agent workflow systems to orchestrate reporting and data entry tasks.

### Recommended Next Steps
1. Map and document the exact step-by-step logic of your highest-frequency manual process.
2. Establish API connections between your CRM and spreadsheets to eliminate copy-paste silos.
3. Schedule an AI Architecture Review with the PixelPunch team to outline integration requirements.

### Key Findings
- Repetitive tasks like ${manualProcessesStr} create operational drag.
- Systems are partially isolated, requiring manual synchronization steps.
- Clean data pipelines represent a prerequisite for applying advanced LLM systems.

### Expert Recommendations
- Standardize core workflows into clear SOPs before applying AI agents.
- Centralize customer records into a single system of truth.
- Schedule a technical scoping session to outline quick-win AI projects.
`;

  return {
    reportText,
    findings: [
      `Repetitive tasks like ${manualProcessesStr} create operational drag.`,
      "Systems are partially isolated, requiring manual synchronization steps.",
       "Clean data pipelines represent a prerequisite for applying advanced LLM systems.",
    ],
    nextSteps: [
      "Map your manual workflows",
      "Centralize key datasets",
      "Schedule an AI Architecture Review",
    ],
  };
}

/**
 * Core Orchestrator to generate the Opportunity Audit Report.
 */
export async function generateOpportunityReport(
  input: FormState,
  scores: ConfigScoringResult,
  recommendations: AIRecommendation[]
): Promise<ReportOutput> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;

  if (!geminiKey && !openaiKey && !mistralKey) {
    Logger.info("[opportunity-report] No API keys configured. Using fallback report generator.");
    return generateFallbackReport(input, scores, recommendations);
  }

  const prompt = buildReportPrompt(input, scores, recommendations);

  try {
    let reportText = "";

    if (geminiKey) {
      Logger.info("[opportunity-report] Generating report via Gemini...");
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      });

      if (!res.ok) throw new Error(`Gemini API returned status ${res.status}`);
      const responseText = await res.text();
      if (!responseText.trim()) {
        throw new Error("Gemini API returned empty response");
      }
      const json = JSON.parse(responseText);
      reportText = json.candidates?.[0]?.content?.parts?.[0]?.text || "";

    } else if (openaiKey) {
      Logger.info("[opportunity-report] Generating report via OpenAI...");
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2
        })
      });

      if (!res.ok) throw new Error(`OpenAI API returned status ${res.status}`);
      const responseText = await res.text();
      if (!responseText.trim()) {
        throw new Error("OpenAI API returned empty response");
      }
      const json = JSON.parse(responseText);
      reportText = json.choices?.[0]?.message?.content || "";
    }

    if (reportText) {
      // Parse out key findings and next steps from reportText using simple regex
      const findings: string[] = [];
      const nextSteps: string[] = [];

      const findingsSection = reportText.match(/### Key Findings[\s\S]*?(?=###|$)/i);
      if (findingsSection) {
        const bullets = findingsSection[0].match(/-\s*[^\n]+/g);
        if (bullets) {
          bullets.forEach(b => findings.push(b.replace(/^-\s*/, "").trim()));
        }
      }

      const nextStepsSection = reportText.match(/### Recommended Next Steps[\s\S]*?(?=###|$)/i);
      if (nextStepsSection) {
        const items = nextStepsSection[0].match(/(?:\d+\.|\*|-)\s*[^\n]+/g);
        if (items) {
          items.forEach(it => nextSteps.push(it.replace(/^(?:\d+\.|\*|-)\s*/, "").trim()));
        }
      }

      return {
        reportText,
        findings: findings.length > 0 ? findings : ["Bottlenecks in manual operations", "System silos prevent automation"],
        nextSteps: nextSteps.length > 0 ? nextSteps : ["Map your manual workflows", "Centralize key datasets"],
      };
    }
  } catch (err) {
    Logger.error("[opportunity-report] Error running LLM report generator:", err);
  }

  return generateFallbackReport(input, scores, recommendations);
}
