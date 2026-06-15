import { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: "blue" | "purple" | "green" | "default";
}

const ACCENT_STYLES: Record<string, string> = {
  blue: "bg-blue-500/15 text-blue-400",
  purple: "bg-purple-500/15 text-purple-400",
  green: "bg-emerald-500/15 text-emerald-400",
  default: "bg-white/10 text-white",
};

export default function SummaryCard({
  label,
  value,
  icon: Icon,
  accent = "default",
}: SummaryCardProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ACCENT_STYLES[accent]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-semibold mt-1">{value}</p>
      </div>
    </div>
  );
}
