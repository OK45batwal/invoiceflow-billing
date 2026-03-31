import express from "express";
import { createSession } from "../../src/auth.js";
import { getFirebaseDb, hasFirebaseConfig } from "../firebase.js";
import { sendOtpEmail } from "../services/mailer.js";
import { clearOtp, createOtp, getOtpTtlMs, verifyOtp } from "../services/otpStore.js";

const router = express.Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_PATTERN = /^\d{6}$/;
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

function validateOtp(rawOtp) {
  const otp = String(rawOtp || "").trim();
  if (!OTP_PATTERN.test(otp)) {
    throw new Error("OTP must be a 6-digit code.");
  }
  return otp;
}

function toIsoString(value, fallback) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

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
      const persistedSnapshot = await userRef.get();
      if (!persistedSnapshot.exists) {
        throw new Error("Verified user could not be persisted to Firebase.");
      }

      return {
        id: userRef.id,
        ...(persistedSnapshot.data() || createdUser)
      };
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
    const persistedSnapshot = await userRef.get();
    if (!persistedSnapshot.exists) {
      throw new Error("Verified user could not be persisted to Firebase.");
    }

    return {
      id: userRef.id,
      ...(persistedSnapshot.data() || mergedUser)
    };
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

router.post("/send-otp", async (req, res) => {
  try {
    const email = validateEmail(req.body?.email);
    const { otp } = createOtp(email);

    try {
      const delivery = await sendOtpEmail({
        email,
        otp,
        expiresInMinutes: Math.round(getOtpTtlMs() / 60000)
      });

      const payload = {
        message:
          delivery.deliveryMode === "development"
            ? `Development OTP generated for ${email}.`
            : `OTP sent to ${email}.`,
        expiresInMs: getOtpTtlMs(),
        deliveryMode: delivery.deliveryMode
      };

      if (delivery.deliveryMode === "development") {
        payload.developmentOtp = otp;
      }

      return res.json(payload);
    } catch (error) {
      clearOtp(email);
      throw error;
    }
  } catch (error) {
    return res.status(400).json({ error: parseJsonError(error, "Failed to send OTP.") });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const email = validateEmail(req.body?.email);
    const otp = validateOtp(req.body?.otp);
    const verification = verifyOtp(email, otp);

    if (!verification.ok) {
      if (verification.reason === "expired" || verification.reason === "missing") {
        return res.status(410).json({ error: "OTP expired. Request a new code." });
      }

      if (verification.reason === "too_many_attempts") {
        return res.status(429).json({ error: "Too many wrong OTP attempts. Request a new code." });
      }

      return res.status(401).json({
        error:
          verification.attemptsLeft > 0
            ? `Wrong OTP. ${verification.attemptsLeft} attempt(s) left.`
            : "Wrong OTP."
      });
    }

    const user = await upsertVerifiedUser(email);
    const sessionUser = {
      id: user.id,
      username: user.email,
      name: toDisplayName(user.email),
      email: user.email,
      role: user.role,
      authMethod: "otp",
      createdAt: user.createdAt
    };

    const token = createSession(sessionUser);

    return res.json({
      message: "OTP verified successfully.",
      token,
      user: sessionUser
    });
  } catch (error) {
    return res.status(400).json({ error: parseJsonError(error, "Failed to verify OTP.") });
  }
});

export default router;
