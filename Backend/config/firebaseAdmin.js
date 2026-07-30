import { envPath } from "./env.js";
import admin from "firebase-admin";
import fs from "fs";

if (!admin.apps.length) {
  // ─── SAFE ENVIRONMENT AUDIT LOGS (NO SECRETS EXPOSED) ─────────────────────
  console.log("[Dotenv Audit] Working Directory (process.cwd()):", process.cwd());
  console.log("[Dotenv Audit] Loaded .env Path:", envPath);
  console.log("[Dotenv Audit] Environment Variables Check:", {
    FIREBASE_PROJECT_ID: Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID.trim().length > 0),
    FIREBASE_CLIENT_EMAIL: Boolean(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_CLIENT_EMAIL.trim().length > 0),
    FIREBASE_PRIVATE_KEY: Boolean(process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY.trim().length > 0),
    FIREBASE_SERVICE_ACCOUNT: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT.trim().length > 0),
    FIREBASE_STORAGE_BUCKET: Boolean(process.env.FIREBASE_STORAGE_BUCKET && process.env.FIREBASE_STORAGE_BUCKET.trim().length > 0),
  });

  let serviceAccount;

  // 1. Resolve service account if FIREBASE_SERVICE_ACCOUNT is provided (JSON string or file path)
  if (process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT.trim()) {
    const rawAccount = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    if (rawAccount.startsWith("{")) {
      try {
        serviceAccount = JSON.parse(rawAccount);
      } catch (err) {
        throw new Error(`Firebase Admin Initialization Failed: FIREBASE_SERVICE_ACCOUNT is not valid JSON - ${err.message}`);
      }
    } else if (fs.existsSync(rawAccount)) {
      try {
        serviceAccount = JSON.parse(fs.readFileSync(rawAccount, "utf8"));
      } catch (err) {
        throw new Error(`Firebase Admin Initialization Failed: Unable to read JSON service account file at "${rawAccount}" - ${err.message}`);
      }
    } else {
      throw new Error(`Firebase Admin Initialization Failed: FIREBASE_SERVICE_ACCOUNT is neither a valid JSON string nor an existing file path.`);
    }
  } else {
    // 2. Resolve individual environment variables
    const projectId = (process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || process.env.PROJECT_ID || "").trim();
    const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || process.env.CLIENT_EMAIL || "").trim();
    let rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.PRIVATE_KEY || "";

    const missingVars = [];
    if (!projectId) missingVars.push("FIREBASE_PROJECT_ID");
    if (!clientEmail) missingVars.push("FIREBASE_CLIENT_EMAIL");
    if (!rawPrivateKey) missingVars.push("FIREBASE_PRIVATE_KEY");

    if (missingVars.length > 0) {
      throw new Error(
        `Firebase Admin Initialization Failed: Missing required credential(s): [${missingVars.join(", ")}]. ` +
        `Please ensure these variables are defined with valid non-empty values in your Backend/.env file.`
      );
    }

    // Process escaped newlines (\n -> actual line break) in RSA private key
    const privateKey = rawPrivateKey.replace(/\\n/g, "\n");

    // Construct service account supplying BOTH snake_case and camelCase keys
    serviceAccount = {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey,
      ...(process.env.FIREBASE_CLIENT_ID && {
        client_id: process.env.FIREBASE_CLIENT_ID,
        clientId: process.env.FIREBASE_CLIENT_ID,
      }),
    };
  }

  // 3. Fast-fail validation of mandatory service account string properties
  const resolvedProjectId = serviceAccount.project_id || serviceAccount.projectId;
  const resolvedClientEmail = serviceAccount.client_email || serviceAccount.clientEmail;
  const resolvedPrivateKey = serviceAccount.private_key || serviceAccount.privateKey;

  if (!resolvedProjectId || typeof resolvedProjectId !== "string") {
    throw new Error('Firebase Admin Initialization Failed: Service account object must contain a valid string "project_id" property.');
  }

  if (!resolvedClientEmail || typeof resolvedClientEmail !== "string") {
    throw new Error('Firebase Admin Initialization Failed: Service account object must contain a valid string "client_email" property.');
  }

  if (!resolvedPrivateKey || typeof resolvedPrivateKey !== "string") {
    throw new Error('Firebase Admin Initialization Failed: Service account object must contain a valid string "private_key" property.');
  }

  console.log("[Firebase Admin Debug] Service Account Keys Configured:", Object.keys(serviceAccount));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    ...(process.env.FIREBASE_DATABASE_URL && { databaseURL: process.env.FIREBASE_DATABASE_URL }),
    ...(process.env.FIREBASE_STORAGE_BUCKET && { storageBucket: process.env.FIREBASE_STORAGE_BUCKET }),
  });

  console.log("✅ Firebase Admin Initialized Successfully");
}

export default admin;
