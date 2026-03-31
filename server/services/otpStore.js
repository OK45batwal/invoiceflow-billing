import crypto from "node:crypto";

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const otpStore = new Map();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashOtp(email, otp) {
  return crypto
    .createHash("sha256")
    .update(`${normalizeEmail(email)}:${String(otp || "").trim()}`)
    .digest("hex");
}

function clearExpiredOtps() {
  const now = Date.now();
  for (const [email, entry] of otpStore.entries()) {
    if (entry.expiresAt <= now) {
      otpStore.delete(email);
    }
  }
}

export function getOtpTtlMs() {
  return OTP_TTL_MS;
}

export function clearOtp(email) {
  otpStore.delete(normalizeEmail(email));
}

export function createOtp(email) {
  clearExpiredOtps();

  const normalizedEmail = normalizeEmail(email);
  const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const expiresAt = Date.now() + OTP_TTL_MS;

  otpStore.set(normalizedEmail, {
    otpHash: hashOtp(normalizedEmail, otp),
    expiresAt,
    attempts: 0
  });

  return {
    otp,
    expiresAt
  };
}

export function verifyOtp(email, otp) {
  clearExpiredOtps();

  const normalizedEmail = normalizeEmail(email);
  const entry = otpStore.get(normalizedEmail);

  if (!entry) {
    return { ok: false, reason: "missing" };
  }

  if (entry.expiresAt <= Date.now()) {
    otpStore.delete(normalizedEmail);
    return { ok: false, reason: "expired" };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(normalizedEmail);
    return { ok: false, reason: "too_many_attempts" };
  }

  const matches = hashOtp(normalizedEmail, otp) === entry.otpHash;
  if (!matches) {
    entry.attempts += 1;

    if (entry.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(normalizedEmail);
      return { ok: false, reason: "too_many_attempts", attemptsLeft: 0 };
    }

    otpStore.set(normalizedEmail, entry);
    return {
      ok: false,
      reason: "invalid",
      attemptsLeft: MAX_ATTEMPTS - entry.attempts
    };
  }

  otpStore.delete(normalizedEmail);
  return { ok: true };
}
