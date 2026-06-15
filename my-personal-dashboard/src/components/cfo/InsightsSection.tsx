import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from "lucide-react";
import { Insight, InsightTone } from "@/lib/cfo";

interface InsightsSectionProps {
  insights: Insight[];
}

const TONE_STYLES: Record<InsightTone, { bg: string; border: string; text: string; icon: typeof Info }> = {
  danger: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", icon: OctagonAlert },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    icon: AlertTriangle,
  },
  success: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    icon: CheckCircle2,
  },
  info: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", icon: Info },
};

export default function InsightsSection({ insights }: InsightsSectionProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <h2 className="font-semibold mb-4">This Month&apos;s Insights</h2>
      {insights.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">
          Add some transactions and set up your financial profile to see insights here.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight, i) => {
            const style = TONE_STYLES[insight.tone];
            const Icon = style.icon;
            return (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-xl border p-4 ${style.bg} ${style.border}`}
              >
                <Icon size={18} className={`shrink-0 mt-0.5 ${style.text}`} />
                <div>
                  <p className={`text-sm font-semibold ${style.text}`}>{insight.title}</p>
                  <p className="text-sm text-gray-300 mt-1 leading-relaxed">{insight.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
