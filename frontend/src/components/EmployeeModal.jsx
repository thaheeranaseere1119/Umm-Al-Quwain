import React, { useState, useEffect } from "react";
import { X, ZoomIn, Download, Save, RefreshCw, Upload, FileText, CheckCircle } from "lucide-react";
import { getEmployeeById, updateEmployee } from "../services/employeeService";
import BorderGlow from "./BorderGlow";

const calculateAge = (dobString) => {
  if (!dobString) return "";
  const parts = dobString.split("-");
  if (parts.length !== 3) return "";
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);
  
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) {
    age--;
  }
  return age >= 0 ? age.toString() : "";
};

const EmployeeModal = ({ employeeId, mode, onClose, onSaveSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    nationality: "",
    dubaiPhone: "",
    indianPhone: "",
    status: "",
    gender: "",
    age: "",
    familyDetails: "",
    salaryNo: "",
    salary: "",
    address: "",
    dob: "",
    expiry_emiratesId: "",
    expiry_labourCard: "",
    expiry_medicalInsurance: "",
    expiry_passport: "",
    expiry_labourContract: "",
  });

  // Files State
  const [files, setFiles] = useState({
    profilePic: null,
    emiratesId: null,
    labourCard: null,
    medicalInsurance: null,
    passport: null,
    labourContract: null,
  });

  // Existing image URLs
  const [existingDocs, setExistingDocs] = useState({
    profilePic: null,
    emiratesId: null,
    labourCard: null,
    medicalInsurance: null,
    passport: null,
    labourContract: null,
  });

  // Previews
  const [previews, setPreviews] = useState({
    profilePic: null,
    emiratesId: null,
    labourCard: null,
    medicalInsurance: null,
    passport: null,
    labourContract: null,
  });

  // Lightbox State
  const [lightboxImg, setLightboxImg] = useState(null);

  // Fetch employee data
  useEffect(() => {
    if (!employeeId) return;

    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const data = await getEmployeeById(employeeId);
        const expiries = data.documentExpiry || {};
        setFormData({
          name: data.name || "",
          nationality: data.nationality || "",
          dubaiPhone: data.dubaiPhone || data.mobileUAE || "",
          indianPhone: data.indianPhone || data.mobileIndia || "",
          status: data.status || "",
          gender: data.gender || "",
          age: data.age !== null && data.age !== undefined ? data.age.toString() : "",
          familyDetails: data.familyDetails || "",
          salaryNo: data.salaryNo || "",
          salary: data.salary !== null && data.salary !== undefined ? data.salary.toString() : "",
          address: data.address || "",
          dob: data.dob || "",
          expiry_emiratesId: expiries.emiratesId || "",
          expiry_labourCard: expiries.labourCard || "",
          expiry_medicalInsurance: expiries.medicalInsurance || "",
          expiry_passport: expiries.passport || "",
          expiry_labourContract: expiries.labourContract || "",
        });
        if (data.documents) {
          setExistingDocs({
            profilePic: data.documents.profilePic || null,
            emiratesId: data.documents.emiratesId || null,
            labourCard: data.documents.labourCard || null,
            medicalInsurance: data.documents.medicalInsurance || null,
            passport: data.documents.passport || null,
            labourContract: data.documents.labourContract || null,
          });
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching employee:", err);
        setError(err.message || "Could not retrieve employee profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "dob") {
        updated.age = calculateAge(value);
      }
      return updated;
    });
  };

  // Handle file select
  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      const file = selectedFiles[0];
      
      // Limit check
      if (file.size > 5 * 1024 * 1024) {
        alert("Maximum file size allowed is 5MB.");
        return;
      }

      setFiles((prev) => ({ ...prev, [name]: file }));

      if (file.type === "application/pdf" || (file.name && file.name.toLowerCase().endsWith(".pdf"))) {
        setPreviews((prev) => ({ ...prev, [name]: file.name }));
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews((prev) => ({ ...prev, [name]: reader.result }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Trigger form update submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!formData.name.trim()) return alert("Employee Name is required.");
    if (!formData.nationality.trim()) return alert("Nationality is required.");
    if (!formData.status) return alert("Status (Marital) is required.");
    if (!formData.gender) return alert("Gender is required.");
    if (!formData.salaryNo) return alert("Salary Number is required.");

    setSaving(true);
    setError(null);

    try {
      const result = await updateEmployee(employeeId, formData, files, existingDocs, (progress) => {
        // Track composite progress if uploads are happening
        console.log(`Upload progress: ${progress}%`);
      });
      onSaveSuccess("Employee details updated successfully!");
    } catch (err) {
      console.error("Error updating employee:", err);
      setError(err.message || "Server error occurred during update.");
    } finally {
      setSaving(false);
    }
  };

  // Trigger document download
  const downloadDocument = async (url, docName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${formData.name.replace(/\s+/g, "_")}_${docName}${url.substring(url.lastIndexOf(".")) || ".png"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, "_blank"); // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
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
        className="w-full max-w-4xl flex flex-col max-h-[95vh] text-white relative z-10"
      >
        
        {/* Header */}
        <div className="flex justify-between items-center bg-teal-950/50 border-b border-white/10 text-white px-6 py-4 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-semibold tracking-wide">
              {mode === "view" ? "Employee Details Profile" : "Edit Employee Registration"}
            </h2>
            <p className="text-xs text-teal-100 mt-0.5">
              Salary ID: <span className="font-mono font-bold">{formData.salaryNo || "Loading..."}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center flex-1">
            <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mb-3" />
            <p className="text-sm text-slate-300">Fetching records from server...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center flex-1">
            <p className="text-red-400 font-semibold mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 cursor-pointer"
            >
              Close Profile
            </button>
          </div>
        ) : (
          /* Main content area */
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* View Mode */}
            {mode === "view" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Side Card: Profile Photo / Key Fields */}
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
                  className="md:col-span-1 p-5 flex flex-col items-center text-white"
                >
                  {existingDocs.profilePic ? (
                    <img
                      src={existingDocs.profilePic}
                      alt={formData.name}
                      className="w-24 h-24 rounded-full object-cover border border-white/10 shadow-md mb-4 zoomable-image cursor-pointer"
                      onClick={() => setLightboxImg({ url: existingDocs.profilePic, label: "Profile Photo" })}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-teal-950/60 text-teal-300 font-bold text-3xl flex items-center justify-center border border-white/10 shadow-md mb-4">
                      {formData.name ? formData.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "EM"}
                    </div>
                  )}
                  <h3 className="font-bold text-lg text-white text-center">{formData.name}</h3>
                  <span className="text-xs text-slate-300 font-medium">{formData.nationality}</span>
                  
                  <div className="w-full border-t border-white/10 my-4"></div>
                  
                  <div className="w-full space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-350">Gender</span>
                      <span className="font-semibold text-slate-200">{formData.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-350">Age</span>
                      <span className="font-semibold text-slate-200">{formData.age ? `${formData.age} yrs` : "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-350">Status</span>
                      <span className="font-semibold text-slate-200">{formData.status}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                      <span className="text-slate-350">Salary (AED)</span>
                      <span className="font-bold text-teal-400">{formData.salary ? `${parseFloat(formData.salary).toLocaleString()} AED` : "N/A"}</span>
                    </div>
                  </div>
                </BorderGlow>

                {/* Right Side: Details Tabs / Content */}
                <div className="md:col-span-2 space-y-6">
                  {/* Tab Headers */}
                  <div className="flex border-b border-white/10">
                    <button
                      onClick={() => setActiveTab("personal")}
                      className={`pb-2.5 px-4 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
                        activeTab === "personal"
                          ? "border-teal-450 text-teal-300"
                          : "border-transparent text-slate-400 hover:text-white"
                      }`}
                    >
                      General Info
                    </button>
                    <button
                      onClick={() => setActiveTab("documents")}
                      className={`pb-2.5 px-4 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
                        activeTab === "documents"
                          ? "border-teal-450 text-teal-300"
                          : "border-transparent text-slate-400 hover:text-white"
                      }`}
                    >
                      Uploaded Documents
                    </button>
                  </div>

                  {/* Tab Details */}
                  {activeTab === "personal" && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-xs text-slate-350 font-semibold uppercase tracking-wider mb-1">Date of Birth</h4>
                          <p className="text-sm text-white bg-white/5 border border-white/10 p-2.5 rounded-lg font-sans">
                            {formData.dob || "N/A"}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs text-slate-350 font-semibold uppercase tracking-wider mb-1">Dubai Phone</h4>
                          <p className="text-sm text-white bg-white/5 border border-white/10 p-2.5 rounded-lg font-sans">
                            {formData.dubaiPhone || "N/A"}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs text-slate-355 font-semibold uppercase tracking-wider mb-1">Indian Phone</h4>
                          <p className="text-sm text-white bg-white/5 border border-white/10 p-2.5 rounded-lg font-sans">
                            {formData.indianPhone || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs text-slate-350 font-semibold uppercase tracking-wider mb-1">Indian Address</h4>
                        <p className="text-sm text-white bg-white/5 border border-white/10 p-3 rounded-lg font-sans leading-relaxed whitespace-pre-wrap">
                          {formData.address || "No Indian address recorded."}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs text-slate-350 font-semibold uppercase tracking-wider mb-1">Family & Dependents Details</h4>
                        <p className="text-sm text-white bg-white/5 border border-white/10 p-3 rounded-lg font-sans leading-relaxed whitespace-pre-wrap">
                          {formData.familyDetails || "No family details recorded."}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === "documents" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in">
                      {[
                        { label: "Profile Photo", key: "profilePic" },
                        { label: "Emirates ID", key: "emiratesId" },
                        { label: "Labour Card", key: "labourCard" },
                        { label: "Labour Contract", key: "labourContract" },
                        { label: "Medical Insurance", key: "medicalInsurance" },
                        { label: "Passport", key: "passport" },
                      ].map((doc) => {
                        const url = existingDocs[doc.key];
                        const expiryDateStr = formData[`expiry_${doc.key}`];
                        let expiryBadge = null;

                        if (doc.key !== "profilePic" && expiryDateStr) {
                          const expDate = new Date(expiryDateStr);
                          const now = new Date();
                          const diffMs = expDate - now;
                          const diffDays = diffMs / (1000 * 60 * 60 * 24);

                          if (diffDays < 0) {
                            expiryBadge = (
                              <span className="text-[10px] bg-red-950/70 text-red-300 border border-red-500/30 px-2 py-0.5 rounded font-semibold">
                                Expired
                              </span>
                            );
                          } else if (diffDays <= 30) {
                            expiryBadge = (
                              <span className="text-[10px] bg-amber-950/70 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-semibold">
                                Expires in {Math.ceil(diffDays)}d
                              </span>
                            );
                          } else {
                            expiryBadge = (
                              <span className="text-[10px] bg-teal-950/70 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded font-semibold">
                                Valid
                              </span>
                            );
                          }
                        }

                        const isPdf = url && (url.includes(".pdf") || url.startsWith("data:application/pdf"));

                        return (
                          <div key={doc.key} className="border border-white/10 rounded-xl p-3 bg-white/5 flex flex-col justify-between h-56">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-semibold text-slate-300 block">{doc.label}</span>
                              {expiryBadge}
                            </div>
                            
                            {url ? (
                              <div className="relative group bg-white/5 rounded-lg overflow-hidden flex-1 flex items-center justify-center border border-white/5">
                                {isPdf ? (
                                  <div className="flex flex-col items-center justify-center p-3 text-center text-teal-400">
                                    <FileText className="w-10 h-10 mb-1" />
                                    <span className="text-[10px] text-slate-350 font-mono truncate max-w-[120px]">PDF Document</span>
                                  </div>
                                ) : (
                                  <img
                                    src={url}
                                    alt={doc.label}
                                    className="w-full h-full object-cover zoomable-image"
                                    onClick={() => setLightboxImg({ url, label: doc.label })}
                                  />
                                )}
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  {!isPdf && (
                                    <button
                                      onClick={() => setLightboxImg({ url, label: doc.label })}
                                      className="p-1.5 bg-white/95 rounded-full text-slate-850 hover:bg-teal-600 hover:text-white transition-colors cursor-pointer"
                                      title="Zoom Document"
                                    >
                                      <ZoomIn className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => downloadDocument(url, doc.label)}
                                    className="p-1.5 bg-white/95 rounded-full text-slate-850 hover:bg-teal-600 hover:text-white transition-colors cursor-pointer"
                                    title="Download Document"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 bg-white/5 rounded-lg flex flex-col items-center justify-center border border-dashed border-white/10 text-slate-400">
                                <FileText className="w-6 h-6 text-slate-405 mb-1" />
                                <span className="text-[10px] text-slate-400">Not Uploaded</span>
                              </div>
                            )}

                            {doc.key !== "profilePic" && expiryDateStr && (
                              <div className="text-[10px] text-slate-350 font-mono mt-2 flex justify-between">
                                <span>Expiry:</span>
                                <span className="font-semibold text-slate-200">{expiryDateStr}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Edit Mode */}
            {mode === "update" && (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Basic Fields */}
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
                  className="p-4 space-y-4 text-white animate-fade-in"
                >
                  <h3 className="text-sm font-semibold text-teal-350 tracking-wide">Personal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">Employee Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full text-sm bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:bg-white/10 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">Nationality *</label>
                      <input
                        type="text"
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleInputChange}
                        className="w-full text-sm bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:bg-white/10 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">Age</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className="w-full text-sm bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:bg-white/10 transition-all"
                        min="18"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">Gender *</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full text-sm bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:bg-white/10 transition-all appearance-none"
                        required
                      >
                        <option value="" className="bg-slate-900 text-white">Select Gender</option>
                        <option value="Male" className="bg-slate-900 text-white">Male</option>
                        <option value="Female" className="bg-slate-900 text-white">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">Dubai Phone (UAE)</label>
                      <input
                        type="tel"
                        name="dubaiPhone"
                        value={formData.dubaiPhone}
                        onChange={handleInputChange}
                        placeholder="+971 5X XXX XXXX"
                        className="w-full text-sm bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:bg-white/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">Indian Phone</label>
                      <input
                        type="tel"
                        name="indianPhone"
                        value={formData.indianPhone}
                        onChange={handleInputChange}
                        placeholder="+91 XXXXXXXXXX"
                        className="w-full text-sm bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:bg-white/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        className="w-full text-sm bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:bg-white/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">Marital Status *</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full text-sm bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:bg-white/10 transition-all appearance-none"
                        required
                      >
                        <option value="" className="bg-slate-900 text-white">Select Status</option>
                        <option value="Single" className="bg-slate-900 text-white">Single</option>
                        <option value="Married" className="bg-slate-900 text-white">Married</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">Family & Dependents Details</label>
                    <textarea
                      name="familyDetails"
                      value={formData.familyDetails}
                      onChange={handleInputChange}
                      className="w-full text-sm bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:bg-white/10 transition-all h-20"
                      placeholder="Add info about spouse, children, parents, dependents etc..."
                    />
                  </div>
                </BorderGlow>

                {/* Salary details */}
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
                  className="p-4 space-y-4 text-white"
                >
                  <h3 className="text-sm font-semibold text-teal-350 tracking-wide">Employment & Salary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">Salary Number (Unique Required) *</label>
                      <input
                        type="text"
                        name="salaryNo"
                        value={formData.salaryNo}
                        onChange={handleInputChange}
                        className="w-full text-sm bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:bg-white/10 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">Salary (Dirham AED)</label>
                      <input
                        type="number"
                        name="salary"
                        value={formData.salary}
                        onChange={handleInputChange}
                        className="w-full text-sm bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:bg-white/10 transition-all"
                        placeholder="e.g. 5000"
                      />
                    </div>
                  </div>
                </BorderGlow>

                {/* Address info */}
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
                  className="p-4 space-y-4 text-white"
                >
                  <h3 className="text-sm font-semibold text-teal-350 tracking-wide">Address Information</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">Indian Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full text-sm bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:bg-white/10 transition-all h-20"
                      placeholder="Enter details of permanent home address in India..."
                    />
                  </div>
                </BorderGlow>

                {/* Replace Uploads section */}
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
                  className="p-4 space-y-4 text-white"
                >
                  <h3 className="text-sm font-semibold text-teal-350 tracking-wide">Replace Documents (Optional)</h3>
                  <p className="text-[11px] text-slate-300 -mt-2">Only select files if you wish to overwrite the current documents. Max size: 5MB (JPG, JPEG, PNG, PDF)</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {[
                      { label: "Profile Photo", key: "profilePic" },
                      { label: "Emirates ID", key: "emiratesId" },
                      { label: "Labour Card", key: "labourCard" },
                      { label: "Labour Contract", key: "labourContract" },
                      { label: "Medical Insurance", key: "medicalInsurance" },
                      { label: "Passport", key: "passport" },
                    ].map((doc) => {
                      const isNewPdf = previews[doc.key] && (typeof previews[doc.key] === "string" && !previews[doc.key].startsWith('data:image') && previews[doc.key].includes('.pdf'));
                      const isOldPdf = !previews[doc.key] && existingDocs[doc.key] && (existingDocs[doc.key].includes('.pdf') || existingDocs[doc.key].startsWith('data:application/pdf'));

                      return (
                        <div key={doc.key} className="border border-white/10 rounded-lg p-3 bg-white/5 flex flex-col justify-between h-56 text-white">
                          <span className="text-[11px] font-semibold text-slate-355 truncate">{doc.label}</span>
                          
                          {/* Preview new, otherwise show old thumbnail */}
                          <div className="relative group bg-white/5 rounded-md overflow-hidden flex-1 my-2 border border-white/10 flex items-center justify-center">
                            {previews[doc.key] ? (
                              isNewPdf ? (
                                <div className="flex flex-col items-center justify-center p-2 text-center text-teal-400">
                                  <FileText className="w-6 h-6 mb-1" />
                                  <span className="text-[10px] text-slate-300 font-mono truncate max-w-[80px]">{previews[doc.key]}</span>
                                </div>
                              ) : (
                                <img src={previews[doc.key]} alt="New preview" className="w-full h-full object-cover" />
                              )
                            ) : existingDocs[doc.key] ? (
                              <div className="relative w-full h-full flex items-center justify-center">
                                {isOldPdf ? (
                                  <div className="flex flex-col items-center justify-center p-2 text-center text-teal-400">
                                    <FileText className="w-6 h-6 mb-1" />
                                    <span className="text-[10px] text-slate-300 font-mono truncate max-w-[80px]">PDF Doc</span>
                                  </div>
                                ) : (
                                  <img src={existingDocs[doc.key]} alt="Existing document" className="w-full h-full object-cover opacity-80" />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10">
                                  <span className="text-[9px] bg-slate-800/90 text-white px-1.5 py-0.5 rounded-sm font-medium">Current</span>
                                </div>
                              </div>
                            ) : (
                              <FileText className="w-5 h-5 text-slate-400" />
                            )}
                          </div>

                          <label className="flex items-center justify-center gap-1 bg-teal-500/20 border border-teal-500/30 hover:bg-teal-500/40 hover:border-teal-500/50 text-white text-[10px] font-semibold py-1 rounded-md cursor-pointer transition-colors shadow-2xs">
                            <Upload className="w-3 h-3" />
                            Upload
                            <input
                              type="file"
                              name={doc.key}
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>

                          {doc.key !== "profilePic" && (
                            <input
                              type="date"
                              name={`expiry_${doc.key}`}
                              value={formData[`expiry_${doc.key}`] || ""}
                              onChange={handleInputChange}
                              className="mt-1 w-full text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px]"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </BorderGlow>

                {/* Footer Controls */}
                <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-white/10 rounded-lg text-slate-300 hover:bg-white/5 text-sm font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Saving Updates...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Employee Changes
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>
        )}
      </BorderGlow>

      {/* Lightbox Modal overlay for images */}
      {lightboxImg && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 flex flex-col justify-center items-center p-4">
          <div className="absolute top-4 right-4 flex gap-4">
            <button
              onClick={() => downloadDocument(lightboxImg.url, lightboxImg.label)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
              title="Download Original"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setLightboxImg(null)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
              title="Close Zoom"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="max-w-[85vw] max-h-[80vh] overflow-hidden flex items-center justify-center">
            <img
              src={lightboxImg.url}
              alt={lightboxImg.label}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/10 animate-fade-in"
            />
          </div>
          <span className="text-white text-sm mt-4 font-semibold tracking-wide bg-slate-800/80 px-4 py-1.5 rounded-full">
            {lightboxImg.label}
          </span>
        </div>
      )}

    </div>
  );
};

export default EmployeeModal;
