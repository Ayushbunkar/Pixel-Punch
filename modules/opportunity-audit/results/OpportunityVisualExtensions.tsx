import React from 'react';

export const ValueProjection = () => {
  return (
    <div className="mt-12 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Value Projection and Next Steps</h2>
        <p className="text-sm text-slate-600">The audit summary suggests significant revenue and efficiency gains are available by implementing AI-driven workflow automation and data monetization strategies.</p>
      </div>
      <div className="p-0">
        <table className="w-full text-left border-collapse">
          <tbody>
            <tr className="bg-[#f8fafc] border-b border-slate-200">
              <td className="p-4 text-sm font-bold text-slate-700">Current AI Value Generation</td>
              <td className="p-4 text-sm font-extrabold text-slate-900">$0 / mo</td>
            </tr>
            <tr className="bg-white border-b border-slate-200">
              <td className="p-4 text-sm font-bold text-slate-700">Month 1 (Internal Workflow Pilot)</td>
              <td className="p-4 text-sm font-extrabold text-slate-900">+$5,500 / mo</td>
            </tr>
            <tr className="bg-[#f8fafc] border-b border-slate-200">
              <td className="p-4 text-sm font-bold text-slate-700">Month 2 (Customer-Facing Chatbot)</td>
              <td className="p-4 text-sm font-extrabold text-slate-900">+$12,000 / mo</td>
            </tr>
            <tr className="bg-white border-b border-slate-200">
              <td className="p-4 text-sm font-bold text-slate-700">Month 3 (Data Monetization Engine)</td>
              <td className="p-4 text-sm font-extrabold text-slate-900">+$25,000 / mo</td>
            </tr>
            <tr className="bg-[#f0fdf4]">
              <td className="p-4 text-sm font-bold text-slate-700">Estimated Annual Value Creation</td>
              <td className="p-4 text-sm font-extrabold text-green-700">$215,000+</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const InnovationRoadmap = () => {
  return (
    <div className="mt-12 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-2xl font-extrabold text-slate-900 mb-6">90-Day Innovation Roadmap</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-5">
          <h3 className="font-bold text-slate-900 mb-4 text-lg">Immediate</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Identify high-friction workflows</li>
            <li>• Select initial AI pilot use-case</li>
            <li>• Build lightweight Proof of Concept</li>
          </ul>
        </div>
        
        <div className="border border-purple-200 bg-purple-50/50 rounded-lg p-5">
          <h3 className="font-bold text-slate-900 mb-4 text-lg">30 Days</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Deploy internal AI agent pilot</li>
            <li>• Gather feedback & iterate</li>
            <li>• Design customer-facing integration</li>
          </ul>
        </div>
        
        <div className="border border-green-200 bg-green-50 rounded-lg p-5">
          <h3 className="font-bold text-slate-900 mb-4 text-lg">90 Days</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Launch customer AI features</li>
            <li>• Implement RAG data pipeline</li>
            <li>• Scale infrastructure & track ROI</li>
          </ul>
        </div>
      </div>
      
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Why this matters</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          This roadmap prioritizes low-risk, internal efficiency gains first to build confidence, followed by high-impact, revenue-generating customer features. This ensures steady value creation while managing technical risk.
        </p>
      </div>
    </div>
  );
};

export const GrowthOpportunities = () => {
  // Dynamic architecture data - values can change based on audit input
  const architectureData = {
    col1: [
      { title: "Users / Customers", desc: "Interacting with new AI features", borderClass: "border-blue-300", bgClass: "bg-blue-50" },
      { title: "Internal Team", desc: "Utilizing workflow automation", borderClass: "border-blue-300", bgClass: "bg-blue-50/50" },
    ],
    col2: [
      { title: "New App Layer", desc: "API routes, business logic, auth", borderClass: "border-2 border-purple-400", bgClass: "bg-purple-50" },
      { title: "AI Agent Framework", desc: "LangChain / LlamaIndex orchestration", borderClass: "border-purple-400", bgClass: "bg-purple-50/50" },
    ],
    col3: [
      { title: "Vector DB", desc: "Pinecone / Weaviate for embeddings", borderClass: "border-emerald-400", bgClass: "bg-emerald-50" },
      { title: "LLM API Gateway", desc: "OpenAI / Anthropic / Gemini", borderClass: "border-amber-300", bgClass: "bg-amber-50" },
    ],
  };

  return (
    <div className="mt-12 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Growth Opportunities</h2>
      <p className="text-sm text-slate-600 mb-6">These are the highest-leverage areas to inject AI into your business model based on the audit pattern. The goal is to create new value and competitive advantages.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="border-2 border-blue-500 bg-blue-50/30 rounded-lg p-5">
          <h3 className="font-bold text-slate-900 mb-3 text-sm">Workflow Automation</h3>
          <p className="text-xs text-slate-600">Deploy AI agents to automate repetitive data entry and customer support triage, freeing up human capital for strategic work.</p>
        </div>
        
        <div className="border-2 border-purple-500 bg-purple-50/30 rounded-lg p-5">
          <h3 className="font-bold text-slate-900 mb-3 text-sm">Predictive Analytics</h3>
          <p className="text-xs text-slate-600">Utilize machine learning models on your existing customer data to predict churn and identify upsell opportunities automatically.</p>
        </div>
        
        <div className="border-2 border-green-500 bg-green-50/30 rounded-lg p-5">
          <h3 className="font-bold text-slate-900 mb-3 text-sm">AI Product Features</h3>
          <p className="text-xs text-slate-600">Embed generative AI directly into your core product offering to create a premium, differentiated experience for your users.</p>
        </div>
      </div>
      
      <div className="mb-10">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Quick Wins</h3>
        <ul className="space-y-3 text-sm text-slate-700">
          <li>• Deploy an internal knowledge base chatbot using a lightweight RAG system.</li>
          <li>• Automate the categorization of incoming customer support tickets using an LLM API.</li>
          <li>• Integrate an AI writing assistant into your team's content creation workflow.</li>
          <li>• Set up automated weekly insights reports generated by AI from your analytics dashboards.</li>
        </ul>
      </div>
      
      <div className="pt-8 border-t border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Proposed Architecture Analysis</h3>
        <p className="text-xs text-slate-500 mb-8 leading-relaxed">
          Based on the opportunity audit, we recommend introducing a modern AI stack. This includes an AI Agent layer for orchestration, a Vector Database for semantic search over your proprietary data, and a flexible LLM Gateway to avoid vendor lock-in while scaling.
        </p>
        
        <div className="flex flex-col items-center mb-10">
          <div className="flex flex-col md:flex-row items-center gap-6 relative">
            {/* Column 1 */}
            <div className="flex flex-col gap-6 relative z-10">
              {architectureData.col1.map((item, idx) => (
                <React.Fragment key={idx}>
                  <div className={`border ${item.borderClass} ${item.bgClass} rounded-xl p-4 w-40 text-center relative z-10`}>
                    <div className="font-bold text-slate-900 text-sm mb-1">{item.title}</div>
                    <div className="text-[10px] text-slate-500">{item.desc}</div>
                  </div>
                  {idx < architectureData.col1.length - 1 && (
                    <div className="flex justify-center">
                      <div className="h-6 w-[1px] bg-slate-300"></div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            
            {/* Connector */}
            <div className="hidden md:block h-[1px] w-8 bg-slate-300 relative z-0"></div>
            
            {/* Column 2 */}
            <div className="flex flex-col gap-6 relative z-10">
              {architectureData.col2.map((item, idx) => (
                <React.Fragment key={idx}>
                  <div className={`border ${item.borderClass} ${item.bgClass} rounded-xl p-4 w-48 text-center`}>
                    <div className="font-bold text-slate-900 text-sm mb-1">{item.title}</div>
                    <div className="text-[10px] text-slate-500">{item.desc}</div>
                  </div>
                  {idx < architectureData.col2.length - 1 && (
                    <div className="flex justify-center">
                      <div className="h-6 w-[1px] bg-slate-300"></div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            
            {/* Connector */}
            <div className="hidden md:block h-[1px] w-8 bg-slate-300 relative z-0"></div>
            
            {/* Column 3 */}
            <div className="flex flex-col gap-6 relative z-10">
              {architectureData.col3.map((item, idx) => (
                <React.Fragment key={idx}>
                  <div className={`border ${item.borderClass} ${item.bgClass} rounded-xl p-4 w-48 text-center`}>
                    <div className="font-bold text-slate-900 text-sm mb-1">{item.title}</div>
                    <div className="text-[10px] text-slate-500">{item.desc}</div>
                  </div>
                  {idx < architectureData.col3.length - 1 && (
                    <div className="flex justify-center">
                      <div className="h-6 w-[1px] bg-slate-300"></div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-slate-200 rounded-lg overflow-hidden text-sm">
          <div className="p-4 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 font-bold text-slate-800">
            Observed Gaps
          </div>
          <div className="p-4 bg-slate-50 font-bold text-slate-800">
            What to build first
          </div>
          <div className="p-4 border-b md:border-b-0 md:border-r border-slate-200 text-slate-600 bg-white">
            <ol className="list-decimal pl-4 space-y-1">
              <li>No mechanism to retrieve unstructured data.</li>
              <li>Core application lacks AI orchestration logic.</li>
              <li>Manual workflows bottleneck growth.</li>
            </ol>
          </div>
          <div className="p-4 text-slate-600 bg-white">
            <ol className="list-decimal pl-4 space-y-1">
              <li>Spin up a Vector Database and start embedding docs.</li>
              <li>Integrate an Agent Framework into the app layer.</li>
              <li>Build a pilot automation for the highest-friction workflow.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
