import express from "express";
import nodemailer from "nodemailer";
import { createSession } from "../../src/auth.js";
import { getFirebaseDb, hasFirebaseConfig } from "../firebase.js";
import crypto from "node:crypto";

const router = express.Router();

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });
  } else {
    // Fallback: Dummy transporter to prevent GCP firewall blocking Ethereal Test Account APIs
    console.log("No SMTP_USER/SMTP_PASS found. Using Dummy Dev Transporter.");
    transporter = {
      sendMail: async (options) => {
        console.log("============== DEV MAIL ==============");
        console.log("To:", options.to);
        console.log("HTML:", options.html);
        console.log("======================================");
        return { messageId: "dev-dummy-id" };
      }
    };
  }
  return transporter;
}

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
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

router.post("/send", async (req, res) => {
  try {
    const rawEmail = req.body?.email;
    if (!rawEmail || !rawEmail.includes("@")) {
      return res.status(400).json({ error: "Valid email is required." });
    }
    const email = normalizeEmail(rawEmail);

    if (!hasFirebaseConfig()) {
      return res.status(500).json({ error: "Firebase not configured on backend." });
    }

    const db = getFirebaseDb();
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const otpRef = db.collection("otpCodes").doc(email);
    await otpRef.set({
      code,
      expiresAt: expiresAt.toISOString(),
      attempts: 0
    });

    const mailer = await getTransporter();
    const info = await mailer.sendMail({
      from: `"InvoiceFlow Pro" <${process.env.SMTP_FROM_EMAIL || 'noreply@invoiceflow.com'}>`,
      to: email,
      subject: "Your InvoiceFlow Login Code",
      text: `Your login code is: ${code}\nThis code expires in 10 minutes.`,
      html: `<h2>InvoiceFlow Pro</h2><p>Your login code is: <strong style="font-size: 24px;">${code}</strong></p><p>This code expires in 10 minutes.</p>`
    });

    console.log("OTP Email sent to:", email);
    if (!process.env.SMTP_USER) {
      // We bypassed Ethereal. Let's return the devOtp so the user can test without picking through logs.
      return res.json({ message: "OTP generated.", devOtp: code });
    }

    res.json({ message: "OTP sent successfully." });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Backend OTP Error: " + (error.message || String(error)) });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const rawEmail = req.body?.email;
    const code = req.body?.code;

    if (!rawEmail || !code) {
      return res.status(400).json({ error: "Email and code are required." });
    }
    const email = normalizeEmail(rawEmail);

    if (!hasFirebaseConfig()) {
      return res.status(500).json({ error: "Firebase not configured on backend." });
    }

    const db = getFirebaseDb();
    const otpRef = db.collection("otpCodes").doc(email);
    const snapshot = await otpRef.get();

    if (!snapshot.exists) {
      return res.status(400).json({ error: "No pending OTP request for this email." });
    }

    const data = snapshot.data();
    if (new Date(data.expiresAt) < new Date()) {
      await otpRef.delete();
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    if (data.attempts >= 5) {
      await otpRef.delete();
      return res.status(400).json({ error: "Too many failed attempts. Please request a new OTP." });
    }

    if (data.code !== String(code).trim()) {
      await otpRef.update({ attempts: (data.attempts || 0) + 1 });
      return res.status(400).json({ error: "Invalid OTP code." });
    }

    // OTP is correct! Delete it from Firestore.
    await otpRef.delete();

    // Create local session
    const sessionUser = {
      id: `otp-${Buffer.from(email).toString("hex")}`,
      username: email,
      name: toDisplayName(email),
      email: email,
      role: getDefaultOtpRole(),
      authMethod: "otp",
      createdAt: new Date().toISOString()
    };

    const token = createSession(sessionUser);

    res.json({ message: "OTP verified.", token, user: sessionUser });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "Failed to verify OTP: " + (error.message || String(error)) });
  }
});

export default router;
