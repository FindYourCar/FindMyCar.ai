interface HealthScoreCardProps {
  score: number;
  label: string;
}

export default function HealthScoreCard({ score, label }: HealthScoreCardProps) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-[#121212] border border-[#d4af37]/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-44 h-44 shrink-0">
        <svg viewBox="0 0 160 160" className="w-44 h-44 -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#262626"
            strokeWidth="12"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#d4af37"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-[#d4af37]">{score}</span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">Financial Health Score</p>
        <p className="text-2xl font-bold mt-1 text-[#d4af37]">{label}</p>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">
          Based on your savings rate, whether you&apos;re spending within your income, and your
          progress toward your monthly savings goal.
        </p>
      </div>
    </div>
  );
}
