import fs from "fs";
import path from "path";
import { db, bucket, useLocalFallback, localDb, uploadsDir } from "../config/firebase.js";

let isBucketAvailable = true;

// Helper to upload a single file (to Firebase Storage or keep local)
const handleFileUpload = async (file, salaryNo, docType, serverUrl) => {
  if (!file) return null;
  
  const ext = path.extname(file.originalname);
  const destination = `employees/${salaryNo}/${docType}_${Date.now()}${ext}`;

  if (useLocalFallback || !isBucketAvailable) {
    // On Vercel, local storage is ephemeral. Convert to Base64 data URL for database persistence.
    if (process.env.VERCEL) {
      try {
        const fileBuffer = fs.readFileSync(file.path);
        const base64Data = fileBuffer.toString("base64");
        const dataUrl = `data:${file.mimetype};base64,${base64Data}`;
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return dataUrl;
      } catch (err) {
        console.error("Base64 conversion failed on Vercel fallback:", err.message);
      }
    }

    // Keep local, return local server URL
    // Rename file to a predictable name in the uploads directory
    const localFileName = `${salaryNo}_${docType}_${Date.now()}${ext}`;
    const newPath = path.join(uploadsDir, localFileName);
    fs.renameSync(file.path, newPath);
    return `${serverUrl}/uploads/${localFileName}`;
  } else {
    // Upload to Firebase Storage with a strict 4-second timeout to prevent serverless function hangs
    try {
      const uploadPromise = (async () => {
        const [uploadedFile] = await bucket.upload(file.path, {
          destination: destination,
          metadata: {
            contentType: file.mimetype,
          },
        });
        await uploadedFile.makePublic();
        return uploadedFile;
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firebase Storage upload timed out (4s)")), 4000)
      );

      await Promise.race([uploadPromise, timeoutPromise]);
      
      // Delete temporary local file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      // Return the public URL
      return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media`;
    } catch (error) {
      console.error(`Firebase upload failed or timed out for ${docType}:`, error.message);
      if (error.message.includes("bucket") || error.code === 404 || error.message.includes("404") || error.message.includes("not found") || error.message.includes("timed out")) {
        console.warn("Setting isBucketAvailable to false to bypass future bucket uploads.");
        isBucketAvailable = false;
      }

      // On Vercel, local storage is ephemeral. Convert to Base64 data URL for database persistence.
      if (process.env.VERCEL) {
        try {
          const fileBuffer = fs.readFileSync(file.path);
          const base64Data = fileBuffer.toString("base64");
          const dataUrl = `data:${file.mimetype};base64,${base64Data}`;
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          return dataUrl;
        } catch (err) {
          console.error("Base64 conversion failed on Vercel fallback after upload failure:", err.message);
        }
      }

      // Fallback: if Firebase upload fails, save locally
      const localFileName = `${salaryNo}_${docType}_${Date.now()}${ext}`;
      const newPath = path.join(uploadsDir, localFileName);
      fs.renameSync(file.path, newPath);
      return `${serverUrl}/uploads/${localFileName}`;
    }
  }
};

// Helper to delete an image file (either locally or from Firebase Storage)
const handleFileDelete = async (url) => {
  if (typeof url !== "string") return;

  if (url.includes("/uploads/")) {
    // Local delete
    const filename = url.split("/uploads/")[1];
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete local file:", err.message);
      }
    }
  } else if (url.includes("firebasestorage.googleapis.com")) {
    if (!isBucketAvailable) {
      console.warn("Skipping GCS file delete because bucket is marked unavailable.");
      return;
    }
    // Firebase Storage delete
    try {
      // Extract file path from URL
      const decodedUrl = decodeURIComponent(url);
      const matches = decodedUrl.match(/\/o\/(.+?)\?/);
      if (matches && matches[1]) {
        const filePath = matches[1];
        await bucket.file(filePath).delete();
      }
    } catch (err) {
      console.error("Failed to delete Firebase Storage file:", err.message);
      if (err.message.includes("bucket") || err.code === 404 || err.message.includes("404") || err.message.includes("not found")) {
        console.warn("Setting isBucketAvailable to false to bypass future bucket deletions.");
        isBucketAvailable = false;
      }
    }
  }
};

// GET /api/employees - Fetch employees with search and filters
export const getEmployees = async (req, res) => {
  try {
    const { search, gender, status, nationality } = req.query;
    let employees = [];

    if (useLocalFallback) {
      employees = localDb.getEmployees();
    } else {
      const snapshot = await db.collection("employees").get();
      employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Apply Search (Name, Salary Number, Nationality)
    if (search) {
      const searchLower = search.toLowerCase();
      employees = employees.filter(emp => 
        (emp.name && emp.name.toLowerCase().includes(searchLower)) ||
        (emp.salaryNo && emp.salaryNo.toString().toLowerCase().includes(searchLower)) ||
        (emp.nationality && emp.nationality.toLowerCase().includes(searchLower))
      );
    }

    // Apply Filters
    if (gender) {
      employees = employees.filter(emp => emp.gender === gender);
    }
    if (status) {
      employees = employees.filter(emp => emp.status === status);
    }
    if (nationality) {
      employees = employees.filter(emp => emp.nationality.toLowerCase() === nationality.toLowerCase());
    }

    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch employees", error: error.message });
  }
};

// GET /api/employees/:id - Fetch single employee
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    let employee = null;

    if (useLocalFallback) {
      const employees = localDb.getEmployees();
      employee = employees.find(emp => emp.id === id);
    } else {
      const doc = await db.collection("employees").doc(id).get();
      if (doc.exists) {
        employee = { id: doc.id, ...doc.data() };
      }
    }

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json(employee);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch employee", error: error.message });
  }
};

// POST /api/employees - Create employee
export const createEmployee = async (req, res) => {
  try {
    const {
      name,
      nationality,
      status,
      gender,
      age,
      familyDetails,
      salaryNo,
      salary,
      address,
    } = req.body;

    // Validate inputs
    if (!name || !nationality || !status || !gender || !salaryNo) {
      return res.status(400).json({ message: "Required fields are missing." });
    }

    // Server-side check for unique salaryNo
    let isDuplicate = false;
    if (useLocalFallback) {
      const employees = localDb.getEmployees();
      isDuplicate = employees.some(emp => emp.salaryNo.toString() === salaryNo.toString());
    } else {
      const snapshot = await db.collection("employees").where("salaryNo", "==", salaryNo).get();
      isDuplicate = !snapshot.empty;
    }

    if (isDuplicate) {
      // Clean up uploaded temp files
      if (req.files) {
        Object.keys(req.files).forEach(key => {
          req.files[key].forEach(file => {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          });
        });
      }
      return res.status(400).json({ message: `Salary Number '${salaryNo}' is already registered.` });
    }

    const serverUrl = `${req.protocol}://${req.get("host")}`;

    // Upload files
      const documents = {
        profilePic: null,
        emiratesId: null,
        labourCard: null,
        medicalInsurance: null,
        passport: null,
        labourContract: null,
      };

      if (req.files) {
        const uploadPromises = [];
        const fileKeys = [];

        if (req.files.profilePic) {
          uploadPromises.push(handleFileUpload(req.files.profilePic[0], salaryNo, "profile_pic", serverUrl));
          fileKeys.push("profilePic");
        }
        if (req.files.emiratesId) {
          uploadPromises.push(handleFileUpload(req.files.emiratesId[0], salaryNo, "emirates_id", serverUrl));
          fileKeys.push("emiratesId");
        }
        if (req.files.labourCard) {
          uploadPromises.push(handleFileUpload(req.files.labourCard[0], salaryNo, "labour_card", serverUrl));
          fileKeys.push("labourCard");
        }
        if (req.files.medicalInsurance) {
          uploadPromises.push(handleFileUpload(req.files.medicalInsurance[0], salaryNo, "medical_insurance", serverUrl));
          fileKeys.push("medicalInsurance");
        }
        if (req.files.passport) {
          uploadPromises.push(handleFileUpload(req.files.passport[0], salaryNo, "passport", serverUrl));
          fileKeys.push("passport");
        }
        if (req.files.labourContract) {
          uploadPromises.push(handleFileUpload(req.files.labourContract[0], salaryNo, "labour_contract", serverUrl));
          fileKeys.push("labourContract");
        }

        const uploadedUrls = await Promise.all(uploadPromises);
        fileKeys.forEach((key, index) => {
          documents[key] = uploadedUrls[index];
        });
      }

      const employeeData = {
        name,
        nationality,
        status,
        gender,
        age: age ? parseInt(age) : null,
        familyDetails: familyDetails || "",
        salaryNo,
        salary: salary || null,
        address: address || "",
        dob: req.body.dob || null,
        dubaiPhone: req.body.dubaiPhone || null,
        indianPhone: req.body.indianPhone || null,
        documentExpiry: {
          emiratesId: req.body.expiry_emiratesId || "",
          labourCard: req.body.expiry_labourCard || "",
          medicalInsurance: req.body.expiry_medicalInsurance || "",
          passport: req.body.expiry_passport || "",
          labourContract: req.body.expiry_labourContract || "",
        },
        documents,
        createdAt: new Date().toISOString(),
      };

    let newEmployee = null;

    if (useLocalFallback) {
      const employees = localDb.getEmployees();
      const id = `local_${Date.now()}`;
      newEmployee = { id, ...employeeData };
      employees.push(newEmployee);
      localDb.saveEmployees(employees);
    } else {
      const docRef = await db.collection("employees").add(employeeData);
      newEmployee = { id: docRef.id, ...employeeData };
    }

    res.status(201).json({ message: "Employee registered successfully", employee: newEmployee });
  } catch (error) {
    // Cleanup files in case of failure
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        req.files[key].forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      });
    }
    res.status(500).json({ message: "Failed to create employee", error: error.message });
  }
};

// PUT /api/employees/:id - Update employee
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      nationality,
      status,
      gender,
      age,
      familyDetails,
      salaryNo,
      salary,
      address,
    } = req.body;

    let existingEmployee = null;
    if (useLocalFallback) {
      const employees = localDb.getEmployees();
      existingEmployee = employees.find(emp => emp.id === id);
    } else {
      const doc = await db.collection("employees").doc(id).get();
      if (doc.exists) {
        existingEmployee = { id: doc.id, ...doc.data() };
      }
    }

    if (!existingEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Verify unique salaryNo (if it is being changed)
    if (salaryNo && salaryNo.toString() !== existingEmployee.salaryNo.toString()) {
      let isDuplicate = false;
      if (useLocalFallback) {
        const employees = localDb.getEmployees();
        isDuplicate = employees.some(emp => emp.salaryNo.toString() === salaryNo.toString());
      } else {
        const snapshot = await db.collection("employees").where("salaryNo", "==", salaryNo).get();
        isDuplicate = !snapshot.empty;
      }

      if (isDuplicate) {
        if (req.files) {
          Object.keys(req.files).forEach(key => {
            req.files[key].forEach(file => {
              if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
          });
        }
        return res.status(400).json({ message: `Salary Number '${salaryNo}' is already taken.` });
      }
    }

    const serverUrl = `${req.protocol}://${req.get("host")}`;
    const updatedDocuments = { ...existingEmployee.documents };

    if (req.files) {
        const updatePromises = [];
        const fileKeys = [];

        const updateField = async (field, fileObj, docType) => {
          if (existingEmployee.documents && existingEmployee.documents[field]) {
            await handleFileDelete(existingEmployee.documents[field]);
          }
          return await handleFileUpload(fileObj, salaryNo || existingEmployee.salaryNo, docType, serverUrl);
        };

        if (req.files.profilePic) {
          updatePromises.push(updateField("profilePic", req.files.profilePic[0], "profile_pic"));
          fileKeys.push("profilePic");
        }
        if (req.files.emiratesId) {
          updatePromises.push(updateField("emiratesId", req.files.emiratesId[0], "emirates_id"));
          fileKeys.push("emiratesId");
        }
        if (req.files.labourCard) {
          updatePromises.push(updateField("labourCard", req.files.labourCard[0], "labour_card"));
          fileKeys.push("labourCard");
        }
        if (req.files.medicalInsurance) {
          updatePromises.push(updateField("medicalInsurance", req.files.medicalInsurance[0], "medical_insurance"));
          fileKeys.push("medicalInsurance");
        }
        if (req.files.passport) {
          updatePromises.push(updateField("passport", req.files.passport[0], "passport"));
          fileKeys.push("passport");
        }
        if (req.files.labourContract) {
          updatePromises.push(updateField("labourContract", req.files.labourContract[0], "labour_contract"));
          fileKeys.push("labourContract");
        }

        const uploadedUrls = await Promise.all(updatePromises);
        fileKeys.forEach((key, index) => {
          updatedDocuments[key] = uploadedUrls[index];
        });
    }

      const updatedData = {
        name: name || existingEmployee.name,
        nationality: nationality || existingEmployee.nationality,
        status: status || existingEmployee.status,
        gender: gender || existingEmployee.gender,
        age: age ? parseInt(age) : existingEmployee.age,
        familyDetails: familyDetails !== undefined ? familyDetails : existingEmployee.familyDetails,
        salaryNo: salaryNo || existingEmployee.salaryNo,
        salary: salary !== undefined ? salary : existingEmployee.salary,
        address: address !== undefined ? address : existingEmployee.address,
        dob: req.body.dob || existingEmployee.dob,
        dubaiPhone: req.body.dubaiPhone || existingEmployee.dubaiPhone,
        indianPhone: req.body.indianPhone || existingEmployee.indianPhone,
        documentExpiry: {
          emiratesId: req.body.expiry_emiratesId !== undefined ? req.body.expiry_emiratesId : (existingEmployee.documentExpiry?.emiratesId || ""),
          labourCard: req.body.expiry_labourCard !== undefined ? req.body.expiry_labourCard : (existingEmployee.documentExpiry?.labourCard || ""),
          medicalInsurance: req.body.expiry_medicalInsurance !== undefined ? req.body.expiry_medicalInsurance : (existingEmployee.documentExpiry?.medicalInsurance || ""),
          passport: req.body.expiry_passport !== undefined ? req.body.expiry_passport : (existingEmployee.documentExpiry?.passport || ""),
          labourContract: req.body.expiry_labourContract !== undefined ? req.body.expiry_labourContract : (existingEmployee.documentExpiry?.labourContract || ""),
        },
        documents: updatedDocuments,
        updatedAt: new Date().toISOString(),
      };

    if (useLocalFallback) {
      const employees = localDb.getEmployees();
      const index = employees.findIndex(emp => emp.id === id);
      employees[index] = { ...employees[index], ...updatedData };
      localDb.saveEmployees(employees);
    } else {
      await db.collection("employees").doc(id).update(updatedData);
    }

    res.status(200).json({ message: "Employee updated successfully", employee: { id, ...updatedData } });
  } catch (error) {
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        req.files[key].forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      });
    }
    res.status(500).json({ message: "Failed to update employee", error: error.message });
  }
};

// DELETE /api/employees/:id - Delete employee and their files
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    let employee = null;

    if (useLocalFallback) {
      const employees = localDb.getEmployees();
      employee = employees.find(emp => emp.id === id);
    } else {
      const doc = await db.collection("employees").doc(id).get();
      if (doc.exists) {
        employee = doc.data();
      }
    }

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Delete files associated
    if (employee.documents) {
      try {
        await Promise.all([
          handleFileDelete(employee.documents.profilePic),
          handleFileDelete(employee.documents.emiratesId),
          handleFileDelete(employee.documents.labourCard),
          handleFileDelete(employee.documents.medicalInsurance),
          handleFileDelete(employee.documents.passport),
          handleFileDelete(employee.documents.labourContract),
        ]);
      } catch (fileErr) {
        console.error("Error deleting employee documents:", fileErr.message);
      }
    }

    // Delete employee record
    if (useLocalFallback) {
      const employees = localDb.getEmployees();
      const filtered = employees.filter(emp => emp.id !== id);
      localDb.saveEmployees(filtered);
    } else {
      await db.collection("employees").doc(id).delete();
    }

    res.status(200).json({ message: "Employee record and files deleted successfully" });
  } catch (error) {
    console.error("deleteEmployee failed with error:", error);
    res.status(500).json({ message: "Failed to delete employee", error: error.message });
  }
};

// GET /api/stats - Dashboard statistics
export const getStats = async (req, res) => {
  try {
    let employees = [];
    if (useLocalFallback) {
      employees = localDb.getEmployees();
    } else {
      const snapshot = await db.collection("employees").get();
      employees = snapshot.docs.map(doc => doc.data());
    }

    const total = employees.length;
    const male = employees.filter(emp => emp.gender === "Male").length;
    const female = employees.filter(emp => emp.gender === "Female").length;
    const married = employees.filter(emp => emp.status === "Married").length;
    const single = employees.filter(emp => emp.status === "Single").length;

    res.status(200).json({
      total,
      male,
      female,
      married,
      single
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats", error: error.message });
  }
};

// New endpoint to get expiring/expired documents
export const getExpiringDocuments = async (req, res) => {
  try {
    // Dynamically import the utility to avoid circular deps if any
    const { checkDocumentExpiries } = await import("../utils/expiryChecker.js");
    const alerts = await checkDocumentExpiries();

    // Persist alerts to Firestore (if not using local fallback)
    if (!useLocalFallback) {
      const batch = db.batch();
      alerts.forEach(alert => {
        const docRef = db.collection("expiryAlerts").doc(); // auto‑generated ID
        batch.set(docRef, {
          employeeId: alert.employeeId,
          employeeName: alert.employeeName,
          document: alert.document,
          expiryDate: alert.expiryDate,
          daysLeft: alert.daysLeft,
          status: alert.status,
          createdAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    }

    res.status(200).json(alerts);
  } catch (error) {
    console.error("Expiry check error:", error);
    res.status(500).json({ message: "Failed to check document expiries", error: error.message });
  }
};

// Endpoint to restore backup database on Vercel restart
export const restoreEmployees = async (req, res) => {
  try {
    const { employees } = req.body;
    if (useLocalFallback) {
      localDb.saveEmployees(employees || []);
      console.log(`[Backup Sync] Successfully restored ${employees ? employees.length : 0} employees.`);
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Restore error:", error);
    res.status(500).json({ message: "Failed to restore database", error: error.message });
  }
};
