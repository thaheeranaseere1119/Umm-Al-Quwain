import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendDir = path.resolve(__dirname, "..");
const localDbPath = process.env.VERCEL 
  ? "/tmp/data.json" 
  : path.join(backendDir, "data.json");
const uploadsDir = process.env.VERCEL 
  ? "/tmp/uploads" 
  : path.join(backendDir, "uploads");

// Ensure local fallback folders exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(localDbPath)) {
  fs.writeFileSync(localDbPath, JSON.stringify([], null, 2), "utf-8");
}

let db = null;
let bucket = null;
let useLocalFallback = true;

const privateKey = process.env.FIREBASE_PRIVATE_KEY 
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") 
  : null;

const serviceAccountPath = path.join(backendDir, "firebase-service-account.json");

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`
    });
    db = admin.firestore();
    bucket = admin.storage().bucket();
    useLocalFallback = false;
    console.log("Firebase initialized successfully using service account JSON file.");
  } catch (error) {
    console.error("Failed to initialize Firebase with JSON file:", error.message);
  }
} else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
    db = admin.firestore();
    bucket = admin.storage().bucket();
    useLocalFallback = false;
    console.log("Firebase Admin SDK initialized successfully via Environment Variables.");
  } catch (error) {
    console.error("Failed to initialize Firebase with Environment Variables:", error.message);
  }
}

if (useLocalFallback) {
  console.warn("⚠️ Firebase configuration missing or invalid. Running in LOCAL FALLBACK MODE.");
  console.warn("Data will be stored in backend/data.json and uploads in backend/uploads/.");
}

// Local mock database helpers
const localDb = {
  getEmployees: () => {
    try {
      const data = fs.readFileSync(localDbPath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  },
  saveEmployees: (employees) => {
    fs.writeFileSync(localDbPath, JSON.stringify(employees, null, 2), "utf-8");
  }
};

export { db, bucket, useLocalFallback, localDb, uploadsDir };
