import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import ThreatLogs from "@/pages/ThreatLogs";
import Blacklist from "@/pages/Blacklist";
import "@/App.css";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/logs" element={<ThreatLogs />} />
          <Route path="/blacklist" element={<Blacklist />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;