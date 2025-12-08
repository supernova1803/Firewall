import { useState, useEffect } from "react";
import axios from "axios";
import Navigation from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ThreatLogs = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("ALL");

  const fetchLogs = async () => {
    try {
      const url = filter === "ALL" 
        ? `${API}/threats/logs?limit=200`
        : `${API}/threats/logs?limit=200&decision=${filter}`;
      const response = await axios.get(url);
      setLogs(response.data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const filteredLogs = logs.filter(log => 
    log.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.protocol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDecisionBadgeClass = (decision) => {
    switch (decision) {
      case "ALLOW":
        return "status-allow";
      case "BLOCK":
        return "status-block";
      case "FLAG":
        return "status-flag";
      default:
        return "";
    }
  };

  const getRiskColor = (score) => {
    if (score >= 70) return "text-red-500";
    if (score >= 40) return "text-amber-500";
    return "text-emerald-500";
  };

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="threat-logs-page">
      <Navigation />
      
      <main className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-4xl font-black text-white mb-8" style={{ fontFamily: 'Chivo, sans-serif' }}>
          THREAT LOGS
        </h1>

        {/* Filters */}
        <div className="bg-zinc-950/50 border border-zinc-800 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                data-testid="search-logs-input"
                placeholder="Search by IP or protocol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-900 border-zinc-800 text-white rounded-none font-mono"
              />
            </div>
            
            <div className="flex gap-2">
              {["ALL", "ALLOW", "BLOCK", "FLAG"].map((f) => (
                <button
                  key={f}
                  data-testid={`filter-${f.toLowerCase()}-btn`}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 text-xs uppercase tracking-wider font-bold border transition-colors ${
                    filter === f
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-zinc-950/50 border border-zinc-800 overflow-hidden" data-testid="logs-table">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-900 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Port</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Protocol</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Requests</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Risk Score</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Decision</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Reasons</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-900/50 transition-colors" data-testid="log-row">
                    <td className="px-4 py-3 text-sm text-zinc-400 mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-white mono font-medium">
                      {log.ip_address}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300 mono">
                      {log.port}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300 uppercase">
                      {log.protocol}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300 mono">
                      {log.request_count}
                    </td>
                    <td className="px-4 py-3 text-sm mono">
                      <span className={`font-bold ${getRiskColor(log.risk_score)}`}>
                        {log.risk_score}/100
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge 
                        className={`${getDecisionBadgeClass(log.decision)} px-2 py-0.5 text-[10px] uppercase tracking-widest font-mono`}
                        data-testid={`decision-badge-${log.decision.toLowerCase()}`}
                      >
                        {log.decision}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400 max-w-md">
                      <div className="space-y-1">
                        {log.reasons.map((reason, idx) => (
                          <div key={idx} className="text-xs">• {reason}</div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-zinc-500" data-testid="no-logs-message">
              No logs found. Start the traffic simulator to generate data.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ThreatLogs;