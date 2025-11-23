interface ProfitCardProps {
  profit: number;
}

export default function ProfitCard({ profit }: ProfitCardProps) {
  return (
    <div className="border-4 border-black bg-white mb-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="p-5">
        <div className="text-[10px] font-semibold text-gray-600 tracking-wider uppercase mb-1.5">
          TOTAL PROFIT
        </div>
        <div className="text-4xl font-extrabold mb-1 min-h-[45px]">
          ${profit.toFixed(2)}
        </div>
      </div>
    </div>
  );
}



