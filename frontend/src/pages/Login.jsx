import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, AlertCircle, UtensilsCrossed } from "lucide-react";
import BorderGlow from "../components/BorderGlow";

const Login = () => {
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!passcode) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ passcode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("uaq_admin_token", data.token);
        navigate("/");
      } else {
        setError(data.message || "Invalid Passcode. Please try again.");
      }
    } catch (err) {
      console.error("Login request failed:", err);
      setError("Unable to connect to the authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">

      {/* UAE Gold & Teal themed highlights */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-teal-900/10 filter blur-3xl z-1"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gold-950/10 filter blur-3xl z-1"></div>

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
        className="w-full max-w-md p-8 text-white z-10 animate-fade-in relative"
      >

        {/* Brand Icon and Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-teal-500/90 rounded-2xl flex items-center justify-center shadow-lg border border-teal-400/20 mb-4">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white text-center tracking-wide">Umm Al Quwain Beach Hotel</h1>
          <p className="text-xs text-slate-300 font-medium tracking-widest uppercase mt-1">Employee Management</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
              Enter Admin Passcode
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••••"
                className="w-full text-white bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-teal-500 focus:bg-white/10 transition-all font-mono"
                required
                autoFocus
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Default passcode is <span className="font-mono font-bold bg-white/10 px-1 rounded-sm text-slate-200 border border-white/10">UAQ2026</span></p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs font-semibold text-red-300 bg-red-950/40 border border-red-900/50 p-3.5 rounded-xl animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Verifying Passcode..." : "Access System Dashboard"}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 text-[11px] font-semibold text-slate-400/80 tracking-wide">
          © {new Date().getFullYear()} Umm Al Quwain Beach Hotel - UAE Operations Admin. All rights reserved.
        </div>

      </BorderGlow>
    </div>
  );
};

export default Login;
