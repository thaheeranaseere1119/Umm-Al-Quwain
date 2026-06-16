import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, RefreshCw, FileText, Download, UserMinus, AlertCircle, CheckCircle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import EmployeeCard from "../components/EmployeeCard";
import EmployeeModal from "../components/EmployeeModal";
import BorderGlow from "../components/BorderGlow";
import { getEmployees, deleteEmployee } from "../services/employeeService";

const EmployeeList = () => {
  const navigate = useNavigate();

  // Employees data state
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedNationality, setSelectedNationality] = useState("");

  // Available nationalities for filter (populated dynamically)
  const [nationalities, setNationalities] = useState([]);

  // Modal State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'view' or 'update'

  // Delete Confirm State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Success notifications
  const [notification, setNotification] = useState("");

  // Fetch employees
  useEffect(() => {
    const fetchAllEmployees = async () => {
      try {
        setLoading(true);
        const data = await getEmployees();
        setEmployees(data);
        setError(null);

        // Dynamically extract unique nationalities
        const uniqueNationalities = [
          ...new Set(data.map((emp) => emp.nationality).filter(Boolean)),
        ];
        setNationalities(uniqueNationalities);
      } catch (err) {
        console.error("Fetch employees error:", err);
        setError("Error loading employee directory records.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllEmployees();
  }, [refreshTrigger]);

  // Handle show success notification
  const triggerNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  // Client-side filtering & search matching
  const filteredEmployees = employees.filter((emp) => {
    // Search filter
    const matchesSearch =
      search.trim() === "" ||
      (emp.name && emp.name.toLowerCase().includes(search.toLowerCase())) ||
      (emp.salaryNo && emp.salaryNo.toString().toLowerCase().includes(search.toLowerCase())) ||
      (emp.nationality && emp.nationality.toLowerCase().includes(search.toLowerCase()));

    // Gender filter
    const matchesGender = selectedGender === "" || emp.gender === selectedGender;

    // Status filter
    const matchesStatus = selectedStatus === "" || emp.status === selectedStatus;

    // Nationality filter
    const matchesNationality =
      selectedNationality === "" ||
      (emp.nationality && emp.nationality.toLowerCase() === selectedNationality.toLowerCase());

    return matchesSearch && matchesGender && matchesStatus && matchesNationality;
  });

  // Export to PDF
  const exportToPDF = () => {
    if (filteredEmployees.length === 0) {
      alert("No data available to export.");
      return;
    }

    const doc = new jsPDF();

    // Add PDF styling header
    doc.setFillColor(0, 79, 79); // Deep Teal
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("UMM AL QUWAIN BEACH HOTEL", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Employee Management System - Staff Directory", 14, 30);
    doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 150, 30);

    // Table Columns
    const tableColumns = ["Salary No", "Name", "Gender", "Nationality", "Status", "Age", "Salary (AED)"];

    // Table Rows
    const tableRows = filteredEmployees.map((emp) => [
      emp.salaryNo,
      emp.name,
      emp.gender,
      emp.nationality,
      emp.status,
      emp.age || "N/A",
      emp.salary ? `${emp.salary}` : "N/A",
    ]);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 50,
      theme: "striped",
      headStyles: { fillColor: [0, 79, 79], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: "bold" },
        6: { halign: "right" },
      },
    });

    doc.save(`UAQ_Restaurant_Employees_${Date.now()}.pdf`);
  };

  // Export to Excel
  const exportToExcel = () => {
    if (filteredEmployees.length === 0) {
      alert("No data available to export.");
      return;
    }

    const dataToExport = filteredEmployees.map((emp) => ({
      "Salary Number": emp.salaryNo,
      "Employee Name": emp.name,
      "Nationality": emp.nationality,
      "Gender": emp.gender,
      "Age": emp.age || "N/A",
      "Marital Status": emp.status,
      "Salary (AED)": emp.salary || "N/A",
      "Indian Address": emp.address || "",
      "Family Details": emp.familyDetails || "",
      "Registered Date": emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staff List");

    // Fit column widths
    const maxLens = {};
    dataToExport.forEach((row) => {
      Object.keys(row).forEach((key) => {
        const val = row[key] ? row[key].toString() : "";
        maxLens[key] = Math.max(maxLens[key] || key.length, val.length);
      });
    });
    worksheet["!cols"] = Object.keys(maxLens).map((key) => ({
      wch: maxLens[key] + 3,
    }));

    XLSX.writeFile(workbook, `UAQ_Restaurant_Employees_${Date.now()}.xlsx`);
  };

  // View Handler
  const handleView = (emp) => {
    setSelectedEmployeeId(emp.id);
    setModalMode("view");
  };

  // Update Handler
  const handleUpdate = (emp) => {
    setSelectedEmployeeId(emp.id);
    setModalMode("update");
  };

  // Delete Handler
  const handleDeleteTrigger = (emp) => {
    setDeleteConfirmItem(emp);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmItem) return;

    setDeleting(true);
    try {
      await deleteEmployee(deleteConfirmItem);
      triggerNotification("Employee profile and documents deleted successfully!");
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      alert(err.message || "An error occurred during deletion.");
    } finally {
      setDeleting(false);
      setDeleteConfirmItem(null);
    }
  };

  const handleModalSaveSuccess = (msg) => {
    setModalMode(null);
    setSelectedEmployeeId(null);
    triggerNotification(msg);
    setRefreshTrigger((prev) => prev + 1);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedGender("");
    setSelectedStatus("");
    setSelectedNationality("");
  };

  return (
    <div className="min-h-screen bg-transparent pb-16 font-sans text-white">

      {/* Navbar Header */}
      <header className="bg-teal-950/40 backdrop-blur-md border-b border-teal-500/20 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white hover:text-teal-100 font-semibold text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <span className="font-bold tracking-wide font-serif text-sm">Employee Directory</span>
          <div className="w-8"></div> {/* Spacer */}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

        {/* Floating Notification */}
        {notification && (
          <div className="fixed bottom-5 right-5 bg-teal-900/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-teal-500/30 flex items-center gap-2 animate-bounce z-45">
            <CheckCircle className="w-4 h-4 text-gold-450" />
            <span>{notification}</span>
          </div>
        )}

        {/* Directory Controls and Search */}
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
          className="p-6 shadow-lg space-y-4 mb-6 text-white"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white font-serif">Staff Management</h1>
              <p className="text-xs text-slate-300">Query profiles, filter categories, and export spreadsheets.</p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={exportToPDF}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-500/20 hover:bg-teal-500/35 border border-teal-500/30 text-teal-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={exportToExcel}
                className="flex items-center gap-1.5 px-3 py-2 bg-gold-500/20 hover:bg-gold-500/35 border border-gold-500/30 text-gold-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={() => setRefreshTrigger((prev) => prev + 1)}
                className="flex items-center justify-center p-2 border border-white/10 text-slate-300 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                title="Refresh Directory"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="w-full border-t border-white/10"></div>

          {/* Search bar & filter selects */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, salary no, nationality..."
                className="w-full text-white bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-teal-500 focus:bg-white/10 focus:ring-1 focus:ring-teal-500/25 transition-all"
              />
            </div>

            {/* Gender Filter */}
            <div className="relative">
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full text-white bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-teal-500 focus:bg-white/10 focus:ring-1 focus:ring-teal-500/25 transition-all appearance-none"
              >
                <option value="" className="bg-slate-900 text-white">Filter: All Genders</option>
                <option value="Male" className="bg-slate-900 text-white">Male</option>
                <option value="Female" className="bg-slate-900 text-white">Female</option>
              </select>
            </div>

            {/* Marital Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full text-white bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-teal-500 focus:bg-white/10 focus:ring-1 focus:ring-teal-500/25 transition-all appearance-none"
              >
                <option value="" className="bg-slate-900 text-white">Filter: All Marital Status</option>
                <option value="Single" className="bg-slate-900 text-white">Single</option>
                <option value="Married" className="bg-slate-900 text-white">Married</option>
              </select>
            </div>

            {/* Nationality Filter */}
            <div className="relative">
              <select
                value={selectedNationality}
                onChange={(e) => setSelectedNationality(e.target.value)}
                className="w-full text-white bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-teal-500 focus:bg-white/10 focus:ring-1 focus:ring-teal-500/25 transition-all appearance-none"
              >
                <option value="" className="bg-slate-900 text-white">Filter: All Nationalities</option>
                {nationalities.map((nat, idx) => (
                  <option key={idx} value={nat} className="bg-slate-900 text-white">{nat}</option>
                ))}
              </select>
            </div>

          </div>

          {(search || selectedGender || selectedStatus || selectedNationality) && (
            <div className="flex items-center justify-between text-[11px] font-semibold bg-teal-950/40 text-teal-350 border border-teal-500/20 p-2.5 rounded-lg">
              <span>Showing {filteredEmployees.length} matching result(s).</span>
              <button onClick={clearFilters} className="text-teal-400 hover:text-teal-300 underline cursor-pointer">
                Clear all filters
              </button>
            </div>
          )}

        </BorderGlow>

        {/* Directory List Container */}
        {loading ? (
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
            className="p-16 flex flex-col items-center justify-center shadow-lg text-white"
          >
            <RefreshCw className="w-8 h-8 text-teal-500 animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-300">Querying restaurant personnel records...</p>
          </BorderGlow>
        ) : error ? (
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
            className="p-12 text-center shadow-lg text-white"
          >
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-red-400 mb-2">{error}</p>
            <button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="text-xs font-semibold text-teal-300 underline cursor-pointer"
            >
              Retry Database Connection
            </button>
          </BorderGlow>
        ) : filteredEmployees.length === 0 ? (
          /* Empty state view */
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
            className="p-16 text-center shadow-lg flex flex-col items-center justify-center text-white"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-4 text-slate-300">
              <UserMinus className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-base text-white font-serif">No Employees Found</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
              We couldn't find any employees matching your current search parameters or database matches. Please clear filters or register new staff.
            </p>
          </BorderGlow>
        ) : (
          /* Cards list */
          <div className="space-y-4">
            {filteredEmployees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                onView={handleView}
                onUpdate={handleUpdate}
                onDelete={handleDeleteTrigger}
              />
            ))}
          </div>
        )}

      </main>

      {/* Modal Profile / Editor View overlay */}
      {modalMode && selectedEmployeeId && (
        <EmployeeModal
          employeeId={selectedEmployeeId}
          mode={modalMode}
          onClose={() => {
            setModalMode(null);
            setSelectedEmployeeId(null);
          }}
          onSaveSuccess={handleModalSaveSuccess}
        />
      )}

      {/* Delete Confirmation Popup */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900/95 rounded-2xl shadow-2xl border border-white/10 p-6 max-w-md w-full animate-fade-in text-center text-white">
            <div className="w-12 h-12 rounded-full bg-red-950/50 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base text-white font-serif">Delete Employee Record?</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Are you sure you want to delete {deleteConfirmItem.name}? This action is permanent and will delete their database profile and all uploaded documents from Firebase Storage.
            </p>

            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                disabled={deleting}
                className="flex-1 py-2 border border-white/10 text-slate-350 hover:bg-white/5 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2 bg-red-500 hover:bg-red-650 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeeList;
