import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const ThreatChart = ({ stats }) => {
  const data = [
    { name: "Allowed", value: stats.allowed, color: "#10b981" },
    { name: "Blocked", value: stats.blocked, color: "#ef4444" },
    { name: "Flagged", value: stats.flagged, color: "#f59e0b" },
  ].filter(item => item.value > 0);

  return (
    <div className="bg-zinc-950/50 border border-zinc-800 h-[600px] flex flex-col" data-testid="threat-chart">
      <div className="border-b border-zinc-800 p-4">
        <h2 className="text-lg font-black text-white uppercase tracking-wider" style={{ fontFamily: 'Chivo, sans-serif' }}>
          Threat Distribution
        </h2>
      </div>
      
      <div className="flex-1 p-6">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  border: '1px solid #27272a',
                  borderRadius: 0,
                  fontFamily: 'JetBrains Mono, monospace'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                wrapperStyle={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-500">
            No data available yet. Start the simulator to generate traffic.
          </div>
        )}
      </div>
      
      <div className="border-t border-zinc-800 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Requests</div>
            <div className="text-2xl font-black text-white mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {stats.total_requests}
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">High Risk IPs</div>
            <div className="text-2xl font-black text-red-500 mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {stats.high_risk_ips}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreatChart;