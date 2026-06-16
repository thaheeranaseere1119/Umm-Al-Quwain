# Umm Al Quwain Restaurant Employee Management System

A professional Employee Management Web Application designed for **Umm Al Quwain Restaurant** located in the United Arab Emirates. Built using React.js, Tailwind CSS (v4), Node.js, and Express.js, with support for Firebase Firestore/Storage or local databases.

---

## 🚀 Features

- **Admin Passcode Protection**: Restricts app access to administrative staff. Default passcode: `UAQ2026`.
- **Live Stats Panel**: Real-time breakdown of employee metrics (Total, Male, Female, Married, Single).
- **Interactive Directory Layout**: Elegant cards with full-text search and filtering (by gender, status, and nationality).
- **Registration Form**: Validated forms for personal, employment, and address records.
- **Progressive Document Uploads**: File dropzones supporting up to 5MB (JPG, JPEG, PNG) showing a real-time progress indicator during submission.
- **Lightbox Overlay**: Large view zoom lightbox for documents (Emirates ID, Passport, Labour Card, Medical Insurance) with file downloads.
- **Data Exporting**:
  - **Export PDF**: Generates structured, colored tables using `jspdf` and `jspdf-autotable`.
  - **Export Excel**: Generates sheets containing complete employee records using `xlsx` (SheetJS).
- **Flexible Data Store**: Dual modes that transition seamlessly from a local mock JSON database to Firebase Firestore and Cloud Storage.

---

## 📁 Project Structure

```text
Umm-Al-Quwain/
├── backend/
│   ├── config/firebase.js          # Firebase and local fallback configurations
│   ├── controllers/                # REST CRUD controller logic
│   ├── routes/                     # Router with multer upload middlewares
│   ├── uploads/                    # Local storage folder for documents
│   ├── data.json                   # Local JSON database fallback
│   ├── server.js                   # Express server entry point
│   └── .env                        # Environment variables template
└── frontend/
    ├── src/
    │   ├── components/             # Reusable UI widgets
    │   │   ├── EmployeeCard.jsx
    │   │   ├── EmployeeModal.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   └── StatsDashboard.jsx
    │   ├── pages/                  # Page route components
    │   │   ├── CreateEmployee.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── EmployeeList.jsx
    │   │   └── Login.jsx
    │   ├── App.jsx                 # Routes navigator
    │   ├── index.css               # Main Tailwind and theme overrides
    │   └── main.jsx                # React DOM entry point
    ├── vite.config.js              # Vite React & Tailwind configurations
    └── index.html                  # HTML template with SEO tags
```

---

## 🛠️ Installation & Setup

### Prerequisites

- **Node.js**: Version 18.0 or newer.
- **npm**: Version 9.0 or newer.

### 1. Run the Backend Server

```bash
cd backend
npm install
npm run dev
```

The server starts at `http://localhost:5000`. If no Firebase credentials are configured in `.env`, the system defaults to **Local Fallback Mode** and writes files directly to `/backend/uploads` and metadata to `/backend/data.json`.

### 2. Run the Frontend Dev Client

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your web browser. 

---

## 🛡️ Firebase Setup

To connect the application to Firebase:
1. Go to your **Firebase Console** and retrieve a Service Account JSON file (**Project Settings** -> **Service Accounts** -> **Generate New Private Key**).
2. Copy this file to `backend/` and rename it to `firebase-service-account.json`.
3. Open `backend/.env` and configure your storage bucket domain:
   ```env
   FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   ```
4. Restart the backend server. It will automatically switch to Firestore and Cloud Storage.
# Employee-Management-System
