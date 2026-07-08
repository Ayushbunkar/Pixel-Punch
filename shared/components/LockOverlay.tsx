import { Lock, Unlock } from "lucide-react";

interface LockOverlayProps {
  onUnlock: () => void;
  title?: string;
  description?: string;
  buttonText?: string;
}

export function LockOverlay({
  onUnlock,
  title = "Unlock Full Technical Audit Report",
  description = "Enter your email below to receive the full AI Cost Audit report, key findings, and expert recommendations directly in your inbox.",
  buttonText = "Unlock Report",
}: LockOverlayProps) {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center rounded-lg border border-slate-200/50 shadow-inner bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-md max-w-sm flex flex-col items-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
            {description}
          </p>
        </div>
        <button
          onClick={onUnlock}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
        >
          <Unlock className="w-3.5 h-3.5" />
          {buttonText}
        </button>
      </div>
    </div>
  );
}
