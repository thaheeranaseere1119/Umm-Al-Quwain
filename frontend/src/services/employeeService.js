import { db, storage } from "../config/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

// Toggle this flag to switch between Direct Firebase Mode and Local Express Server Mode
export const USE_FIREBASE = false;

// Connection timeout helper
const withTimeout = (promise, ms = 6000, context = "Firebase operation") => {
  const timeout = new Promise((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            `Timeout: ${context} failed to respond within ${ms / 1000} seconds. Please verify that Cloud Firestore and Storage are enabled in your Firebase console and that security rules allow read/write access.`
          )
        ),
      ms
    )
  );
  return Promise.race([promise, timeout]);
};

// Helper to compress an image file and convert it to a Base64 data URL (safely fits under 1MB Firestore limit)
const compressImageToBase64 = (file, maxW = 800, maxH = 800, quality = 0.6) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const result = event.target.result;
      // If PDF, bypass canvas compression and return raw base64 data URL
      if (file.type === "application/pdf" || (file.name && file.name.toLowerCase().endsWith(".pdf"))) {
        resolve(result);
        return;
      }
      const img = new Image();
      img.src = result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while resizing
        if (width > height) {
          if (width > maxW) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          }
        } else {
          if (height > maxH) {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Export as compressed JPEG
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => {
        // Fallback: if image loading fails, resolve with raw Base64
        resolve(result);
      };
    };
    reader.onerror = (err) => reject(err);
  });
};

// Helper: Convert Base64 data URL back to Blob
const dataURLtoBlob = (dataurl) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

// Helper: Compress all image files in the select files list
const getCompressedFiles = async (files) => {
  const compressed = {};
  const keys = Object.keys(files);
  for (const key of keys) {
    const file = files[key];
    if (!file) {
      compressed[key] = null;
      continue;
    }
    
    // Skip compression for PDFs
    if (file.type === "application/pdf" || (file.name && file.name.toLowerCase().endsWith(".pdf"))) {
      compressed[key] = file;
    } else {
      try {
        // Compress to max 800x800 JPEG with 0.6 quality (creates a ~100KB file)
        const base64 = await compressImageToBase64(file, 800, 800, 0.6);
        const blob = dataURLtoBlob(base64);
        compressed[key] = new File([blob], file.name, { type: file.type });
      } catch (err) {
        console.error("Client-side compression failed for:", key, err);
        compressed[key] = file; // Fallback to original file if compression fails
      }
    }
  }
  return compressed;
};

// GET Expiring Documents
export const getExpiringDocuments = async () => {
  const res = await fetch('/api/employees/expiring');
  if (!res.ok) throw new Error('Failed to fetch expiring documents');
  return await res.json();
};

// Helper to delete an item from Firebase Storage
const deleteFileFromFirebase = async (url) => {
  if (!url || !url.includes("firebasestorage.googleapis.com") || url.includes("mock_doc")) return;
  try {
    const decodedUrl = decodeURIComponent(url);
    const startIdx = decodedUrl.indexOf("/o/") + 3;
    const endIdx = decodedUrl.indexOf("?alt=media");
    const filePath = decodedUrl.substring(startIdx, endIdx);
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (err) {
    console.error("Error deleting from Firebase Storage:", err.message);
  }
};

// GET Employees
export const getEmployees = async () => {
  if (!USE_FIREBASE) {
    const res = await fetch("/api/employees");
    if (!res.ok) throw new Error("Failed to fetch employees");
    const serverEmployees = await res.json();

    // Check if server is running in local fallback and is empty, but we have cached employees
    const cachedData = localStorage.getItem("ummal_quwain_employees");
    const cachedEmployees = cachedData ? JSON.parse(cachedData) : [];

    if (serverEmployees.length === 0 && cachedEmployees.length > 0) {
      console.log("⚠️ Vercel database was reset. Restoring from localStorage...");
      try {
        const restoreRes = await fetch("/api/employees/restore", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ employees: cachedEmployees }),
        });
        if (restoreRes.ok) {
          console.log("✅ Vercel database restored successfully.");
          return cachedEmployees;
        }
      } catch (err) {
        console.error("Failed to restore backend database from localStorage:", err);
      }
    }

    // Keep cache updated
    localStorage.setItem("ummal_quwain_employees", JSON.stringify(serverEmployees));
    return serverEmployees;
  }

  try {
    const querySnapshot = await withTimeout(
      getDocs(collection(db, "employees")),
      6000,
      "Fetching employees list"
    );
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Firebase getEmployees error:", error);
    throw error;
  }
};

// GET Employee By ID
export const getEmployeeById = async (id) => {
  if (!USE_FIREBASE) {
    const res = await fetch(`/api/employees/${id}`);
    if (!res.ok) throw new Error("Employee not found");
    return await res.json();
  }

  try {
    const docRef = doc(db, "employees", id);
    const docSnap = await withTimeout(
      getDoc(docRef),
      6000,
      "Fetching employee detail"
    );
    if (!docSnap.exists()) {
      throw new Error("Employee record not found in Firestore.");
    }
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error("Firebase getEmployeeById error:", error);
    throw error;
  }
};

// CREATE Employee
export const createEmployee = async (employeeData, files, onProgressCallback) => {
  if (!USE_FIREBASE) {
    const compressedFiles = await getCompressedFiles(files);
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      Object.keys(employeeData).forEach((key) => {
        formData.append(key, employeeData[key]);
      });
      Object.keys(compressedFiles).forEach((key) => {
        if (compressedFiles[key]) formData.append(key, compressedFiles[key]);
      });

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/employees");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgressCallback) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onProgressCallback(percentage);
        }
      };

      xhr.onload = () => {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const cachedData = localStorage.getItem("ummal_quwain_employees");
            const cached = cachedData ? JSON.parse(cachedData) : [];
            if (response.employee) {
              cached.push(response.employee);
              localStorage.setItem("ummal_quwain_employees", JSON.stringify(cached));
            }
          } catch (err) {
            console.error("Failed to sync new employee to localStorage:", err);
          }
          resolve(response);
        } else {
          reject(new Error(response.message || "Failed to create employee"));
        }
      };

      xhr.onerror = () => reject(new Error("Connection error during upload."));
      xhr.send(formData);
    });
  }

  try {
    // 1. Verify Unique Salary Number
    const q = query(
      collection(db, "employees"),
      where("salaryNo", "==", employeeData.salaryNo)
    );
    const querySnapshot = await withTimeout(
      getDocs(q),
      6000,
      "Checking salary number uniqueness"
    );
    if (!querySnapshot.empty) {
      throw new Error(`Salary Number '${employeeData.salaryNo}' is already registered.`);
    }

    // 2. Upload files & compile URLs
    const docUrls = {
      profilePic: null,
      emiratesId: null,
      labourCard: null,
      medicalInsurance: null,
      passport: null,
      labourContract: null,
    };

    const fileKeys = ["profilePic", "emiratesId", "labourCard", "medicalInsurance", "passport", "labourContract"];
    const fileCount = fileKeys.filter((k) => files[k]).length;
    let completedCount = 0;

    const uploadPromises = fileKeys.map(async (key) => {
      const file = files[key];
      if (!file) return;

      // Convert and compress to Base64
      docUrls[key] = await withTimeout(
        compressImageToBase64(file),
        25000,
        `Compressing and converting ${key}`
      );
      completedCount++;
      const currentProgress = Math.min(Math.round((completedCount / fileCount) * 99), 99);
      if (onProgressCallback) onProgressCallback(currentProgress);
    });

    await Promise.all(uploadPromises);

    // 3. Save details to Firestore
    const {
      expiry_emiratesId,
      expiry_labourCard,
      expiry_medicalInsurance,
      expiry_passport,
      expiry_labourContract,
      ...cleanedEmployeeData
    } = employeeData;

    const documentExpiry = {
      emiratesId: expiry_emiratesId || "",
      labourCard: expiry_labourCard || "",
      medicalInsurance: expiry_medicalInsurance || "",
      passport: expiry_passport || "",
      labourContract: expiry_labourContract || "",
    };

    const finalData = {
      ...cleanedEmployeeData,
      age: cleanedEmployeeData.age ? parseInt(cleanedEmployeeData.age) : null,
      salary: cleanedEmployeeData.salary || null,
      documentExpiry,
      documents: docUrls,
      createdAt: new Date().toISOString(),
    };

    const docRef = await withTimeout(
      addDoc(collection(db, "employees"), finalData),
      6000,
      "Saving employee profile"
    );
    
    if (onProgressCallback) onProgressCallback(100);
    return { id: docRef.id, ...finalData };
  } catch (error) {
    console.error("Firebase createEmployee error:", error);
    throw error;
  }
};

// UPDATE Employee
export const updateEmployee = async (id, employeeData, files, existingDocs, onProgressCallback) => {
  if (!USE_FIREBASE) {
    const compressedFiles = await getCompressedFiles(files);
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      Object.keys(employeeData).forEach((key) => {
        formData.append(key, employeeData[key]);
      });
      Object.keys(compressedFiles).forEach((key) => {
        if (compressedFiles[key]) formData.append(key, compressedFiles[key]);
      });

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", `/api/employees/${id}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgressCallback) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onProgressCallback(percentage);
        }
      };

      xhr.onload = () => {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const cachedData = localStorage.getItem("ummal_quwain_employees");
            const cached = cachedData ? JSON.parse(cachedData) : [];
            const index = cached.findIndex(emp => emp.id === id);
            if (index !== -1 && response.employee) {
              cached[index] = response.employee;
              localStorage.setItem("ummal_quwain_employees", JSON.stringify(cached));
            }
          } catch (err) {
            console.error("Failed to sync updated employee to localStorage:", err);
          }
          resolve(response);
        } else {
          reject(new Error(response.message || "Failed to update employee"));
        }
      };

      xhr.onerror = () => reject(new Error("Connection error during upload."));
      xhr.send(formData);
    });
  }

  try {
    // 1. Verify Unique Salary Number (if it has been changed)
    const currentDoc = await withTimeout(
      getDoc(doc(db, "employees", id)),
      6000,
      "Retrieving current profile"
    );
    if (!currentDoc.exists()) {
      throw new Error("Employee record not found.");
    }
    const currentData = currentDoc.data();

    if (employeeData.salaryNo && employeeData.salaryNo !== currentData.salaryNo) {
      const q = query(
        collection(db, "employees"),
        where("salaryNo", "==", employeeData.salaryNo)
      );
      const querySnapshot = await withTimeout(
        getDocs(q),
        6000,
        "Checking salary number uniqueness"
      );
      if (!querySnapshot.empty) {
        throw new Error(`Salary Number '${employeeData.salaryNo}' is already taken.`);
      }
    }

    // 2. Upload replacement files
    const updatedDocs = { ...existingDocs };
    const fileKeys = ["profilePic", "emiratesId", "labourCard", "medicalInsurance", "passport", "labourContract"];
    const filesToUpload = fileKeys.filter((k) => files[k]);
    const fileCount = filesToUpload.length;
    let completedCount = 0;

    const uploadPromises = filesToUpload.map(async (key) => {
      const file = files[key];
      
      // Delete old file first if it exists as a Firebase Storage URL
      if (existingDocs[key] && existingDocs[key].includes("firebasestorage.googleapis.com")) {
        await deleteFileFromFirebase(existingDocs[key]);
      }

      // Convert and compress to Base64
      updatedDocs[key] = await withTimeout(
        compressImageToBase64(file),
        25000,
        `Compressing and converting ${key}`
      );
      completedCount++;
      const currentProgress = Math.min(Math.round((completedCount / fileCount) * 99), 99);
      if (onProgressCallback) onProgressCallback(currentProgress);
    });

    if (fileCount > 0) {
      await Promise.all(uploadPromises);
    }

    // 3. Update Firestore metadata
    const {
      expiry_emiratesId,
      expiry_labourCard,
      expiry_medicalInsurance,
      expiry_passport,
      expiry_labourContract,
      ...cleanedEmployeeData
    } = employeeData;

    const documentExpiry = {
      emiratesId: expiry_emiratesId !== undefined ? expiry_emiratesId : (currentData.documentExpiry?.emiratesId || ""),
      labourCard: expiry_labourCard !== undefined ? expiry_labourCard : (currentData.documentExpiry?.labourCard || ""),
      medicalInsurance: expiry_medicalInsurance !== undefined ? expiry_medicalInsurance : (currentData.documentExpiry?.medicalInsurance || ""),
      passport: expiry_passport !== undefined ? expiry_passport : (currentData.documentExpiry?.passport || ""),
      labourContract: expiry_labourContract !== undefined ? expiry_labourContract : (currentData.documentExpiry?.labourContract || ""),
    };

    const finalData = {
      ...cleanedEmployeeData,
      age: cleanedEmployeeData.age ? parseInt(cleanedEmployeeData.age) : null,
      salary: cleanedEmployeeData.salary !== undefined ? cleanedEmployeeData.salary : null,
      documentExpiry,
      documents: updatedDocs,
      updatedAt: new Date().toISOString(),
    };

    const docRef = doc(db, "employees", id);
    await withTimeout(
      updateDoc(docRef, finalData),
      6000,
      "Updating employee profile"
    );
    
    if (onProgressCallback) onProgressCallback(100);
    return { id, ...finalData };
  } catch (error) {
    console.error("Firebase updateEmployee error:", error);
    throw error;
  }
};

// DELETE Employee
export const deleteEmployee = async (employee) => {
  if (!USE_FIREBASE) {
    const res = await fetch(`/api/employees/${employee.id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete employee");
    const response = await res.json();
    try {
      const cachedData = localStorage.getItem("ummal_quwain_employees");
      const cached = cachedData ? JSON.parse(cachedData) : [];
      const filtered = cached.filter(emp => emp.id !== employee.id);
      localStorage.setItem("ummal_quwain_employees", JSON.stringify(filtered));
    } catch (err) {
      console.error("Failed to sync deleted employee to localStorage:", err);
    }
    return response;
  }

  try {
    // 1. Delete associated Storage documents
    if (employee.documents) {
      await deleteFileFromFirebase(employee.documents.profilePic);
      await deleteFileFromFirebase(employee.documents.emiratesId);
      await deleteFileFromFirebase(employee.documents.labourCard);
      await deleteFileFromFirebase(employee.documents.medicalInsurance);
      await deleteFileFromFirebase(employee.documents.passport);
      await deleteFileFromFirebase(employee.documents.labourContract);
    }

    // 2. Delete Firestore record
    const docRef = doc(db, "employees", employee.id);
    await withTimeout(
      deleteDoc(docRef),
      6000,
      "Deleting employee record"
    );
    return { success: true };
  } catch (error) {
    console.error("Firebase deleteEmployee error:", error);
    throw error;
  }
};

// GET Stats
export const getStats = async () => {
  if (!USE_FIREBASE) {
    const res = await fetch("/api/employees/stats");
    if (!res.ok) throw new Error("Failed to fetch statistics");
    return await res.json();
  }

  try {
    const employees = await getEmployees();
    const total = employees.length;
    const male = employees.filter((emp) => emp.gender === "Male").length;
    const female = employees.filter((emp) => emp.gender === "Female").length;
    const married = employees.filter((emp) => emp.status === "Married").length;
    const single = employees.filter((emp) => emp.status === "Single").length;

    return {
      total,
      male,
      female,
      married,
      single,
    };
  } catch (error) {
    console.error("Firebase getStats error:", error);
    throw error;
  }
};
