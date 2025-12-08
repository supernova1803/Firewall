import { useState, useEffect } from "react";
import axios from "axios";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Blacklist = () => {
  const [blacklist, setBlacklist] = useState([]);
  const [newIP, setNewIP] = useState("");
  const [newReason, setNewReason] = useState("");

  const fetchBlacklist = async () => {
    try {
      const response = await axios.get(`${API}/blacklist`);
      setBlacklist(response.data);
    } catch (error) {
      console.error("Error fetching blacklist:", error);
    }
  };

  const addToBlacklist = async () => {
    if (!newIP || !newReason) {
      toast.error("Please provide both IP address and reason");
      return;
    }

    try {
      await axios.post(`${API}/blacklist`, {
        ip_address: newIP,
        reason: newReason
      });
      toast.success(`IP ${newIP} added to blacklist`);
      setNewIP("");
      setNewReason("");
      fetchBlacklist();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add IP");
    }
  };

  const removeFromBlacklist = async (ip) => {
    try {
      await axios.delete(`${API}/blacklist/${ip}`);
      toast.success(`IP ${ip} removed from blacklist`);
      fetchBlacklist();
    } catch (error) {
      toast.error("Failed to remove IP");
    }
  };

  useEffect(() => {
    fetchBlacklist();
    const interval = setInterval(fetchBlacklist, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="blacklist-page">
      <Navigation />
      
      <main className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-4xl font-black text-white mb-8" style={{ fontFamily: 'Chivo, sans-serif' }}>
          BLACKLIST MANAGEMENT
        </h1>

        {/* Add to Blacklist Form */}
        <div className="bg-zinc-950/50 border border-zinc-800 p-6 mb-8" data-testid="add-blacklist-form">
          <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Add IP to Blacklist
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              data-testid="ip-input"
              placeholder="IP Address (e.g., 192.168.1.1)"
              value={newIP}
              onChange={(e) => setNewIP(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white rounded-none font-mono"
            />
            <Input
              data-testid="reason-input"
              placeholder="Reason for blacklisting"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white rounded-none"
            />
            <Button
              data-testid="add-blacklist-btn"
              onClick={addToBlacklist}
              className="bg-white text-black hover:bg-zinc-200 rounded-none font-bold uppercase tracking-wider text-xs px-6 py-3"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add to Blacklist
            </Button>
          </div>
        </div>

        {/* Blacklist Table */}
        <div className="bg-zinc-950/50 border border-zinc-800 overflow-hidden" data-testid="blacklist-table">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-900 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Blocked At</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Block Count</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {blacklist.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-900/50 transition-colors" data-testid="blacklist-row">
                    <td className="px-4 py-3 text-sm text-white mono font-bold">
                      {item.ip_address}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300">
                      {item.reason}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400 mono">
                      {new Date(item.blocked_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300 mono">
                      {item.block_count}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        data-testid={`remove-blacklist-btn-${item.ip_address}`}
                        onClick={() => removeFromBlacklist(item.ip_address)}
                        variant="destructive"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white rounded-none"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {blacklist.length === 0 && (
            <div className="text-center py-12 text-zinc-500" data-testid="no-blacklist-message">
              No blacklisted IPs yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Blacklist;