// backend/utils/expiryChecker.js
import { db, useLocalFallback, localDb } from "../config/firebase.js";

/**
 * Checks all employees for document expiry dates.
 * Returns an array of alerts for expired or soon‑to‑expire documents.
 * Each alert shape: { employeeId, employeeName, document, expiryDate, daysLeft, status }
 */
export const checkDocumentExpiries = async () => {
  const warningDays = parseInt(process.env.EXPIRY_WARNING_DAYS) || 30;
  const now = new Date();
  const alerts = [];

  let employees = [];
  if (useLocalFallback) {
    employees = localDb.getEmployees();
  } else {
    const snapshot = await db.collection("employees").get();
    employees = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  employees.forEach((emp) => {
    const expiries = emp.documentExpiry || {};
    Object.entries(expiries).forEach(([docType, dateStr]) => {
      if (!dateStr) return;
      const expiryDate = new Date(dateStr);
      const diffMs = expiryDate - now;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays < 0) {
        alerts.push({
          employeeId: emp.id,
          employeeName: emp.name,
          document: docType,
          expiryDate: expiryDate.toISOString().split("T")[0],
          daysLeft: Math.floor(diffDays),
          status: "expired",
        });
      } else if (diffDays <= warningDays) {
        alerts.push({
          employeeId: emp.id,
          employeeName: emp.name,
          document: docType,
          expiryDate: expiryDate.toISOString().split("T")[0],
          daysLeft: Math.ceil(diffDays),
          status: "expiring",
        });
      }
    });
  });

  return alerts;
};
