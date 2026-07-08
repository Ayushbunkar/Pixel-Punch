import type { FormState, Rag } from "@/modules/cost-audit/types";

import { getStorageService } from "@/shared/services/storage/storage-provider.service";
import { Logger } from "@/shared/utils/logger";

interface AuditInput {
  answers: FormState;
  scores: {
    spend: Rag;
    architecture: Rag;
    pain: Rag;
    tier: number;
  };
  websiteUrl?: string;
  aiStack: {
    providers?: string[];
    models?: string;
    infrastructure?: string[];
    other?: string[];
  };
  technicalNotes?: string;
  files: Array<{ name: string; path: string; type: string; size: number }>;
  architectureAnalysis?: { summary: string; findings: string[]; risks: string[] };
  costAnalysis?: { summary: string; normalizedData: any };
  usageMetrics?: any;
  confidenceScore?: string;
}

interface AuditOutput {
  auditReport: string;
  findings: string[];
  recommendations: string[];
}

/**
 * Extracts bullet points under a specific heading from HTML text.
 */
function extractBulletPoints(reportText: string, heading: string): string[] {
  const result: string[] = [];
  const sectionRegex = new RegExp(`<h3[^>]*>\\s*${heading}\\s*<\\/h3>[\\s\\S]*?(?=<h3|$)`, 'i');
  const sectionMatch = reportText.match(sectionRegex);
  
  if (sectionMatch) {
    const listItems = sectionMatch[0].match(/<li[^>]*>(.*?)<\/li>/gi);
    if (listItems) {
      listItems.forEach(item => {
        const clean = item.replace(/<[^>]+>/g, '').trim();
        if (clean) {
          result.push(clean);
        }
      });
    }
  }

  return result;
}

/**
 * Fallback local report generator when no LLM API key is configured or API fails.
 */
async function generateFallbackReport(input: AuditInput): Promise<AuditOutput> {
  const { answers, scores, websiteUrl, aiStack, technicalNotes, files, architectureAnalysis, costAnalysis, usageMetrics, confidenceScore } = input;
  const companyName = answers.company || "Your Company";

  const storageService = getStorageService();
  const filesWithContent: Array<{ name: string; content: string }> = [];
  for (const file of files) {
    try {
      const fileBuffer = await storageService.downloadFile(file.path);
      filesWithContent.push({ name: file.name, content: fileBuffer.toString('utf8') });
    } catch (error: unknown) {
      Logger.error(`[audit.service] Failed to download file ${file.path}:`, error);
      filesWithContent.push({ name: file.name, content: `Error downloading file: ${(error as Error).message}` });
    }
  }

  // Extract domain name
  let domain = "";
  if (websiteUrl) {
    try {
      domain = websiteUrl.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
    } catch {
      domain = websiteUrl;
    }
  }

  // Analyze files for tech keywords
  const detectedTech: string[] = [];
  const fileKeywords = {
    "Vector Database": ["pinecone", "chroma", "milvus", "qdrant", "weaviate", "pgvector", "faiss"],
    "AI Orchestrator": ["langchain", "llamaindex", "autogen", "crewai", "semantic kernel"],
    "Cloud & Infrastructure": ["kubernetes", "docker", "eks", "ecs", "fargate", "sagemaker", "runpod", "baseten", "together", "anyscale", "modal"],
    "AI Observability": ["langfuse", "langsmith", "openllmetry", "portkey", "helicone", "phoenix"],
  };

  const parsedFilesInfo: string[] = [];

  filesWithContent.forEach(f => {
    const textLower = f.content.toLowerCase();

    for (const [category, words] of Object.entries(fileKeywords)) {
      words.forEach(word => {
        if (textLower.includes(word)) {
          const formatted = category === "AI Observability" || category === "AI Orchestrator"
            ? `${word.charAt(0).toUpperCase() + word.slice(1)} (${category})`
            : word.toUpperCase();
          if (!detectedTech.includes(formatted)) {
            detectedTech.push(formatted);
          }
        }
      });
    }

    let snippet = f.content.trim().replace(/\s+/g, ' ');
    if (snippet.length > 200) {
      snippet = snippet.substring(0, 197) + "...";
    }
    parsedFilesInfo.push(`<li><strong>Analyzed File [${f.name}]</strong>: Decoded and parsed text context. Detected technical summary: <em>"${snippet || "(Empty text content detected)"}"</em></li>`);
  });

  const providers = aiStack.providers || [];
  const models = aiStack.models || "";
  const infrastructure = aiStack.infrastructure || [];
  const otherStack = aiStack.other || [];

  const hasHighSpend = answers.monthly_spend_band === "100k_plus" || answers.monthly_spend_band === "25k_100k";
  const hasMediumSpend = answers.monthly_spend_band === "5k_25k";
  const hasOpenAI = providers.includes("OpenAI");
  const hasAnthropic = providers.includes("Anthropic");
  const hasRAG = otherStack.includes("RAG system");
  const hasVectorDb = otherStack.includes("Vector database");
  const hasGPUs = otherStack.includes("GPU usage");
  const hasNoUnitEconomics = answers.unit_economics.includes("none");

  const findings: string[] = [];
  const recommendations: string[] = [];

  findings.push(`I analyzed the provided technical information for ${companyName}${domain ? ` (associated with domain ${domain})` : ""} and identified critical areas of infrastructure cost leakage.`);

  if (hasHighSpend) {
    findings.push(`Premium LLM calls represent a substantial cost vector, showing potential token redundancies under the current '${answers.leakage_pattern}' leakage pattern.`);
  } else if (hasMediumSpend) {
    findings.push("Unmanaged development workflows and loose orchestration thresholds are causing minor cost runaways.");
  } else {
    findings.push("Initial pilots and small deployments lack prompt reuse, resulting in higher cold-start input costs per request.");
  }

  if (architectureAnalysis?.findings && architectureAnalysis.findings.length > 0) {
    findings.push(...architectureAnalysis.findings);
  } else if (hasRAG || hasVectorDb) {
    findings.push("Vector searches and RAG injection contexts are unpruned, frequently bloating the LLM prompt size with redundant tokens.");
  }

  if (hasGPUs) {
    findings.push("Low GPU host utilization rates during off-peak windows indicate potential waste in dedicated instance hosting.");
  }

  if (hasNoUnitEconomics) {
    findings.push("Complete absence of granular cost tracking (cost-per-request or user attribution) creates pricing risks during production scaling.");
  }

  if (detectedTech.length > 0) {
    findings.push(`Detected signature components in resource files: ${detectedTech.join(", ")}. These present integration-level optimization opportunities.`);
  }

  while (findings.length < 3) {
    findings.push("Under-optimized prompt templates retransmitting identical system instructions repeatedly.");
  }
  if (findings.length > 5) {
    findings.splice(5);
  }

  if (hasOpenAI || hasAnthropic) {
    recommendations.push(`Implement Semantic Caching: Deploy a caching proxy (such as Redis or Portkey) to intercept identical model queries, targeting the primary provider${providers.length > 1 ? 's' : ''} (${providers.join(", ")}).`);
  }
  
  if (models.toLowerCase().includes("gpt-4") || models.toLowerCase().includes("claude-3-5")) {
    const primaryModel = models.toLowerCase().includes("gpt-4") ? "GPT-4" : "Claude 3.5 Sonnet";
    const lighterModel = models.toLowerCase().includes("gpt-4") ? "GPT-4o-mini" : "Claude 3.5 Haiku";
    recommendations.push(`Adopt Model Tiering: Route simple routing, classification, or small JSON formatting queries away from ${primaryModel} and down to ${lighterModel}, which yields up to a 90% cost reduction.`);
  } else {
    recommendations.push("Establish a Multi-model Gateway: Enable fallbacks to lighter model weights (e.g. Gemini 2.5 Flash) for low-complexity operational tasks.");
  }

  if (hasRAG || hasVectorDb) {
    recommendations.push("Apply RAG Optimization: Shrink chunk sizes, implement hybrid re-ranking, and configure metadata filters to avoid sending irrelevant text contexts inside the LLM prompt window.");
  }

  if (hasGPUs) {
    recommendations.push("Migrate to Serverless Inference: Shift cold/idle models from persistent AWS EC2/GCP instances to auto-scaling serverless model containers (e.g., RunPod, Baseten, or Together API).");
  }

  if (hasNoUnitEconomics) {
    recommendations.push("Integrate cost observability gateways (such as Langfuse, LiteLLM, or Helicone) to associate every token call with a unique userId or feature flag.");
  }

  if (usageMetrics?.optimizationAreas) {
    usageMetrics.optimizationAreas.forEach((area: string) => {
      if (!recommendations.includes(area)) {
        recommendations.push(area);
      }
    });
  }

  while (recommendations.length < 3) {
    recommendations.push("Enable native provider Prompt Caching (supported by Anthropic and Gemini) for system prompts exceeding 1,024 tokens.");
  }
  if (recommendations.length > 5) {
    recommendations.splice(5);
  }

  const costDetails = costAnalysis?.normalizedData || {};

  const htmlReport = `
<div class="report-container">
  <h1>AI Cost Audit & Architecture Report</h1>
  <h3>Executive Summary</h3>
  <p>I analyzed the provided technical information for <strong>${companyName}</strong> to assess cost efficiency, performance risk, and architecture scaling patterns. The audit score indicates a <strong>Tier ${scores.tier}</strong> priority.</p>
  <h3>Current Architecture Analysis</h3>
  <ul>
    <li><strong>Primary Providers</strong>: ${providers.join(", ")}</li>
    <li><strong>Models</strong>: ${models}</li>
    <li><strong>Cloud</strong>: ${infrastructure.join(", ")}</li>
  </ul>
  ${parsedFilesInfo.length > 0 ? `<ul>${parsedFilesInfo.join("\n")}</ul>` : ""}
  <h3>Cost Analysis</h3>
  <p>Monthly Spend: ${costDetails.monthlySpend || "N/A"}</p>
  <h3>Detected Risks</h3>
  <ul>${(architectureAnalysis?.risks || ["High dependency on closed-source pricing"]).map(r => `<li>${r}</li>`).join("")}</ul>
  <h3>Optimization Opportunities</h3>
  <ul>${findings.map(f => `<li>${f}</li>`).join("")}</ul>
  <h3>Quick Wins</h3>
  <ul><li>Enable native provider Prompt Caching.</li><li>Adopt Model Tiering.</li></ul>
  <h3>Long-Term Recommendations</h3>
  <ul><li>Configure a central API wrapper proxy.</li></ul>
  <h3>Key Findings</h3>
  <ul>${findings.map(f => `<li>${f}</li>`).join("")}</ul>
  <h3>Expert Recommendations</h3>
  <ul>${recommendations.map(r => `<li>${r}</li>`).join("")}</ul>
</div>`;

  return {
    auditReport: htmlReport,
    findings,
    recommendations,
  };
}

export async function generateAuditReport(input: AuditInput): Promise<AuditOutput> {
  const { answers, scores, websiteUrl, aiStack, technicalNotes, files, architectureAnalysis, costAnalysis, usageMetrics, confidenceScore } = input;

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;

  if (!geminiKey && !openaiKey && !mistralKey) {
    Logger.info("[audit.service] No AI API keys found. Running fallback generator.");
    return generateFallbackReport(input);
  }

  const storageService = getStorageService();
  const filesWithContent: Array<{ name: string; content: string }> = [];
  for (const file of files) {
    try {
      const fileBuffer = await storageService.downloadFile(file.path);
      filesWithContent.push({ name: file.name, content: fileBuffer.toString('utf8') });
    } catch (error: unknown) {
      Logger.error(`[audit.service] Failed to download file ${file.path}:`, error);
      filesWithContent.push({ name: file.name, content: `Error downloading file: ${(error as Error).message}` });
    }
  }

  const prompt = `You are an AI infrastructure cost auditor. Analyze the company's actual technical environment.

- Company name: ${answers.company}
- Website URL: ${websiteUrl || "Not provided"}
- AI Stack: ${aiStack.providers?.join(", ")}

Please perform a detailed cost audit. You must:
1. Act as a senior AI cost and infrastructure auditor.
2. Address the company's specific architecture details, files, and cost evidence.
3. Be realistic: distinguish verified findings, potential risks, and assumptions.
4. Your response MUST include the exact phrase: "I analyzed the provided technical information..." to introduce your findings.
5. Provide a premium HTML report with the following exact semantic HTML structure (do NOT output markdown):
   <div class="report-container">
     <h1>AI Cost Audit & Architecture Report</h1>
     <h3>Executive Summary</h3>
     <p>...</p>
     <h3>Current Architecture Analysis</h3>
     <p>...</p>
     <h3>Cost Analysis</h3>
     <p>...</p>
     <h3>Detected Risks</h3>
     <ul>...</ul>
     <h3>Optimization Opportunities</h3>
     <ul>...</ul>
     <h3>Quick Wins</h3>
     <ul>...</ul>
     <h3>Long-Term Recommendations</h3>
     <ul>...</ul>
     <h3>Key Findings</h3>
     <ul>...</ul>
     <h3>Expert Recommendations</h3>
     <ul>...</ul>
   </div>
`;

  try {
    let reportText = "";

    if (geminiKey) {
      Logger.info("[audit.service] Generating report using Gemini...");
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

      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Invalid response format from Gemini API");
      }
      reportText = text;
    } else if (openaiKey) {
      Logger.info("[audit.service] Generating report using OpenAI...");
      const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions";
      const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: "You are an AI infrastructure cost auditor." },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error("Invalid response format from OpenAI API");
      }
      reportText = text;
    } else if (mistralKey) {
      Logger.info("[audit.service] Generating report using Mistral...");
      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mistralKey}`,
        },
        body: JSON.stringify({
          model: "mistral-large-latest",
          messages: [
            { role: "system", content: "You are an AI infrastructure cost auditor." },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        throw new Error(`Mistral API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error("Invalid response format from Mistral API");
      }
      reportText = text;
    }

    // Parse out findings and recommendations from the generated text
    const findings = extractBulletPoints(reportText, "Key Findings");
    const recommendations = extractBulletPoints(reportText, "Expert Recommendations");

    return {
      auditReport: reportText,
      findings: findings.length > 0 ? findings : ["Identified opportunities to transition categorization prompts to lighter model tiers."],
      recommendations: recommendations.length > 0 ? recommendations : ["Implement prompt caching to reduce repetitious input token costs."],
    };

  } catch (err: unknown) {
    Logger.error("[audit.service] AI API failed. Running fallback report generator. Error:", err);
    return generateFallbackReport(input);
  }
}
