// =============================================================================
// Pixel Punch — AI Opportunity Audit · Recommendation Engine
// AI Consultant Persona & JSON-driven Recommendation Logic.
// ==========================dfg===================================================

import type { FormState } from "../types";
import type { ConfigScoringResult } from "./opportunity-score-engine";

export interface AIRecommendation {
  opportunity: string;
  problem: string;
  impact: string;
  complexity: "Low" | "Medium" | "High";
  priority: "Low" | "Medium" | "High";
}

/**
 * AI Prompt Template Builder
 */
export function buildRecommendationPrompt(input: FormState, scores: ConfigScoringResult): string {
  // Format data systems and manual processes
  const dataSystemsStr = input.data_systems.join(", ") || "None";
  const manualProcessesStr = input.manual_processes.join(", ") || "None";

  return `You are a senior AI Systems Architect and Lead Consultant at PixelPunch.
Your task is to analyze a client's assessment data and generate a list of the top 3-4 tailored AI and automation opportunities.

Here is the context about the client's business:
- Company: ${input.company} (Size: ${input.company_size.replace("_", "-")} employees)
- Business Type: ${input.business_type}
- Role of submission contact: ${input.job_title}

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

Calculated Dimension Scores (out of 100):
- Automation Opportunity: ${scores.automation_opportunity?.score}/100 (Classification: ${scores.automation_opportunity?.classification})
- AI Readiness: ${scores.ai_readiness?.score}/100 (Classification: ${scores.ai_readiness?.classification})
- Data Maturity: ${scores.data_maturity?.score}/100 (Classification: ${scores.data_maturity?.classification})
- Process Maturity: ${scores.process_maturity?.score}/100 (Classification: ${scores.process_maturity?.classification})
- Integration Readiness: ${scores.integration_readiness?.score}/100 (Classification: ${scores.integration_readiness?.classification})
- Business Impact potential: ${scores.business_impact?.score}/100 (Classification: ${scores.business_impact?.classification})

Scoring Rules Guidelines:
- Opportunity: Name of the AI implementation (e.g. "RAG Knowledge Base", "AI Support Agent", "Data entry Parser").
- Problem: The specific bottleneck identified from the client's answers (e.g. data silos, human email routing).
- Impact: What metric improves (e.g. reduce email response latency, save manual hours, centralize files).
- Complexity:
  * "Low" if standard is very_standardized, connection is fully_integrated, and data is clean.
  * "Medium" if somewhat_standardized or partially_integrated.
  * "High" if mostly_adhoc, mostly_disconnected, or data quality is poor.
- Priority:
  * "High" if Business Impact is high and Opportunity aligns with the main outcome or blocker.
  * "Medium" if moderate business impact.
  * "Low" if low impact or if complexity is high and data maturity is low.

You MUST respond with a JSON array of objects representing these top opportunities. Do not include markdown wraps or triple backticks in your output, just return the raw JSON array.
Each object must have this exact shape:
{
  "opportunity": "string",
  "problem": "string",
  "impact": "string",
  "complexity": "Low" | "Medium" | "High",
  "priority": "Low" | "Medium" | "High"
}
`;
}

/**
 * Fallback generator when no API keys are configured.
 */
export function generateFallbackRecommendations(input: FormState): AIRecommendation[] {
  const list: AIRecommendation[] = [];

  // 1. Customer Support Agent opportunity
  if (input.manual_processes.includes("customer_support") || input.inquiry_handling === "humans_mostly") {
    list.push({
      opportunity: "AI Customer Support Agent",
      problem: "Customer inquiries are handled manually, leading to high support workload.",
      impact: "Automate responses for up to 60% of common queries and resolve tickets instantly.",
      complexity: input.workflow_standardization === "mostly_adhoc" ? "High" : "Medium",
      priority: input.main_outcome === "lower_manual_work" ? "High" : "Medium",
    });
  }

  // 2. Lead qualification / Email SDR agent
  if (input.desired_use_case === "sales_followup" || input.biggest_challenge === "sales_gaps") {
    list.push({
      opportunity: "AI Sales Development Agent (SDR)",
      problem: "Sales lead qualification is manual and follow-up gaps occur.",
      impact: "Increase sales follow-up speed by automating qualification and calendar bookings.",
      complexity: "Medium",
      priority: "High",
    });
  }

  // 3. Document Parser & Data Integration
  if (input.manual_processes.includes("data_entry") || input.automation_barriers === "data_not_centralized") {
    list.push({
      opportunity: "Document Intelligence Parser",
      problem: "Team performs manual data entry and copying across systems.",
      impact: "Eliminate manual transcriptions and sync operational data directly to CRM/ERP.",
      complexity: input.data_quality === "poor_unclear" ? "High" : "Medium",
      priority: "High",
    });
  }

  // 4. Internal Knowledge Search (RAG)
  if (input.info_retrieval === "ask_colleague" || input.info_retrieval === "shared_drives") {
    list.push({
      opportunity: "Enterprise Ask-AI Search Hub (RAG)",
      problem: "Operational knowledge is siloed across drives or requires asking colleagues.",
      impact: "Save search hours by allowing instant questions across internal documents.",
      complexity: "Medium",
      priority: "Medium",
    });
  }

  // Fallback default
  if (list.length === 0) {
    list.push({
      opportunity: "Standardized Workflow Engine",
      problem: "Ad-hoc workflows limit immediate AI feasibility.",
      impact: "Prepare systems for AI by documenting and centralizing standard processes.",
      complexity: "Low",
      priority: "High",
    });
  }

  return list.slice(0, 4);
}

/**
 * Core Orchestrator to fetch recommendations from LLMs or fallback.
 */
export async function generateAIRecommendations(
  input: FormState,
  scores: ConfigScoringResult
): Promise<AIRecommendation[]> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;

  if (!geminiKey && !openaiKey && !mistralKey) {
    console.log("[opportunity-recommendation] No API keys configured. Using fallback generator.");
    return generateFallbackRecommendations(input);
  }

  const prompt = buildRecommendationPrompt(input, scores);

  try {
    let rawResponse = "";

    if (geminiKey) {
      console.log("[opportunity-recommendation] Querying Gemini model...");
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
          },
        }),
      });

      if (!res.ok) throw new Error(`Gemini API returned status ${res.status}`);
      const responseText = await res.text();
      if (!responseText.trim()) {
        throw new Error("Gemini API returned empty response");
      }
      const json = JSON.parse(responseText);
      rawResponse = json.candidates?.[0]?.content?.parts?.[0]?.text || "";

    } else if (openaiKey) {
      console.log("[opportunity-recommendation] Querying OpenAI model...");
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (!res.ok) throw new Error(`OpenAI API returned status ${res.status}`);
      const responseText = await res.text();
      if (!responseText.trim()) {
        throw new Error("OpenAI API returned empty response");
      }
      const json = JSON.parse(responseText);
      rawResponse = json.choices?.[0]?.message?.content || "";
    }

    // Clean response if markdown wraps exist
    let cleanedText = rawResponse.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    let parsed = JSON.parse(cleanedText);
    // If OpenAI returned an object wrapping the array, pull the array out
    if (!Array.isArray(parsed) && typeof parsed === "object") {
      const keys = Object.keys(parsed);
      if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
        parsed = parsed[keys[0]];
      } else {
        // Fallback if parsing results in structured object rather than array
        return generateFallbackRecommendations(input);
      }
    }

    if (Array.isArray(parsed)) {
      return parsed as AIRecommendation[];
    }
  } catch (err) {
    console.error("[opportunity-recommendation] Error running LLM recommendation engine:", err);
  }

  // Default fallback if anything fails
  return generateFallbackRecommendations(input);
}
