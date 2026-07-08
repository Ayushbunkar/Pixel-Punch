import React from 'react';

export const SavingsProjection = () => {
  return (
    <div className="mt-12 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Savings Projection and Next Steps</h2>
        <p className="text-sm text-slate-600">The audit summary suggests meaningful savings are available once repeated token waste, unnecessary context injection, and un-routed model calls are reduced.</p>
      </div>
      <div className="p-0">
        <table className="w-full text-left border-collapse">
          <tbody>
            <tr className="bg-[#f8fafc] border-b border-slate-200">
              <td className="p-4 text-sm font-bold text-slate-700">Current monthly AI spend</td>
              <td className="p-4 text-sm font-extrabold text-slate-900">$12,500</td>
            </tr>
            <tr className="bg-white border-b border-slate-200">
              <td className="p-4 text-sm font-bold text-slate-700">Month 1 after quick wins</td>
              <td className="p-4 text-sm font-extrabold text-slate-900">$10,400</td>
            </tr>
            <tr className="bg-[#f8fafc] border-b border-slate-200">
              <td className="p-4 text-sm font-bold text-slate-700">Month 2 after routing + caching</td>
              <td className="p-4 text-sm font-extrabold text-slate-900">$8,900</td>
            </tr>
            <tr className="bg-white border-b border-slate-200">
              <td className="p-4 text-sm font-bold text-slate-700">Month 3 after full optimisation</td>
              <td className="p-4 text-sm font-extrabold text-slate-900">$7,600</td>
            </tr>
            <tr className="bg-[#f0fdf4]">
              <td className="p-4 text-sm font-bold text-slate-700">Estimated annual savings</td>
              <td className="p-4 text-sm font-extrabold text-slate-900">$54,000</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const NinetyDayRoadmap = () => {
  return (
    <div className="mt-12 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-2xl font-extrabold text-slate-900 mb-6">90-Day Roadmap</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-5">
          <h3 className="font-bold text-slate-900 mb-4 text-lg">Immediate</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Prompt caching</li>
            <li>• Model routing</li>
            <li>• RAG pruning</li>
          </ul>
        </div>
        
        <div className="border border-indigo-200 bg-indigo-50/50 rounded-lg p-5">
          <h3 className="font-bold text-slate-900 mb-4 text-lg">30 Days</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• LiteLLM gateway</li>
            <li>• Langfuse observability</li>
            <li>• Semantic cache</li>
          </ul>
        </div>
        
        <div className="border border-green-200 bg-green-50 rounded-lg p-5">
          <h3 className="font-bold text-slate-900 mb-4 text-lg">90 Days</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Centralized governance</li>
            <li>• Automated routing</li>
            <li>• ROI dashboard</li>
          </ul>
        </div>
      </div>
      
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Why this matters</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          This roadmap is sequenced to create fast savings first, then better routing, then governance and reporting. That order usually improves ROI while keeping implementation risk low.
        </p>
      </div>
    </div>
  );
};

export const OptimizationOpportunities = () => {
  return (
    <div className="mt-12 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Optimization Opportunities</h2>
      <p className="text-sm text-slate-600 mb-6">These are the highest-leverage moves based on the audit pattern. The goal is to reduce token waste without changing the product experience.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="border-2 border-blue-500 bg-blue-50/30 rounded-lg p-5">
          <h3 className="font-bold text-slate-900 mb-3 text-sm">Prompt Caching</h3>
          <p className="text-xs text-slate-600">Activate cache headers on all system instructions over 1k tokens. This can cut repeated input cost significantly.</p>
        </div>
        
        <div className="border-2 border-purple-500 bg-purple-50/30 rounded-lg p-5">
          <h3 className="font-bold text-slate-900 mb-3 text-sm">Model Tiering</h3>
          <p className="text-xs text-slate-600">Route simple formatting, classification, and low-complexity actions to lighter models automatically.</p>
        </div>
        
        <div className="border-2 border-green-500 bg-green-50/30 rounded-lg p-5">
          <h3 className="font-bold text-slate-900 mb-3 text-sm">RAG Pruning</h3>
          <p className="text-xs text-slate-600">Shrink chunk sizes, remove duplicate context, and add hybrid reranking before prompt assembly.</p>
        </div>
      </div>
      
      <div className="mb-10">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Quick Wins</h3>
        <ul className="space-y-3 text-sm text-slate-700">
          <li>• Enable native provider Prompt Caching for system prompts exceeding 1,024 tokens.</li>
          <li>• Adopt Model Tiering: Route simple formatting queries to lighter model weights (e.g. GPT-4o-mini / Claude 3.5 Haiku).</li>
          <li>• Shrink RAG chunk sizes and add hybrid re-ranking to cut irrelevant context.</li>
          <li>• Introduce semantic filters before prompt assembly to avoid context bloat.</li>
        </ul>
      </div>
      
      <div className="pt-8 border-t border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Current Architecture Analysis</h3>
        <p className="text-xs text-slate-500 mb-8 leading-relaxed">
          Known information from the audit indicates Azure OpenAI as the primary provider, Azure as the cloud layer, and a vector database in the stack. The audit also suggests the current workflow likely sends large system prompts and RAG context without gateway-level optimisation.
        </p>
        
        <div className="flex flex-col items-center mb-10">
          <div className="flex flex-col md:flex-row items-center gap-6 relative">
            <div className="border border-blue-300 bg-blue-50 rounded-xl p-4 w-40 text-center relative z-10">
              <div className="font-bold text-slate-900 text-sm mb-1">Users</div>
              <div className="text-[10px] text-slate-500">Requests, prompts, and workflows</div>
            </div>
            
            <div className="hidden md:block h-[1px] w-8 bg-slate-300 relative z-0"></div>
            
            <div className="flex flex-col gap-6 relative z-10">
              <div className="border-2 border-emerald-400 bg-emerald-50 rounded-xl p-4 w-48 text-center">
                <div className="font-bold text-slate-900 text-sm mb-1">App Layer</div>
                <div className="text-[10px] text-slate-500">Chat, API routes, orchestration</div>
              </div>
              
              <div className="flex justify-center">
                <div className="h-6 w-[1px] bg-slate-300"></div>
              </div>
              
              <div className="border border-emerald-400 bg-emerald-50/50 rounded-xl p-4 w-48 text-center">
                <div className="font-bold text-slate-900 text-sm mb-1">Vector DB</div>
                <div className="text-[10px] text-slate-500">Chunking, retrieval, metadata filters</div>
              </div>
            </div>
            
            <div className="hidden md:block h-[1px] w-8 bg-slate-300 relative z-0 mt-[-90px]"></div>
            
            <div className="flex flex-col gap-6 relative z-10">
              <div className="border border-indigo-400 bg-indigo-50 rounded-xl p-4 w-48 text-center">
                <div className="font-bold text-slate-900 text-sm mb-1">Model Gateway</div>
                <div className="text-[10px] text-slate-500">LiteLLM / Portkey / router layer</div>
              </div>
              
              <div className="flex justify-center">
                <div className="h-6 w-[1px] bg-slate-300"></div>
              </div>
              
              <div className="border border-red-300 bg-red-50 rounded-xl p-4 w-48 text-center">
                <div className="font-bold text-slate-900 text-sm mb-1">Azure OpenAI</div>
                <div className="text-[10px] text-slate-500">Premium calls and token spend</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-slate-200 rounded-lg overflow-hidden text-sm">
          <div className="p-4 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 font-bold text-slate-800">
            Observed Risks
          </div>
          <div className="p-4 bg-slate-50 font-bold text-slate-800">
            What to fix first
          </div>
          <div className="p-4 border-b md:border-b-0 md:border-r border-slate-200 text-slate-600 bg-white">
            <ol className="list-decimal pl-4 space-y-1">
              <li>Direct provider calls likely increase vendor lock-in.</li>
              <li>Repeated system instructions likely ship in full each request.</li>
              <li>Static chunking can bloat prompt windows.</li>
            </ol>
          </div>
          <div className="p-4 text-slate-600 bg-white">
            <ol className="list-decimal pl-4 space-y-1">
              <li>Add a gateway for routing and logging.</li>
              <li>Enable native prompt caching.</li>
              <li>Reduce retrieval context with filters and reranking.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
