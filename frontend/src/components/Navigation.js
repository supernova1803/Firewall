import { Link, useLocation } from "react-router-dom";
import { Shield, FileText, Ban } from "lucide-react";

const Navigation = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50" data-testid="navigation">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-emerald-500" />
            <span className="text-xl font-black text-white" style={{ fontFamily: 'Chivo, sans-serif' }}>
              SENTINEL
            </span>
          </div>
          
          <div className="flex space-x-1">
            <Link
              to="/"
              data-testid="nav-dashboard"
              className={`flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                isActive("/")
                  ? 'text-white bg-zinc-900 border-b-2 border-emerald-500'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              <Shield className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/logs"
              data-testid="nav-logs"
              className={`flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                isActive("/logs")
                  ? 'text-white bg-zinc-900 border-b-2 border-emerald-500'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              <FileText className="mr-2 h-4 w-4" />
              Threat Logs
            </Link>
            <Link
              to="/blacklist"
              data-testid="nav-blacklist"
              className={`flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                isActive("/blacklist")
                  ? 'text-white bg-zinc-900 border-b-2 border-emerald-500'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              <Ban className="mr-2 h-4 w-4" />
              Blacklist
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;