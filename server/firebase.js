import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getInlineFirebaseConfig() {
  const projectId = String(process.env.FIREBASE_PROJECT_ID || "").trim();
  const clientEmail = String(process.env.FIREBASE_CLIENT_EMAIL || "").trim();
  const privateKey = String(process.env.FIREBASE_PRIVATE_KEY || "")
    .replace(/\\n/g, "\n")
    .trim();

  return {
    projectId,
    clientEmail,
    privateKey
  };
}

function hasInlineFirebaseConfig() {
  const config = getInlineFirebaseConfig();
  return Boolean(config.projectId && config.clientEmail && config.privateKey);
}

function getFirebaseProjectId() {
  return String(
    process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || ""
  ).trim();
}

function getExplicitAdcPath() {
  return String(process.env.GOOGLE_APPLICATION_CREDENTIALS || "").trim();
}

function getDefaultAdcPath() {
  if (process.platform === "win32") {
    const appData = String(process.env.APPDATA || "").trim();
    return appData ? path.join(appData, "gcloud", "application_default_credentials.json") : "";
  }

  const home = os.homedir();
  return home ? path.join(home, ".config", "gcloud", "application_default_credentials.json") : "";
}

function hasApplicationDefaultCredentials() {
  const explicitPath = getExplicitAdcPath();
  if (explicitPath) {
    return fs.existsSync(explicitPath);
  }

  const defaultPath = getDefaultAdcPath();
  return Boolean(defaultPath && fs.existsSync(defaultPath));
}

function getFirebaseAppOptions() {
  if (hasInlineFirebaseConfig()) {
    return {
      credential: cert(getInlineFirebaseConfig())
    };
  }

  const projectId = getFirebaseProjectId();
  if (projectId && hasApplicationDefaultCredentials()) {
    return {
      credential: applicationDefault(),
      projectId
    };
  }

  throw new Error(
    "Firebase is not configured. Provide FIREBASE_PROJECT_ID + Application Default Credentials, or the full service account env values."
  );
}

export function hasFirebaseConfig() {
  return hasInlineFirebaseConfig() || Boolean(getFirebaseProjectId() && hasApplicationDefaultCredentials());
}

export function getFirebaseDb() {
  const existing = getApps()[0];
  const app = existing || initializeApp(getFirebaseAppOptions());
  return getFirestore(app);
}
