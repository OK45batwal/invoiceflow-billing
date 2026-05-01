import crypto from "node:crypto";

const sessions = new Map();
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password)).digest("hex");
}

export function verifyPassword(password, passwordHash) {
  return hashPassword(password) === String(passwordHash || "");
}

export function createSession(user) {
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, {
    user,
    expiresAt: Date.now() + SESSION_TTL_MS
  });
  return token;
}

export function getSessionUser(token) {
  const entry = sessions.get(token);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }

  return entry.user;
}

export function deleteSession(token) {
  sessions.delete(token);
}

export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    email: user.email,
    authMethod: user.authMethod,
    createdAt: user.createdAt
  };
}
