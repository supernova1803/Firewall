import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const LiveTrafficFeed = ({ threats }) => {
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

  return (
    <div className="bg-zinc-950/50 border border-zinc-800 h-[600px] flex flex-col" data-testid="live-traffic-feed">
      <div className="border-b border-zinc-800 p-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-white uppercase tracking-wider" style={{ fontFamily: 'Chivo, sans-serif' }}>
          Live Traffic Feed
        </h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Active</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence>
          {threats.slice(0, 20).map((threat, index) => (
            <motion.div
              key={threat.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="bg-zinc-900/50 border border-zinc-800 p-3 hover:border-zinc-700 transition-colors"
              data-testid="traffic-item"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <Badge className={`${getDecisionBadgeClass(threat.decision)} px-2 py-0.5 text-[10px] uppercase tracking-widest font-mono`}>
                    {threat.decision}
                  </Badge>
                  <span className="text-white font-bold mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {threat.ip_address}
                  </span>
                </div>
                <span className="text-xs text-zinc-500 mono">
                  {new Date(threat.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-zinc-400">
                <span className="mono">Port: <span className="text-zinc-300">{threat.port}</span></span>
                <span className="mono">Protocol: <span className="text-zinc-300 uppercase">{threat.protocol}</span></span>
                <span className="mono">Risk: <span className={`font-bold ${
                  threat.risk_score >= 70 ? 'text-red-500' :
                  threat.risk_score >= 40 ? 'text-amber-500' :
                  'text-emerald-500'
                }`}>{threat.risk_score}/100</span></span>
              </div>
              
              {threat.reasons && threat.reasons.length > 0 && (
                <div className="mt-2 pt-2 border-t border-zinc-800">
                  <div className="text-xs text-zinc-500 space-y-1">
                    {threat.reasons.slice(0, 2).map((reason, idx) => (
                      <div key={idx}>• {reason}</div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {threats.length === 0 && (
          <div className="text-center py-12 text-zinc-500" data-testid="no-traffic-message">
            Waiting for traffic data...
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTrafficFeed;