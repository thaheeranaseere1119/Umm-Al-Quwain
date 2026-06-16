import React, { useState, useEffect } from "react";
import { Users, User, Heart, UserMinus } from "lucide-react";
import { getStats } from "../services/employeeService";
import BorderGlow from "./BorderGlow";

const StatsDashboard = ({ refreshTrigger }) => {
  const [stats, setStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    married: 0,
    single: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error("Error loading stats:", err);
        setError("Error loading metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white/5 p-4 rounded-xl border border-white/10 h-24"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/30 text-red-400 p-4 rounded-xl text-center mb-8 border border-red-900/50">
        {error}
      </div>
    );
  }

  const items = [
    {
      label: "Total Employees",
      value: stats.total,
      icon: Users,
      color: "text-teal-300 bg-teal-950/60 border-teal-500/25",
    },
    {
      label: "Male Employees",
      value: stats.male,
      icon: User,
      color: "text-blue-300 bg-blue-950/60 border-blue-500/25",
    },
    {
      label: "Female Employees",
      value: stats.female,
      icon: User,
      color: "text-rose-300 bg-rose-950/60 border-rose-500/25",
    },
    {
      label: "Married Employees",
      value: stats.married,
      icon: Heart,
      color: "text-emerald-300 bg-emerald-950/60 border-emerald-500/25",
    },
    {
      label: "Single Employees",
      value: stats.single,
      icon: UserMinus,
      color: "text-amber-300 bg-amber-950/60 border-amber-500/25",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {items.map((item, idx) => {
        const IconComponent = item.icon;
        return (
          <BorderGlow
            key={idx}
            edgeSensitivity={30}
            glowColor="40 80 80"
            backgroundColor="#120F17"
            borderRadius={28}
            glowRadius={40}
            glowIntensity={1}
            coneSpread={25}
            animated={false}
            colors={['#c084fc', '#f472b6', '#38bdf8']}
            className="p-4 shadow-lg hover:bg-white/5 transition-all duration-300 flex flex-col justify-between text-white"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-slate-300 font-semibold tracking-wider uppercase">
                {item.label}
              </span>
              <div className={`p-1.5 rounded-lg border ${item.color.split(" ")[1]} ${item.color.split(" ")[2]}`}>
                <IconComponent className={`w-4 h-4 ${item.color.split(" ")[0]}`} />
              </div>
            </div>
            <div className="mt-1">
              <span className="text-2xl font-bold text-white">{item.value}</span>
            </div>
          </BorderGlow>
        );
      })}
    </div>
  );
};

export default StatsDashboard;
