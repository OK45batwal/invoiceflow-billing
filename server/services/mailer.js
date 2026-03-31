import nodemailer from "nodemailer";

let transporterPromise = null;

function isProduction() {
  return String(process.env.NODE_ENV || "development").trim().toLowerCase() === "production";
}

function getMailConfig() {
  return {
    host: String(process.env.SMTP_HOST || "").trim(),
    port: Number(process.env.SMTP_PORT || 587),
    user: String(process.env.SMTP_USER || "").trim(),
    pass: String(process.env.SMTP_PASS || "").trim(),
    from: String(process.env.SMTP_FROM || "").trim(),
    secure: String(process.env.SMTP_SECURE || "").trim().toLowerCase() === "true"
  };
}

function hasMailConfig(config) {
  return Boolean(config.host && config.user && config.pass && config.from);
}

async function getTransporter() {
  if (!transporterPromise) {
    const config = getMailConfig();
    if (!hasMailConfig(config)) {
      throw new Error("OTP email sending is not configured on the server yet.");
    }

    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure || config.port === 465,
        auth: {
          user: config.user,
          pass: config.pass
        }
      })
    );
  }

  return transporterPromise;
}

export async function sendOtpEmail({ email, otp, expiresInMinutes }) {
  const config = getMailConfig();
  const appName = String(process.env.OTP_APP_NAME || "InvoiceFlow Pro").trim();

  if (!hasMailConfig(config)) {
    if (isProduction()) {
      throw new Error("OTP email sending is not configured on the server yet.");
    }

    console.warn(`[OTP development fallback] ${email}: ${otp}`);
    return {
      deliveryMode: "development",
      previewOtp: otp,
      accepted: [email]
    };
  }

  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: config.from,
    to: email,
    subject: `${appName} verification code`,
    text: `Your ${appName} OTP is ${otp}. It expires in ${expiresInMinutes} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1f2933;">
        <p style="margin: 0 0 12px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #0f766e;">
          ${appName}
        </p>
        <h1 style="margin: 0 0 12px; font-size: 28px; line-height: 1.2;">Your login OTP</h1>
        <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6;">
          Use the one-time password below to sign in. This code expires in ${expiresInMinutes} minutes.
        </p>
        <div style="margin: 0 0 20px; padding: 18px 20px; border-radius: 16px; background: #f3fbfa; border: 1px solid #b6e3dc;">
          <div style="font-size: 32px; font-weight: 700; letter-spacing: 0.4em; text-align: center; color: #0f172a;">
            ${otp}
          </div>
        </div>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #52606d;">
          If you did not request this login code, you can ignore this email.
        </p>
      </div>
    `
  });

  return {
    deliveryMode: "smtp",
    ...info
  };
}
