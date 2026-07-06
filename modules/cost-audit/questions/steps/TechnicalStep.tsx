"use client";

import { useState, useRef } from "react";
import { FormState, ValidationErrors } from "@/modules/cost-audit/types";
import { 
  UploadCloud, FileText, Trash2, Globe, Sparkles, Cpu, Layers, 
  Activity, FileSpreadsheet, DollarSign, ImageIcon, X, AlertCircle, Info
} from "lucide-react";
import toast from "react-hot-toast";
import { uploadFile } from "@/shared/utils/frontend-storage.service";

interface TechnicalStepProps {
  state: FormState;
  errors: ValidationErrors;
  onChange: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  onAddDocument: (doc: { name: string; type: string; size: number; path: string; base64: string }) => void;
  onRemoveDocument: (index: number) => void;
  onAddArchitectureFile: (doc: { name: string; type: string; size: number; path: string; base64: string }) => void;
  onRemoveArchitectureFile: (index: number) => void;
  onAddCostFile: (doc: { name: string; type: string; size: number; path: string; base64: string }) => void;
  onRemoveCostFile: (index: number) => void;
}

export function TechnicalStep({
  state,
  errors,
  onChange,
  onAddDocument,
  onRemoveDocument,
  onAddArchitectureFile,
  onRemoveArchitectureFile,
  onAddCostFile,
  onRemoveCostFile,
}: TechnicalStepProps) {
  const [activeTab, setActiveTab] = useState<"stack" | "architecture" | "billing">("stack");
  const docInputRef = useRef<HTMLInputElement>(null);
  const archInputRef = useRef<HTMLInputElement>(null);
  const costInputRef = useRef<HTMLInputElement>(null);

  const [dragOverDoc, setDragOverDoc] = useState(false);
  const [dragOverArch, setDragOverArch] = useState(false);
  const [dragOverCost, setDragOverCost] = useState(false);

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  // ── Multi-select toggles ──────────────────────────────────────────────────
  const toggleProvider = (provider: string) => {
    const list = state.ai_providers || [];
    const updated = list.includes(provider)
      ? list.filter((p) => p !== provider)
      : [...list, provider];
    onChange("ai_providers", updated);
  };

  const toggleInfra = (infra: string) => {
    const list = state.ai_infrastructure || [];
    const updated = list.includes(infra)
      ? list.filter((i) => i !== infra)
      : [...list, infra];
    onChange("ai_infrastructure", updated);
  };

  const toggleOther = (cap: string) => {
    const list = state.ai_other || [];
    const updated = list.includes(cap)
      ? list.filter((c) => c !== cap)
      : [...list, cap];
    onChange("ai_other", updated);
  };

  // ── File upload processing helpers ────────────────────────────────────────
  const handleDocFiles = async (files: FileList) => {
    const totalFiles = (state.documents?.length || 0) + (state.architecture_files?.length || 0) + (state.cost_files?.length || 0);
    if (totalFiles + files.length > 5) {
      toast.error("Maximum limit of 5 files/photos reached.", { id: "limit-error" });
      return;
    }
    const allowed = ["md", "pdf", "txt", "doc", "docx"];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!allowed.includes(ext)) {
        toast.error(`Unsupported format: .${ext}. Only MD, PDF, TXT, DOC, DOCX allowed.`, { id: "doc-format" });
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 10MB limit.`, { id: "doc-size" });
        continue;
      }
      try {
        const base64 = await fileToBase64(file);
        const uploadedPath = await uploadFile(file, "/api/cost-scan/upload", "document");
        onAddDocument({
          name: file.name,
          type: file.type || `application/${ext}`,
          size: file.size,
          path: uploadedPath,
          base64: base64,
        });
        toast.success(`Uploaded "${file.name}" successfully!`, { id: `doc-success-${file.name}` });
      } catch {
        toast.error(`Failed to upload file: ${file.name}`);
      }
    }
  };

  const handleArchFiles = async (files: FileList) => {
    const totalFiles = (state.documents?.length || 0) + (state.architecture_files?.length || 0) + (state.cost_files?.length || 0);
    if (totalFiles + files.length > 5) {
      toast.error("Maximum limit of 5 files/photos reached.", { id: "limit-error" });
      return;
    }
    const allowed = ["png", "jpg", "jpeg", "pdf", "drawio", "xml", "doc", "docx"];
    const updated = [...(state.architecture_files || [])];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!allowed.includes(ext)) {
        toast.error(`Unsupported format: .${ext}. Allowed: PNG, JPG, JPEG, PDF, DRAWIO, XML, DOC, DOCX.`, { id: "arch-format" });
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 10MB limit.`, { id: "arch-size" });
        continue;
      }
      try {
        const base64 = await fileToBase64(file);
        const uploadedPath = await uploadFile(file, "/api/cost-scan/upload", "architecture");
        onAddArchitectureFile({
          name: file.name,
          type: file.type || `application/${ext}`,
          size: file.size,
          path: uploadedPath,
          base64: base64,
        });
        toast.success(`Loaded architecture diagram: "${file.name}" successfully!`, { id: `arch-success-${file.name}` });
      } catch {
        toast.error(`Failed to upload architecture file.`);
      }
    }
  };

  const handleCostFiles = async (files: FileList) => {
    const totalFiles = (state.documents?.length || 0) + (state.architecture_files?.length || 0) + (state.cost_files?.length || 0);
    if (totalFiles + files.length > 5) {
      toast.error("Maximum limit of 5 files/photos reached.", { id: "limit-error" });
      return;
    }
    const allowed = ["csv", "xlsx", "xls", "pdf", "png", "jpg", "jpeg"];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!allowed.includes(ext)) {
        toast.error(`Unsupported format: .${ext}. Allowed: CSV, XLSX, XLS, PDF, PNG, JPG, JPEG.`, { id: "cost-format" });
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 10MB limit.`, { id: "cost-size" });
        continue;
      }
      try {
        const base64 = await fileToBase64(file);
        const uploadedPath = await uploadFile(file, "/api/cost-scan/upload", "cost");
        onAddCostFile({
          name: file.name,
          type: file.type || `application/${ext}`,
          size: file.size,
          path: uploadedPath,
          base64: base64,
        });
        toast.success(`Loaded billing evidence: "${file.name}" successfully!`, { id: `cost-success-${file.name}` });
      } catch {
        toast.error(`Failed to upload cost evidence file.`);
      }
    }
  };

  const handleMetricsChange = (field: keyof FormState["usage_metrics"], value: string) => {
    onChange("usage_metrics", {
      ...state.usage_metrics,
      [field]: value,
    });
  };

  const PROVIDERS = ["OpenAI", "Anthropic", "Azure OpenAI", "Google AI", "Other"];
  const INFRASTRUCTURE = ["AWS", "Azure", "GCP", "On-premise"];
  const OTHER_CAPABILITIES = ["Vector database", "RAG system", "AI agents", "GPU usage"];

  return (
    <div className="step-enter max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
          Technical Infrastructure Audit
          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-full">
            Optional
          </span>
        </h2>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Share your AI setup, architecture diagrams, cost bills, and usage stats to generate a highly detailed infrastructure audit report.
        </p>
      </div>

      {/* ── Tabs Selector ────────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("stack")}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${
            activeTab === "stack"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Cpu className="w-4 h-4" /> Stack & Notes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("architecture")}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${
            activeTab === "architecture"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" /> Architecture & Docs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("billing")}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${
            activeTab === "billing"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <DollarSign className="w-4 h-4" /> Billing & Metrics
        </button>
      </div>

      <div className="space-y-6">
        {/* ── TAB 1: STACK DETAILS ────────────────────────────────────────────── */}
        {activeTab === "stack" && (
          <div className="space-y-5 step-enter">
            {/* Website URL */}
            <div>
              <label htmlFor="website_url" className="block text-sm font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" /> Website URL
              </label>
              <input
                id="website_url"
                type="url"
                value={state.website_url}
                onChange={(e) => onChange("website_url", e.target.value)}
                placeholder="https://company.com"
                className={`pp-input ${errors.website_url ? "border-red-500/60 focus:border-red-500" : ""}`}
              />
              {errors.website_url && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1" role="alert">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.website_url}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Providers */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-blue-600" /> AI Providers
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PROVIDERS.map((provider) => {
                    const selected = state.ai_providers?.includes(provider);
                    return (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => toggleProvider(provider)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          selected
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {provider}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Infrastructure */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" /> Cloud/Infra Hosting
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {INFRASTRUCTURE.map((infra) => {
                    const selected = state.ai_infrastructure?.includes(infra);
                    return (
                      <button
                        key={infra}
                        type="button"
                        onClick={() => toggleInfra(infra)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          selected
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {infra}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Models */}
              <div>
                <label htmlFor="ai_models" className="block text-sm font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" /> AI Models Used
                </label>
                <input
                  id="ai_models"
                  type="text"
                  value={state.ai_models}
                  onChange={(e) => onChange("ai_models", e.target.value)}
                  placeholder="e.g. GPT-4o, Claude 3.5 Sonnet, Custom"
                  className="pp-input"
                />
              </div>

              {/* Capabilities */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-blue-600" /> Tech Capabilities
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {OTHER_CAPABILITIES.map((cap) => {
                    const selected = state.ai_other?.includes(cap);
                    return (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => toggleOther(cap)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          selected
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {cap}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="technical_notes" className="block text-sm font-semibold text-slate-900 mb-1.5">
                Technical Architecture Notes / Context
              </label>
              <textarea
                id="technical_notes"
                rows={3}
                value={state.technical_notes}
                onChange={(e) => onChange("technical_notes", e.target.value)}
                placeholder="Add details about your architecture, scaling thresholds, data flows, or current token leakage areas..."
                className="w-full px-4 py-3 rounded-xl text-slate-900 text-sm outline-none border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white placeholder:text-slate-400 transition-all resize-none"
              />
            </div>
          </div>
        )}

        {/* ── TAB 2: ARCHITECTURE & DOCUMENTS ────────────────────────────────── */}
        {activeTab === "architecture" && (
          <div className="space-y-6 step-enter">
            {/* Architecture diagram drag/drop */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" /> AI Architecture Diagram
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOverArch(true); }}
                onDragLeave={() => setDragOverArch(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverArch(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleArchFiles(e.dataTransfer.files);
                  }
                }}
                onClick={() => archInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  dragOverArch
                    ? "border-blue-600 bg-blue-50/50"
                    : "border-slate-300 hover:border-blue-600 hover:bg-slate-50/50"
                }`}
              >
                <input
                  type="file"
                  ref={archInputRef}
                  onChange={(e) => e.target.files && handleArchFiles(e.target.files)}
                  multiple
                  accept=".png,.jpg,.jpeg,.pdf,.drawio,.xml,.doc,.docx"
                  className="hidden"
                />
                <UploadCloud className="w-7 h-7 text-blue-600 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-900">
                  Drag & drop your architecture diagram here, or <span className="text-blue-600">browse</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Supports PNG, JPG, Draw.io, XML, PDF, Word (max 10MB)
                </p>
              </div>

              {/* Architecture files list */}
              {state.architecture_files && state.architecture_files.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {state.architecture_files.map((file, idx) => {
                    return (
                      <div key={idx} className="flex items-center justify-between p-2.5 border border-slate-100 rounded-lg bg-slate-50/50 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-700 truncate">{file.name}</p>
                            <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                        onClick={() => onRemoveArchitectureFile(idx)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Standard documents drag/drop */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" /> Technical Documentation
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOverDoc(true); }}
                onDragLeave={() => setDragOverDoc(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverDoc(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleDocFiles(e.dataTransfer.files);
                  }
                }}
                onClick={() => docInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  dragOverDoc
                    ? "border-blue-600 bg-blue-50/50"
                    : "border-slate-300 hover:border-blue-600 hover:bg-slate-50/50"
                }`}
              >
                <input
                  type="file"
                  ref={docInputRef}
                  onChange={(e) => e.target.files && handleDocFiles(e.target.files)}
                  multiple
                  accept=".md,.pdf,.txt,.doc,.docx"
                  className="hidden"
                />
                <UploadCloud className="w-7 h-7 text-blue-600 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-900">
                  Drag & drop text docs or PDF specs here, or <span className="text-blue-600">browse</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Supports MD, PDF, TXT, DOCX text resources (max 10MB)
                </p>
              </div>

              {/* Docs list */}
              {state.documents && state.documents.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {state.documents.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 border border-slate-100 rounded-lg bg-slate-50/50 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-700 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveDocument(idx)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: BILLING & USAGE METRICS ──────────────────────────────────── */}
        {activeTab === "billing" && (
          <div className="space-y-6 step-enter">
            {/* Cost Evidence drop box */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Cost Evidence & Billing Reports
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOverCost(true); }}
                onDragLeave={() => setDragOverCost(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverCost(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleCostFiles(e.dataTransfer.files);
                  }
                }}
                onClick={() => costInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  dragOverCost
                    ? "border-blue-600 bg-blue-50/50"
                    : "border-slate-300 hover:border-blue-600 hover:bg-slate-50/50"
                }`}
              >
                <input
                  type="file"
                  ref={costInputRef}
                  onChange={(e) => e.target.files && handleCostFiles(e.target.files)}
                  multiple
                  accept=".csv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg"
                  className="hidden"
                />
                <UploadCloud className="w-7 h-7 text-blue-600 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-900">
                  Drag & drop invoices, CSVs, or cost screenshots here, or <span className="text-blue-600">browse</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Supports CSV, XLSX, XLS, PDF, PNG/JPG invoice screenshots (max 10MB)
                </p>
              </div>

              {/* Cost files list */}
              {state.cost_files && state.cost_files.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {state.cost_files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 border border-slate-100 rounded-lg bg-slate-50/50 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileSpreadsheet className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-700 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveCostFile(idx)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Usage Metrics fields */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5 border-b pb-1.5">
                <Activity className="w-4 h-4 text-blue-600" /> Operational Usage Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Requests */}
                <div>
                  <label htmlFor="metrics_requests" className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly requests volume
                  </label>
                  <input
                    id="metrics_requests"
                    type="number"
                    value={state.usage_metrics.monthly_requests}
                    onChange={(e) => handleMetricsChange("monthly_requests", e.target.value)}
                    placeholder="e.g. 500000"
                    className="pp-input text-xs h-9"
                  />
                </div>

                {/* Users */}
                <div>
                  <label htmlFor="metrics_users" className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly active users
                  </label>
                  <input
                    id="metrics_users"
                    type="number"
                    value={state.usage_metrics.user_volume}
                    onChange={(e) => handleMetricsChange("user_volume", e.target.value)}
                    placeholder="e.g. 10000"
                    className="pp-input text-xs h-9"
                  />
                </div>

                {/* Input tokens */}
                <div>
                  <label htmlFor="metrics_input_tok" className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly input tokens (est)
                  </label>
                  <input
                    id="metrics_input_tok"
                    type="number"
                    value={state.usage_metrics.input_tokens}
                    onChange={(e) => handleMetricsChange("input_tokens", e.target.value)}
                    placeholder="e.g. 12000000"
                    className="pp-input text-xs h-9"
                  />
                </div>

                {/* Output tokens */}
                <div>
                  <label htmlFor="metrics_output_tok" className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly output tokens (est)
                  </label>
                  <input
                    id="metrics_output_tok"
                    type="number"
                    value={state.usage_metrics.output_tokens}
                    onChange={(e) => handleMetricsChange("output_tokens", e.target.value)}
                    placeholder="e.g. 8000000"
                    className="pp-input text-xs h-9"
                  />
                </div>

                {/* GPU hours */}
                <div>
                  <label htmlFor="metrics_gpu_hours" className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly GPU hours
                  </label>
                  <input
                    id="metrics_gpu_hours"
                    type="number"
                    value={state.usage_metrics.gpu_hours}
                    onChange={(e) => handleMetricsChange("gpu_hours", e.target.value)}
                    placeholder="e.g. 120"
                    className="pp-input text-xs h-9"
                  />
                </div>

                {/* Latency requirements */}
                <div>
                  <label htmlFor="metrics_latency" className="block text-xs font-semibold text-slate-700 mb-1">
                    Max SLA Latency requirement
                  </label>
                  <input
                    id="metrics_latency"
                    type="text"
                    value={state.usage_metrics.latency_requirements}
                    onChange={(e) => handleMetricsChange("latency_requirements", e.target.value)}
                    placeholder="e.g. < 500ms"
                    className="pp-input text-xs h-9"
                  />
                </div>
              </div>

              {/* Model distribution */}
              <div className="mt-3">
                <label htmlFor="metrics_models_dist" className="block text-xs font-semibold text-slate-700 mb-1">
                  Model Distribution Share (e.g. GPT-4 70%, GPT-4o-mini 30%)
                </label>
                <input
                  id="metrics_models_dist"
                  type="text"
                  value={state.usage_metrics.model_distribution}
                  onChange={(e) => handleMetricsChange("model_distribution", e.target.value)}
                  placeholder="e.g. GPT-4: 70%, GPT-4o-mini: 30%"
                  className="pp-input text-xs h-9"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
