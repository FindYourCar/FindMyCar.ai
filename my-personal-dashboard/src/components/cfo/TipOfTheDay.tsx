import { Lightbulb } from "lucide-react";

interface TipOfTheDayProps {
  tip: string;
}

export default function TipOfTheDay({ tip }: TipOfTheDayProps) {
  return (
    <div className="bg-gradient-to-r from-[#d4af37]/15 to-transparent border border-[#d4af37]/30 rounded-2xl p-5 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 text-[#d4af37] flex items-center justify-center shrink-0">
        <Lightbulb size={18} />
      </div>
      <div>
        <p className="text-xs font-semibold text-[#d4af37] uppercase tracking-wide">
          Tip of the Day
        </p>
        <p className="text-sm text-gray-200 mt-1 leading-relaxed">{tip}</p>
      </div>
    </div>
  );
}
