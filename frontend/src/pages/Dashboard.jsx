import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Users, LogOut, UtensilsCrossed, Building2 } from "lucide-react";
import StatsDashboard from "../components/StatsDashboard";
import BorderGlow from "../components/BorderGlow";

const Dashboard = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    fetch('/api/employees/expiring')
      .then(res => res.json())
      .then(data => setAlerts(data))
      .catch(err => console.error('Failed to fetch alerts', err));
  }, []);


  const handleLogout = () => {
    localStorage.removeItem("uaq_admin_token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-transparent pb-12">

      {/* Top Navbar */}
      <nav className="bg-teal-950/40 backdrop-blur-md border-b border-teal-500/20 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo area */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center border border-white/20">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-base tracking-wide font-serif">Umm Al Quwain Beach Hotel</span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600/60 hover:bg-teal-600/85 border border-teal-500/30 text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>

          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

        {/* Title Banner */}
        <BorderGlow
          edgeSensitivity={30}
          glowColor="40 80 80"
          backgroundColor="#120F17"
          borderRadius={28}
          glowRadius={40}
          glowIntensity={1}
          coneSpread={25}
          animated={false}
          colors={['#c084fc', '#f472b6', '#38bdf8']}
          className="p-6 md:p-8 shadow-lg mb-8 relative overflow-hidden text-white"
        >
          <div className="absolute top-[-10%] right-[-5%] w-48 h-48 rounded-full bg-gold-500/10 filter blur-2xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-40 h-40 rounded-full bg-teal-500/10 filter blur-2xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="text-[10px] text-gold-400 font-bold uppercase tracking-widest bg-gold-950/45 px-3 py-1 rounded-full border border-gold-500/20">
                Umm-Al-Quwain Beach Hotel Operations
              </span>
              <h1 className="text-xl md:text-2xl font-bold font-serif text-white mt-3 leading-tight">
                Umm Al Quwain Beach Hotel - Employee Management System
              </h1>
              <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl font-sans">
                Manage labour contracts, emirates IDs, and employee profiles.
              </p>
            </div>

            <div className="hidden lg:flex items-center justify-center p-3.5 bg-white/5 border border-white/10 rounded-2xl shadow-inner backdrop-blur-xs">
              <Building2 className="w-12 h-12 text-gold-400" />
            </div>
          </div>
        </BorderGlow>

        {/* Dashboard Statistics */}
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">Realtime Metrics</h2>
        {alerts.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Expiring Documents</h2>
            <ul className="space-y-2">
              {alerts.map((alert, i) => (
                <li key={i} className="p-3 bg-red-900/30 border border-red-500 rounded-md text-sm text-red-200">
                  {alert.employeeName || alert.employeeId} - {alert.document} expires in {alert.daysLeft} day(s) (expires on {alert.expiryDate})
                </li>
              ))}
            </ul>
          </div>
        )}
        <StatsDashboard />

        {/* Main Dashboard Cards/Buttons */}
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">
          System Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Create Employee Card */}
          <Link
            to="/create-employee"
            className="group block"
          >
            <BorderGlow
              edgeSensitivity={30}
              glowColor="40 80 80"
              backgroundColor="#120F17"
              borderRadius={28}
              glowRadius={40}
              glowIntensity={1}
              coneSpread={25}
              animated={false}
              colors={['#c084fc', '#f472b6', '#38bdf8']}
              className="p-6 md:p-8 shadow-lg hover:bg-white/5 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden text-white"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold-950/40 border-l border-b border-gold-500/20 rounded-bl-full group-hover:bg-gold-900/50 transition-colors flex items-center justify-end p-5">
                <UserPlus className="w-7 h-7 text-gold-400 transition-transform group-hover:scale-110" />
              </div>
              <div className="pr-12 text-white">
                <span className="text-[10px] text-gold-400 bg-gold-950/40 border border-gold-500/20 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Registrations
                </span>
                <h3 className="text-lg font-bold text-white mt-4 group-hover:text-gold-400 transition-colors font-serif">
                  Create Employee
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-sm font-sans leading-relaxed">
                  Register Employees,input salary contracts, and upload copies of passport, Emirates ID, and health documents.
                </p>
              </div>
            </BorderGlow>
          </Link>

          {/* View Employee Details Card */}
          <Link
            to="/employees"
            className="group block"
          >
            <BorderGlow
              edgeSensitivity={30}
              glowColor="40 80 80"
              backgroundColor="#120F17"
              borderRadius={28}
              glowRadius={40}
              glowIntensity={1}
              coneSpread={25}
              animated={false}
              colors={['#c084fc', '#f472b6', '#38bdf8']}
              className="p-6 md:p-8 shadow-lg hover:bg-white/5 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden text-white"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-950/40 border-l border-b border-teal-500/20 rounded-bl-full group-hover:bg-teal-900/50 transition-colors flex items-center justify-end p-5">
                <Users className="w-7 h-7 text-teal-400 transition-transform group-hover:scale-110" />
              </div>
              <div className="pr-12 text-white">
                <span className="text-[10px] text-teal-400 bg-teal-950/40 border border-teal-500/20 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Directories
                </span>
                <h3 className="text-lg font-bold text-white mt-4 group-hover:text-teal-400 transition-colors font-serif">
                  View Employee Details
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-sm font-sans leading-relaxed">
                  Browse through all active staff cards, filter by status, perform details queries, export PDF records, or modify profile contents.
                </p>
              </div>
            </BorderGlow>
          </Link>

        </div>

      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 text-center mt-16 text-xs text-slate-400/80 font-medium tracking-wide">
        Umm Al Quwain Beach Hotel - Employee Management System • UAE Operations Admin
      </footer>

    </div>
  );
};

export default Dashboard;
