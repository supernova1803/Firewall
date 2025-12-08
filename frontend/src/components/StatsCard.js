const StatsCard = ({ icon, label, value, color, testId }) => {
  return (
    <div 
      className="bg-zinc-950/50 border border-zinc-800 p-6 hover:border-zinc-700 transition-colors"
      data-testid={testId}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`${color}`}>
          {icon}
        </div>
        <div className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
          {label}
        </div>
      </div>
      <div 
        className="text-3xl font-black text-white mono"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        {value.toLocaleString()}
      </div>
    </div>
  );
};

export default StatsCard;