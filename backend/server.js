import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cron from "node-cron";
import { checkDocumentExpiries } from "./utils/expiryChecker.js";
import employeeRoutes from "./routes/employeeRoutes.js";

// Schedule daily expiry check at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    const alerts = await checkDocumentExpiries();
    if (alerts.length) {
      console.log("[Expiry Check] Alerts:", alerts);
    } else {
      console.log("[Expiry Check] No expiring documents today.");
    }
  } catch (err) {
    console.error("[Expiry Check] Error:", err);
  }
});

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads directory statically for Local Fallback mode
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Basic Authentication route (passcode protection)
app.post("/api/auth/login", (req, res) => {
  const { passcode } = req.body;
  const adminPasscode = process.env.ADMIN_PASSCODE || "UAQ2026";
  
  if (passcode === adminPasscode) {
    return res.status(200).json({ success: true, token: "UAQ_ADMIN_TOKEN_2026" });
  } else {
    return res.status(401).json({ success: false, message: "Invalid Passcode. Access Denied." });
  }
});

// Mount employee routes
app.use("/api/employees", employeeRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Backend Error:", err);
  
  // Handle Multer upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File is too large. Maximum size allowed is 5MB."
    });
  }
  
  res.status(500).json({
    message: err.message || "An internal server error occurred."
  });
});

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;
