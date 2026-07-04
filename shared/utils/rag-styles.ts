type Rag = "red" | "amber" | "green";

interface RagMeta {
  label: string;
  badgeClass: string;
  bgClass: string;
  iconClass: string;
  textColor: string;
  buttonClass: string;
  dotColor: string;
  pulseColor: string;
}

export const RAG_META: Record<Rag, RagMeta> = {
  red: {
    label: "HIGH RISK",
    badgeClass: "rag-red",
    bgClass: "bg-[#FEF2F2] border-[#FEE2E2]",
    iconClass: "text-red-500",
    textColor: "text-red-700",
    buttonClass: "bg-red-500 hover:bg-red-600",
    dotColor: "#f43f5e", // bg-rose-500
    pulseColor: "#ef4444", // bg-red-400
  },
  amber: {
    label: "NEEDS ATTENTION",
    badgeClass: "rag-amber",
    bgClass: "bg-[#FFFBEB] border-[#FFECB2]",
    iconClass: "text-amber-500",
    textColor: "text-amber-700",
    buttonClass: "bg-amber-500 hover:bg-amber-600",
    dotColor: "#f59e0b", // bg-amber-500
    pulseColor: "#fbbf24", // bg-amber-400
  },
  green: {
    label: "LOW RISK",
    badgeClass: "rag-green",
    bgClass: "bg-[#F0FDF4] border-[#DCFCE7]",
    iconClass: "text-green-500",
    textColor: "text-green-700",
    buttonClass: "bg-green-500 hover:bg-green-600",
    dotColor: "#10b981", // bg-emerald-500
    pulseColor: "#34d399", // bg-emerald-400
  },
};
