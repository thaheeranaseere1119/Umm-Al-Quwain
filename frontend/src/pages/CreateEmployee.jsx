import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, DollarSign, MapPin, Upload, FileText, CheckCircle, RefreshCw, Trash2 } from "lucide-react";
import { createEmployee } from "../services/employeeService";
import BorderGlow from "../components/BorderGlow";

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

const CreateEmployee = () => {
  const navigate = useNavigate();

  // Form inputs
  const [formData, setFormData] = useState({
    name: "",
    nationality: "",
    status: "",
    gender: "",
    dob: "",
    dubaiPhone: "",
    indianPhone: "",
    age: "",
    familyDetails: "",
    salaryNo: "",
    salary: "",
    address: "",
    expiry_emiratesId: "",
    expiry_labourCard: "",
    expiry_medicalInsurance: "",
    expiry_passport: "",
    expiry_labourContract: "",
  });

  // Files state
  const [files, setFiles] = useState({
    profilePic: null,
    emiratesId: null,
    labourCard: null,
    labourContract: null,
    medicalInsurance: null,
    passport: null,
  });

  // Previews
  const [previews, setPreviews] = useState({
    profilePic: null,
    emiratesId: null,
    labourCard: null,
    labourContract: null,
    medicalInsurance: null,
    passport: null,
  });

  // Upload/Save progress state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      const file = selectedFiles[0];

      // Format validation
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(file.mimetype || file.type)) {
        alert("Invalid file format. Only JPG, JPEG, PNG, and PDF are allowed.");
        return;
      }

      // Size validation
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds the 5MB limit.");
        return;
      }

      setFiles((prev) => ({ ...prev, [name]: file }));

      // Preview for images only; for PDFs show filename
      if (file.type === "application/pdf") {
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

  const handleRemoveFile = (key) => {
    setFiles((prev) => ({ ...prev, [key]: null }));
    setPreviews((prev) => ({ ...prev, [key]: null }));
  };

  const handleClearForm = () => {
    setFormData({
      name: "",
      nationality: "",
      status: "",
      gender: "",
      dob: "",
      dubaiPhone: "",
      indianPhone: "",
      age: "",
      familyDetails: "",
      salaryNo: "",
      salary: "",
      address: "",
      expiry_emiratesId: "",
      expiry_labourCard: "",
      expiry_medicalInsurance: "",
      expiry_passport: "",
      expiry_labourContract: "",
    });
    setFiles({
      profilePic: null,
      emiratesId: null,
      labourCard: null,
      labourContract: null,
      medicalInsurance: null,
      passport: null,
    });
    setPreviews({
      profilePic: null,
      emiratesId: null,
      labourCard: null,
      labourContract: null,
      medicalInsurance: null,
      passport: null,
    });
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Form validations
    if (!formData.name.trim()) return setErrorMessage("Employee Name is required.");
    if (!formData.nationality.trim()) return setErrorMessage("Nationality is required.");
    // DOB is optional; no validation needed
// Dubai Phone number is optional (no validation)
// Indian Phone number is optional (no validation)
    if (!formData.status) return setErrorMessage("Marital Status selection is required.");
    if (!formData.gender) return setErrorMessage("Gender selection is required.");
    if (!formData.salaryNo.trim()) return setErrorMessage("Salary Number is required.");

    // Check if all required documents are uploaded (Profile Photo, Emirates ID, Labour Card, Labour Contract, Medical Insurance, Passport)
    if (!files.profilePic || !files.emiratesId || !files.labourCard || !files.labourContract || !files.medicalInsurance || !files.passport) {
      return setErrorMessage("Please upload all required documents (Profile Photo, Emirates ID, Labour Card, Labour Contract, Medical Insurance, and Passport).");
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      await createEmployee(formData, files, (progress) => {
        setUploadProgress(progress);
      });
      
      setSuccessMessage("Employee registered successfully!");
      setUploadProgress(100);
      
      setTimeout(() => {
        handleClearForm();
        navigate("/");
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Failed to register employee.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-16 font-sans text-white">
      
      {/* Navbar Header */}
      <header className="bg-teal-950/40 backdrop-blur-md border-b border-teal-500/20 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white hover:text-teal-100 font-semibold text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <span className="font-bold tracking-wide font-serif text-sm">Register Staff</span>
          <div className="w-8"></div> {/* Spacer */}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 mt-8">
        
        {/* Page Banner */}
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
          className="p-6 shadow-lg mb-8 flex items-center justify-between text-white"
        >
          <div>
            <h1 className="text-xl font-bold text-white font-serif">Create Employee</h1>
            <p className="text-xs text-slate-300 mt-0.5">Fill out all personal records and upload required documents.</p>
          </div>
        </BorderGlow>

        {errorMessage && (
          <div className="bg-red-950/40 border border-red-900/50 text-red-300 text-xs font-semibold p-4 rounded-xl mb-6 flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-xs font-semibold p-4 rounded-xl mb-6 flex items-center gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Personal Details */}
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
            className="p-6 shadow-lg space-y-4 text-white"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-teal-300">
              <User className="w-4 h-4 text-teal-400" />
              <h3 className="font-bold text-sm tracking-wide uppercase">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Employee Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full text-white bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:bg-white/10 focus:ring-1 focus:ring-teal-500/20 transition-all"
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
                  placeholder="e.g. Indian"
                  className="w-full text-white bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:bg-white/10 focus:ring-1 focus:ring-teal-500/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Marital Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full text-white bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:bg-white/10 focus:ring-1 focus:ring-teal-500/20 transition-all appearance-none"
                  required
                >
                  <option value="" className="bg-slate-900 text-white">Select Status</option>
                  <option value="Single" className="bg-slate-900 text-white">Single</option>
                  <option value="Married" className="bg-slate-900 text-white">Married</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full text-white bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:bg-white/10 focus:ring-1 focus:ring-teal-500/20 transition-all appearance-none"
                  required
                >
                  <option value="" className="bg-slate-900 text-white">Select Gender</option>
                  <option value="Male" className="bg-slate-900 text-white">Male</option>
                  <option value="Female" className="bg-slate-900 text-white">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="e.g. 28"
                  className="w-full text-white bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:bg-white/10 focus:ring-1 focus:ring-teal-500/20 transition-all"
                  min="18"
                  max="100"
                />
              </div>

              {/* DOB field */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="w-full text-white bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:bg-white/10 focus:ring-1 focus:ring-teal-500/20 transition-all"
                />
              </div>
            {/* Mobile Numbers (Optional) */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label className="block text-xs font-semibold text-slate-200 mb-1">UAE Mobile (optional)</label>
    <input
      type="text"
      name="dubaiPhone"
      value={formData.dubaiPhone}
      onChange={handleInputChange}
      placeholder="e.g. +971 50 1234567"
      className="w-full text-white bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:bg-white/10 focus:ring-1 focus:ring-teal-500/20 transition-all"
    />
  </div>
  <div>
    <label className="block text-xs font-semibold text-slate-200 mb-1">Indian Mobile (optional)</label>
    <input
      type="text"
      name="indianPhone"
      value={formData.indianPhone}
      onChange={handleInputChange}
      placeholder="e.g. +91 98765 43210"
      className="w-full text-white bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:bg-white/10 focus:ring-1 focus:ring-teal-500/20 transition-all"
    />
  </div>
</div>
</div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">Family Details</label>
              <textarea
                name="familyDetails"
                value={formData.familyDetails}
                onChange={handleInputChange}
                placeholder="Spouse details, children count, emergency contacts etc..."
                className="w-full text-white bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:bg-white/10 transition-all h-20"
              />
            </div>
          </BorderGlow>

          {/* Section 2: Employment & Salary */}
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
            className="p-6 shadow-lg space-y-4 text-white"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-teal-300">
              <DollarSign className="w-4 h-4 text-teal-400" />
              <h3 className="font-bold text-sm tracking-wide uppercase">Employment Info</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Salary Number *</label>
                <input
                  type="text"
                  name="salaryNo"
                  value={formData.salaryNo}
                  onChange={handleInputChange}
                  placeholder="Unique ID e.g. UAQ-1002"
                  className="w-full text-white bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:bg-white/10 focus:ring-1 focus:ring-teal-500/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Salary (Dirham AED)</label>
                <input
                  type="text"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  placeholder="e.g. 6500.00"
                  className="w-full text-white bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:bg-white/10 focus:ring-1 focus:ring-teal-500/20 transition-all"
                />
              </div>
            </div>
          </BorderGlow>

          {/* Section 3: Indian Address */}
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
            className="p-6 shadow-lg space-y-4 text-white"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-teal-300">
              <MapPin className="w-4 h-4 text-teal-400" />
              <h3 className="font-bold text-sm tracking-wide uppercase">Address Information</h3>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">Indian Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Full permanent address in India..."
                className="w-full text-white bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:bg-white/10 transition-all h-20"
              />
            </div>
          </BorderGlow>

          {/* Section 4: Required Document Uploads */}
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
            className="p-6 shadow-lg space-y-4 text-white"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2 text-teal-300">
                <Upload className="w-4 h-4 text-teal-400" />
                <h3 className="font-bold text-sm tracking-wide uppercase">Required Document Uploads</h3>
              </div>
              <span className="text-[10px] text-slate-300 font-semibold bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">JPG, PNG, PDF • Max 5MB</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
  { label: "Profile Photo *", key: "profilePic" },
  { label: "Emirates ID *", key: "emiratesId" },
  { label: "Labour Card *", key: "labourCard" },
  { label: "Labour Contract *", key: "labourContract" },
  { label: "Medical Insurance *", key: "medicalInsurance" },
  { label: "Passport *", key: "passport" },
].map((doc) => (
                <div key={doc.key} className="border border-white/10 rounded-lg p-3 flex flex-col justify-between h-44 bg-white/5 text-white">
                  <span className="text-[11px] font-semibold text-slate-300 truncate">{doc.label}</span>
                  
                  {/* Image Preview Box */}
                  <div className="relative group bg-white/5 rounded-md overflow-hidden flex-1 my-2 border border-white/10 flex items-center justify-center">
                    {previews[doc.key] ? (
                      typeof previews[doc.key] === "string" && previews[doc.key].startsWith('data:image') ? (
                        <>
                          <img src={previews[doc.key]} alt={doc.label} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(doc.key)}
                            className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-300 truncate p-2">{previews[doc.key]}</span>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center p-2 text-center text-[10px] text-slate-400">
                        <FileText className="w-5 h-5 text-slate-450 mb-1" />
                        <span>Empty</span>
                      </div>
                    )}
                  </div>

                  <label className="flex items-center justify-center gap-1 bg-teal-500/20 border border-teal-500/30 hover:bg-teal-500/40 hover:border-teal-500/50 text-white text-[10px] font-semibold py-1 rounded-md cursor-pointer transition-colors shadow-2xs">
                    <Upload className="w-3 h-3" />
                    Select File
                    <input
                      type="file"
                      name={doc.key}
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      required={!files[doc.key]}
                    />
                  </label>
                  {/* Expiry date input for non-profile docs */}
                  {doc.key !== "profilePic" && (
                    <input type="date" name={`expiry_${doc.key}`} value={formData[`expiry_${doc.key}`] || ''} onChange={handleInputChange} className="mt-1 w-full text-white bg-white/5 border border-white/10 px-2 py-1 rounded text-xs" />
                  )}
                </div>
              ))}
            </div>
          </BorderGlow>

          {/* Progress Indicator */}
          {isSubmitting && (
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
              className="p-5 shadow-lg space-y-2 text-white"
            >
              <div className="flex justify-between text-xs font-semibold text-slate-350">
                <span>Uploading files & saving employee data...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </BorderGlow>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClearForm}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-white/10 hover:bg-white/5 rounded-xl text-slate-300 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              Clear Form
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving Employee...
                </>
              ) : (
                "Save Employee"
              )}
            </button>
          </div>

        </form>

      </main>
    </div>
  );
};

export default CreateEmployee;
