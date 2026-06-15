interface InvestmentIdea {
  name: string;
  description: string;
  risk: "Low Risk" | "High Risk";
  minimum: string;
}

const IDEAS: InvestmentIdea[] = [
  {
    name: "Index Funds",
    description: "VWCE or S&P 500 ETF via DEGIRO — low risk, long term growth.",
    risk: "Low Risk",
    minimum: "€10/month",
  },
  {
    name: "High Interest Savings",
    description: "Bunq or Openbank savings account — currently 2.5-3% interest in the Netherlands.",
    risk: "Low Risk",
    minimum: "€1",
  },
  {
    name: "Crypto",
    description:
      "Bitcoin or Ethereum — high volatility, only invest what you can lose. Max 5-10% of savings.",
    risk: "High Risk",
    minimum: "€10",
  },
  {
    name: "Dutch Government Bonds",
    description: "Stable 2-3% return, very safe — good for emergency fund growth.",
    risk: "Low Risk",
    minimum: "€100",
  },
];

const RISK_STYLES: Record<InvestmentIdea["risk"], string> = {
  "Low Risk": "bg-emerald-500/15 text-emerald-400",
  "High Risk": "bg-red-500/15 text-red-400",
};

export default function InvestmentIdeas() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <h2 className="font-semibold mb-4">Investment Ideas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {IDEAS.map((idea) => (
          <div
            key={idea.name}
            className="flex flex-col gap-2 bg-[#1c1c1c] border border-border rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm">{idea.name}</h3>
              <span
                className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${RISK_STYLES[idea.risk]}`}
              >
                {idea.risk}
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed flex-1">{idea.description}</p>
            <p className="text-xs text-gray-500">
              Minimum: <span className="text-gray-300 font-medium">{idea.minimum}</span>
            </p>
            <button className="mt-1 self-start text-xs font-medium text-[#d4af37] hover:underline">
              Learn More
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
