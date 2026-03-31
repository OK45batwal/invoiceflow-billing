/**
 * mailer.js — OTP email delivery via Brevo (formerly Sendinblue) HTTP API.
 *
 * Why Brevo instead of SMTP?
 *   Render free-tier web services block outbound SMTP on ports 25, 465, and 587.
 *   Brevo delivers mail over HTTPS (port 443), which Render allows.
 *   Free tier: 300 emails/day, 9,000/month — no custom domain required.
 *   Just verify your sender email address in the Brevo dashboard.
 *
 * Required environment variables (production):
 *   BREVO_API_KEY   — API key from https://app.brevo.com/settings/keys/api
 *   BREVO_FROM_EMAIL — Verified sender email, e.g. yourgmail@gmail.com
 *   BREVO_FROM_NAME  — Display name, e.g. "InvoiceFlow Pro" (optional, defaults to OTP_APP_NAME)
 *
 * Local development fallback:
 *   If BREVO_API_KEY / BREVO_FROM_EMAIL are not set and NODE_ENV !== "production",
 *   the OTP is printed to the console and returned in the API response.
 */

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function isProduction() {
  return String(process.env.NODE_ENV || "development").trim().toLowerCase() === "production";
}

function getMailConfig() {
  const appName = String(process.env.OTP_APP_NAME || "InvoiceFlow Pro").trim();
  return {
    apiKey: String(process.env.BREVO_API_KEY || "").trim(),
    fromEmail: String(process.env.BREVO_FROM_EMAIL || "").trim(),
    fromName: String(process.env.BREVO_FROM_NAME || appName).trim()
  };
}

function hasMailConfig(config) {
  return Boolean(config.apiKey && config.fromEmail);
}

export async function sendOtpEmail({ email, otp, expiresInMinutes }) {
  const config = getMailConfig();
  const appName = String(process.env.OTP_APP_NAME || "InvoiceFlow Pro").trim();

  if (!hasMailConfig(config)) {
    if (isProduction()) {
      throw new Error(
        "OTP email delivery is not configured. Set BREVO_API_KEY and BREVO_FROM_EMAIL in your environment."
      );
    }

    // Development fallback — print to console, return OTP in response.
    console.warn(`[OTP development fallback] ${email}: ${otp}`);
    return {
      deliveryMode: "development",
      previewOtp: otp,
      accepted: [email]
    };
  }

  const htmlBody = `
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
  `;

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": config.apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: config.fromName,
        email: config.fromEmail
      },
      to: [{ email }],
      subject: `${appName} verification code`,
      textContent: `Your ${appName} OTP is ${otp}. It expires in ${expiresInMinutes} minutes.`,
      htmlContent: htmlBody
    })
  });

  if (!response.ok) {
    let detail = "";
    try {
      const errorBody = await response.json();
      detail = errorBody?.message || JSON.stringify(errorBody);
    } catch {
      detail = await response.text().catch(() => "");
    }
    throw new Error(
      `Brevo API error ${response.status}${detail ? `: ${detail}` : ""}. Check BREVO_API_KEY and BREVO_FROM_EMAIL.`
    );
  }

  const data = await response.json();

  return {
    deliveryMode: "brevo",
    messageId: data.messageId,
    accepted: [email]
  };
}
