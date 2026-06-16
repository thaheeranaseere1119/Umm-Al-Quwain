import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getStats,
  getExpiringDocuments,
  restoreEmployees,
} from "../controllers/employeeController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tempDir = process.env.VERCEL 
  ? "/tmp" 
  : path.resolve(__dirname, "../temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}_${Date.now()}${ext}`);
  },
});

// File validation filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, JPEG, and PNG are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = express.Router();

const documentUpload = upload.fields([
  { name: "profilePic", maxCount: 1 },
  { name: "emiratesId", maxCount: 1 },
  { name: "labourCard", maxCount: 1 },
  { name: "medicalInsurance", maxCount: 1 },
  { name: "passport", maxCount: 1 },
  { name: "labourContract", maxCount: 1 },
  { name: "visa", maxCount: 1 },
]);

// Routes
router.get("/stats", getStats);
router.get("/expiring", getExpiringDocuments);
router.get("/", getEmployees);
router.get("/:id", getEmployeeById);
router.post("/restore", restoreEmployees);
router.post("/", documentUpload, createEmployee);
router.put("/:id", documentUpload, updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
