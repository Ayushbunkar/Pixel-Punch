"use client";

import { useState, useRef } from "react";
import { FormState, ValidationErrors } from "@/features/cost-scan/types";
import { UploadCloud, FileText, Trash2, Globe, Sparkles, Cpu, Layers } from "lucide-react";
import toast from "react-hot-toast";

interface TechnicalStepProps {
  state: FormState;
  errors: ValidationErrors;
  onChange: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  onAddDocument: (doc: { name: string; type: string; size: number; base64: string }) => void;
  onRemoveDocument: (index: number) => void;
}

export function TechnicalStep({
  state,
  errors,
  onChange,
  onAddDocument,
  onRemoveDocument,
}: TechnicalStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // ── File upload handling ──────────────────────────────────────────────────
  const processFiles = (files: FileList) => {
    const allowedExtensions = ["md", "pdf", "txt", "doc", "docx"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";

      if (!allowedExtensions.includes(ext)) {
        toast.error(`Unsupported format: .${ext}. Only MD, PDF, TXT, DOC, DOCX allowed.`, {
          id: "file-type-error",
        });
        continue;
      }

      if (file.size > maxSize) {
        toast.error(`File "${file.name}" is larger than the 10MB limit.`, {
          id: "file-size-error",
        });
        continue;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Content = (reader.result as string).split(",")[1];
        onAddDocument({
          name: file.name,
          type: file.type || `application/${ext}`,
          size: file.size,
          base64: base64Content,
        });
        toast.success(`Loaded "${file.name}" successfully!`, { id: `upload-${file.name}` });
      };
      reader.onerror = () => {
        toast.error(`Failed to read file: ${file.name}`);
      };
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

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

  const PROVIDERS = ["OpenAI", "Anthropic", "Azure OpenAI", "Google AI", "Other"];
  const INFRASTRUCTURE = ["AWS", "Azure", "GCP", "On-premise"];
  const OTHER_CAPABILITIES = ["Vector database", "RAG system", "AI agents", "GPU usage"];

  return (
    <div className="step-enter max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
          Technical Audit details
          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-full">
            Optional
          </span>
        </h2>
        <p className="text-sm text-slate-600">
          Share your technical setup and document resources to get a deeper, highly customized AI architecture audit.
        </p>
      </div>

      <div className="space-y-6">
        {/* ── WEBSITE URL ────────────────────────────────────────────────────── */}
        <div>
          <label htmlFor="website_url" className="block text-sm font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-indigo-600" /> Website URL
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
            <p className="mt-1.5 text-xs text-red-600" role="alert">
              {errors.website_url}
            </p>
          )}
        </div>

        {/* ── AI PROVIDERS & INFRASTRUCTURE (GRID) ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Providers */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2.5 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600" /> AI Providers
            </label>
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map((provider) => {
                const selected = state.ai_providers?.includes(provider);
                return (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => toggleProvider(provider)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      selected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
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
            <label className="block text-sm font-semibold text-slate-900 mb-2.5 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" /> Cloud/Infra Hosting
            </label>
            <div className="flex flex-wrap gap-2">
              {INFRASTRUCTURE.map((infra) => {
                const selected = state.ai_infrastructure?.includes(infra);
                return (
                  <button
                    key={infra}
                    type="button"
                    onClick={() => toggleInfra(infra)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      selected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
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

        {/* ── MODEL DETAILS & OTHER CAPABILITIES ────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Models Text Input */}
          <div>
            <label htmlFor="ai_models" className="block text-sm font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" /> AI Models Used
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

          {/* Other Capabilities */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2.5 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600" /> Tech Capabilities
            </label>
            <div className="flex flex-wrap gap-2">
              {OTHER_CAPABILITIES.map((cap) => {
                const selected = state.ai_other?.includes(cap);
                return (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => toggleOther(cap)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      selected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
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

        {/* ── TECHNICAL NOTES ────────────────────────────────────────────────── */}
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
            className="w-full px-4 py-3 rounded-xl text-slate-900 text-sm outline-none border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-white placeholder:text-slate-400 transition-all resize-none"
          />
        </div>

        {/* ── FILE UPLOAD ────────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Upload Architecture Diagrams / Documentation
          </label>
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-indigo-600 bg-indigo-50/50"
                : "border-slate-300 hover:border-indigo-600 hover:bg-slate-50/50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              multiple
              accept=".md,.pdf,.txt,.doc,.docx"
              className="hidden"
            />
            <UploadCloud className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-900">
              Drag & drop files here, or <span className="text-indigo-600">browse</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports PDF, DOCX, TXT, MD documents (max 10MB)
            </p>
          </div>

          {/* List of uploaded files */}
          {state.documents && state.documents.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Uploaded Resources ({state.documents.length})
              </p>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden bg-white shadow-sm">
                {state.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span className="truncate font-medium text-slate-700">{doc.name}</span>
                      <span className="text-xs text-slate-400">
                        ({Math.round(doc.size / 1024)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveDocument(idx)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
