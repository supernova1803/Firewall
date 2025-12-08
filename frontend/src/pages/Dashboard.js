import { useState, useEffect } from "react";
import axios from "axios";
import { Shield, Activity, AlertTriangle, Ban, Play, Square } from "lucide-react";
import Navigation from "@/components/Navigation";
import StatsCard from "@/components/StatsCard";
import LiveTrafficFeed from "@/components/LiveTrafficFeed";
import ThreatChart from "@/components/ThreatChart";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_requests: 0,
    allowed: 0,
    blocked: 0,
    flagged: 0,
    high_risk_ips: 0
  });
  const [recentThreats, setRecentThreats] = useState([]);
  const [isSimulatorRunning, setIsSimulatorRunning] = useState(false);
  const [simulatorInterval, setSimulatorInterval] = useState(null);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/threats/stats`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRecentThreats = async () => {
    try {
      const response = await axios.get(`${API}/threats/logs?limit=20`);
      setRecentThreats(response.data);
    } catch (error) {
      console.error("Error fetching threats:", error);
    }
  };

  const generateTraffic = async () => {
    try {
      const response = await axios.post(`${API}/simulator/generate`);
      await fetchStats();
      await fetchRecentThreats();
      
      if (response.data.decision === "BLOCK") {
        toast.error(`Threat Blocked: ${response.data.ip_address}`);
      } else if (response.data.decision === "FLAG") {
        toast.warning(`Threat Flagged: ${response.data.ip_address}`);
      }
    } catch (error) {
      console.error("Error generating traffic:", error);
    }
  };

  const toggleSimulator = () => {
    if (isSimulatorRunning) {
      clearInterval(simulatorInterval);
      setSimulatorInterval(null);
      setIsSimulatorRunning(false);
      toast.info("Traffic simulator stopped");
    } else {
      const interval = setInterval(generateTraffic, 2000);
      setSimulatorInterval(interval);
      setIsSimulatorRunning(true);
      toast.success("Traffic simulator started");
      generateTraffic();
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRecentThreats();
    
    const statsInterval = setInterval(fetchStats, 5000);
    
    return () => {
      clearInterval(statsInterval);
      if (simulatorInterval) {
        clearInterval(simulatorInterval);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="dashboard">
      <Navigation />
      
      <div className="grid-bg fixed inset-0 pointer-events-none" />
      
      <main className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8" data-testid="dashboard-header">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
              SENTINEL AI
            </h1>
            <p className="text-zinc-400" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Real-Time Threat Detection & Response
            </p>
          </div>
          
          <Button
            onClick={toggleSimulator}
            data-testid="simulator-toggle-btn"
            className={`${
              isSimulatorRunning
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            } text-white rounded-none font-bold uppercase tracking-wider text-xs px-6 py-3`}
          >
            {isSimulatorRunning ? (
              <>
                <Square className="mr-2 h-4 w-4" />
                Stop Simulator
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Simulator
              </>
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={<Activity className="h-6 w-6" />}
            label="Total Requests"
            value={stats.total_requests}
            color="text-blue-500"
            testId="stat-total"
          />
          <StatsCard
            icon={<Shield className="h-6 w-6" />}
            label="Allowed"
            value={stats.allowed}
            color="text-emerald-500"
            testId="stat-allowed"
          />
          <StatsCard
            icon={<Ban className="h-6 w-6" />}
            label="Blocked"
            value={stats.blocked}
            color="text-red-500"
            testId="stat-blocked"
          />
          <StatsCard
            icon={<AlertTriangle className="h-6 w-6" />}
            label="Flagged"
            value={stats.flagged}
            color="text-amber-500"
            testId="stat-flagged"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Live Traffic Feed */}
          <div className="lg:col-span-7">
            <LiveTrafficFeed threats={recentThreats} />
          </div>
          
          {/* Threat Chart */}
          <div className="lg:col-span-5">
            <ThreatChart stats={stats} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;