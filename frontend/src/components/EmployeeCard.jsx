import React from "react";
import { Eye, Edit2, Trash2, ShieldAlert } from "lucide-react";
import BorderGlow from "./BorderGlow";

const EmployeeCard = ({ employee, onView, onUpdate, onDelete }) => {
  const getExpiryAlert = () => {
    if (!employee.documentExpiry) return null;
    const now = new Date();
    const alerts = [];
    
    Object.entries(employee.documentExpiry).forEach(([docType, dateStr]) => {
      if (!dateStr) return;
      const expiryDate = new Date(dateStr);
      const diffMs = expiryDate - now;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      
      const readableNames = {
        emiratesId: "Emirates ID",
        labourCard: "Labour Card",
        medicalInsurance: "Medical Insurance",
        passport: "Passport",
        labourContract: "Labour Contract",
      };
      
      const docName = readableNames[docType] || docType;
      
      if (diffDays < 0) {
        alerts.push({
          docName,
          daysLeft: Math.floor(diffDays),
          status: "expired",
        });
      } else if (diffDays <= 30) {
        alerts.push({
          docName,
          daysLeft: Math.ceil(diffDays),
          status: "expiring",
        });
      }
    });
    
    // Sort so that expired ones show first, otherwise closest expiry
    alerts.sort((a, b) => a.daysLeft - b.daysLeft);
    return alerts.length > 0 ? alerts[0] : null;
  };

  const alert = getExpiryAlert();

  return (
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
      className="p-5 shadow-lg hover:bg-white/5 transition-all duration-300 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in text-white"
    >
      <div className="flex items-center gap-4">
        {/* Profile Photo / Avatar Placeholder with Initials */}
        {employee.documents && employee.documents.profilePic ? (
          <img
            src={employee.documents.profilePic}
            alt={employee.name}
            className="w-12 h-12 rounded-full object-cover border border-teal-500/25"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-teal-950/60 text-teal-300 font-semibold text-lg flex items-center justify-center border border-teal-500/25">
            {employee.name ? employee.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "EM"}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-white text-base">{employee.name}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              employee.gender === "Male" 
                ? "bg-blue-950/50 text-blue-300 border border-blue-500/25" 
                : "bg-rose-950/50 text-rose-300 border border-rose-500/25"
            }`}>
              {employee.gender}
            </span>
            <span className="text-[10px] bg-white/5 text-slate-300 border border-white/10 px-2 py-0.5 rounded-full font-medium">
              {employee.nationality}
            </span>
            {alert && (
              <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                alert.status === "expired"
                  ? "bg-red-950/50 text-red-350 border-red-500/35"
                  : "bg-amber-950/50 text-amber-350 border-amber-500/35"
              }`}>
                <ShieldAlert className="w-3 h-3" />
                <span>
                  {alert.docName} {alert.status === "expired" ? "Expired" : `Expires in ${alert.daysLeft}d`}
                </span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 mt-1 font-mono">
            Salary No: <span className="font-bold text-teal-400">{employee.salaryNo}</span>
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 md:justify-end border-t border-white/10 pt-3 md:pt-0 md:border-0">
        <button
          onClick={() => onView(employee)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-teal-300 bg-teal-950/40 border border-teal-500/20 hover:bg-teal-600/70 hover:text-white hover:border-teal-500/20 transition-all duration-200 cursor-pointer"
          title="View Employee Profile"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View</span>
        </button>

        <button
          onClick={() => onUpdate(employee)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-300 bg-amber-950/40 border border-amber-500/20 hover:bg-amber-600/70 hover:text-white hover:border-amber-500 transition-all duration-200 cursor-pointer"
          title="Update Employee Details"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Update</span>
        </button>

        <button
          onClick={() => onDelete(employee)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-300 bg-red-950/40 border border-red-500/20 hover:bg-red-600/70 hover:text-white hover:border-red-600 transition-all duration-200 cursor-pointer"
          title="Delete Employee"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </BorderGlow>
  );
};

export default EmployeeCard;
