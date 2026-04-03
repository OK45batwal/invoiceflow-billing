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

async function sendResendEmail({ email, otp, expiresInMinutes }) {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  const from = String(process.env.RESEND_FROM || "InvoiceFlow Pro <onboarding@resend.dev>").trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: `Your ${String(process.env.OTP_APP_NAME || "InvoiceFlow Pro")} Login Code`,
      html: `<h2>${String(process.env.OTP_APP_NAME || "InvoiceFlow Pro")}</h2><p>Your login code is: <strong style="font-size: 24px;">${otp}</strong></p><p>This code expires in ${expiresInMinutes} minutes.</p>`
    })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Resend API error ${res.status}: ${body.message || res.statusText}`);
  }

  return res.json();
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

function isProduction() {
  return String(process.env.NODE_ENV || "development").trim().toLowerCase() === "production";
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
    const expiresInMinutes = 10;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const otpRef = db.collection("otpCodes").doc(email);
    await otpRef.set({
      code,
      expiresAt: expiresAt.toISOString(),
      attempts: 0
    });

    // Use Resend HTTP API in production (Render blocks SMTP)
    if (isProduction() && process.env.RESEND_API_KEY) {
      await sendResendEmail({ email, otp: code, expiresInMinutes });
      console.log("OTP email sent via Resend to:", email);
      return res.json({ message: "OTP sent successfully." });
    }

    // Use SMTP or dummy transporter for local development
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
    console.log("Verify request body:", JSON.stringify(req.body));
    const rawEmail = req.body?.email;
    const code = req.body?.code;

    if (!rawEmail || !code) {
      return res.status(400).json({ error: "Email and code are required." });
    }
    const email = normalizeEmail(rawEmail);
    console.log("Verifying OTP for:", email, "code:", code);

    if (!hasFirebaseConfig()) {
      return res.status(500).json({ error: "Firebase not configured on backend." });
    }

    const db = getFirebaseDb();
    const otpRef = db.collection("otpCodes").doc(email);
    const snapshot = await otpRef.get();

    if (!snapshot.exists) {
      console.log("No OTP found for:", email);
      return res.status(400).json({ error: "No pending OTP request for this email." });
    }

    const data = snapshot.data();
    console.log("OTP data:", { expiresAt: data.expiresAt, attempts: data.attempts });
    if (new Date(data.expiresAt) < new Date()) {
      await otpRef.delete();
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    if (data.attempts >= 5) {
      await otpRef.delete();
      return res.status(400).json({ error: "Too many failed attempts. Please request a new OTP." });
    }

    if (data.code !== String(code).trim()) {
      console.log("Code mismatch - stored:", data.code, "received:", String(code).trim());
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
    console.log("OTP verified for:", email);

    res.json({ message: "OTP verified.", token, user: sessionUser });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "Failed to verify OTP: " + (error.message || String(error)) });
  }
});

export default router;
