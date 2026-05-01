/**
 * auth.js — Firebase Authentication Email Link (passwordless sign-in) route.
 *
 * Flow:
 *   1. Frontend calls Firebase SDK sendSignInLinkToEmail() — Firebase sends the email.
 *   2. User clicks link → Firebase SDK signs them in → frontend gets an ID token.
 *   3. Frontend POSTs the ID token to POST /api/auth/firebase-verify.
 *   4. This handler verifies the token with Firebase Admin SDK.
 *   5. Upserts the user in Firestore (same as before).
 *   6. Returns an app session token.
 */

import express from "express";
import { getAuth } from "firebase-admin/auth";
import { createSession } from "../../src/auth.js";
import { getFirebaseDb, hasFirebaseConfig } from "../firebase.js";
import { getApps, initializeApp } from "firebase-admin/app";

const router = express.Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const developmentUsers = new Map();

function isProduction() {
  return String(process.env.NODE_ENV || "development").trim().toLowerCase() === "production";
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getDefaultOtpRole() {
  return String(process.env.DEFAULT_OTP_ROLE || "admin").trim().toLowerCase() === "staff"
    ? "staff"
    : "admin";
}

function toDisplayName(email) {
  const localPart = normalizeEmail(email).split("@")[0] || "Workspace User";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseJsonError(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function validateEmail(rawEmail) {
  const email = normalizeEmail(rawEmail);
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Enter a valid email address.");
  }
  return email;
}

function toIsoString(value, fallback) {
  if (typeof value === "string" && value.trim()) return value;
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value.toDate === "function") return value.toDate().toISOString();
  return fallback;
}

async function upsertVerifiedUser(email) {
  if (hasFirebaseConfig()) {
    const db = getFirebaseDb();
    const userRef = db.collection("otpUsers").doc(email);
    const snapshot = await userRef.get();
    const nowIso = new Date().toISOString();

    if (!snapshot.exists) {
      const createdUser = {
        email,
        role: getDefaultOtpRole(),
        createdAt: nowIso,
        lastLoginAt: nowIso
      };
      await userRef.set(createdUser);
      const persisted = await userRef.get();
      if (!persisted.exists) throw new Error("Verified user could not be persisted to Firebase.");
      return { id: userRef.id, ...(persisted.data() || createdUser) };
    }

    const data = snapshot.data() || {};
    const existingRole = data.role === "staff" ? "staff" : "admin";
    const mergedUser = {
      email,
      role: existingRole,
      createdAt: toIsoString(data.createdAt, nowIso),
      lastLoginAt: nowIso
    };
    await userRef.set(mergedUser, { merge: true });
    const persisted = await userRef.get();
    if (!persisted.exists) throw new Error("Verified user could not be persisted to Firebase.");
    return { id: userRef.id, ...(persisted.data() || mergedUser) };
  }

  if (isProduction()) {
    throw new Error("Firebase is not configured on the server yet.");
  }

  const existing = developmentUsers.get(email);
  const nextUser = existing || {
    id: `dev-${Buffer.from(email).toString("hex")}`,
    email,
    role: getDefaultOtpRole(),
    createdAt: new Date().toISOString()
  };
  developmentUsers.set(email, nextUser);
  return nextUser;
}

/**
 * POST /api/auth/firebase-verify
 * Body: { idToken: string }
 *
 * Verifies a Firebase ID token (issued after email link sign-in),
 * upserts the user in Firestore, and returns an app session token.
 */
router.post("/firebase-verify", async (req, res) => {
  try {
    const idToken = String(req.body?.idToken || "").trim();
    if (!idToken) {
      return res.status(400).json({ error: "Missing Firebase ID token." });
    }

    let decodedToken;
    try {
      // getAuth() uses the already-initialised Firebase Admin app from firebase.js
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (firebaseError) {
      console.error("Firebase ID Token Verification Error:", firebaseError);
      if (!isProduction() && !hasFirebaseConfig()) {
        console.warn("Bypassing token signature verification in development because Firebase Admin is not configured.");
        const parts = idToken.split(".");
        if (parts.length === 3) {
          try {
            decodedToken = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
          } catch (decodeError) {
            return res.status(401).json({ error: "Failed to decode token." });
          }
        } else {
          return res.status(401).json({ error: "Invalid token format." });
        }
      } else {
        return res.status(401).json({ error: "Invalid or expired sign-in link. Please request a new one." });
      }
    }

    const email = validateEmail(decodedToken.email);
    const user = await upsertVerifiedUser(email);

    const sessionUser = {
      id: user.id,
      username: user.email,
      name: toDisplayName(user.email),
      email: user.email,
      role: user.role,
      authMethod: "firebase-email-link",
      createdAt: user.createdAt
    };

    const token = createSession(sessionUser);

    return res.json({
      message: "Sign-in verified successfully.",
      token,
      user: sessionUser
    });
  } catch (error) {
    return res.status(400).json({ error: parseJsonError(error, "Failed to verify sign-in.") });
  }
});

export default router;
