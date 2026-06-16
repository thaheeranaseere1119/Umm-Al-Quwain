import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDycgF9tyT9xYtp1G1vn6KhHEEFhQIn4-M",
  authDomain: "ummal-quwain.firebaseapp.com",
  projectId: "ummal-quwain",
  storageBucket: "ummal-quwain.appspot.com",
  messagingSenderId: "1057941390227",
  appId: "1:1057941390227:web:019ed2a7dcaa5795421e66",
  measurementId: "G-T3C31QVKDT"
};

// Initialize Firebase safely for hot module replacement (HMR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

// Fail fast on network/CORS blocks (default is 2 minutes)
storage.maxOperationRetryTime = 3000;
storage.maxUploadRetryTime = 3000;

// Automatically connect to Firebase Local Emulator Suite if in local development mode
if (import.meta.env.DEV) {
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    console.log("⚡ Connected to Firebase Local Emulators (Firestore: 8080, Storage: 9199)");
  } catch (err) {
    console.warn("Failed to bind Firebase Emulators:", err);
  }
}

export { app, db, storage };
