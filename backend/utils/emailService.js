import nodemailer from "nodemailer";
import { Resend } from "resend";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Explicitly load .env from project root regardless of cwd
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const getCredentials = () => {
  return {
    user: (process.env.EMAIL_USER || "").replace(/['"]/g, "").trim(),
    pass: (process.env.EMAIL_PASS || "").replace(/['"]/g, "").trim(),
    apiKey: (process.env.API_KEY || "").replace(/['"]/g, "").trim(),
  };
};

const createGmailTransporter = () => {
  const { user, pass } = getCredentials();
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

export const sendVerificationEmail = async (email, code) => {
  const verifyLink = `http://localhost:5173/verify-email?token=${code}`;
  const { user, pass, apiKey } = getCredentials();

  console.log("\n" + "=".repeat(55));
  console.log("🔐 [VIMS EMAIL DISPATCH]");
  console.log(`📧 Recipient: ${email}`);
  console.log(`👤 Sender Account: ${user || "NOT CONFIGURED"}`);
  console.log("=".repeat(55) + "\n");

  const textBody = `Your VIMS verification code is: ${code}\n\nEnter this 6-digit code on the verification screen to activate your account. This code expires in 24 hours.`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>VIMS Verification</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 20px; margin: 0;">
      <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 700;">VIMS Account Verification</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 8px;">Please enter the verification code below on your screen to complete your registration:</p>
        </div>

        <div style="background: #eff6ff; border: 2px solid #bfdbfe; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-family: 'Courier New', monospace, Courier; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; display: inline-block;">${code}</span>
        </div>

        <p style="color: #64748b; font-size: 13px; text-align: center; line-height: 1.5; margin: 16px 0;">
          This code expires in 24 hours. If you did not create a VIMS account, please disregard this message.
        </p>

        <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            VIMS Vehicle Insurance System
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Attempt 1: Gmail SMTP via Nodemailer
  if (user && pass) {
    try {
      const transporter = createGmailTransporter();
      const response = await transporter.sendMail({
        from: `"VIMS" <${user}>`,
        to: email,
        subject: `Your VIMS verification code: ${code}`,
        text: textBody,
        html: emailHtml,
      });
      console.log("✅ Verification email successfully delivered via Gmail SMTP to", email);
      return { success: true, messageId: response.messageId };
    } catch (smtpError) {
      console.error("⚠️ Gmail SMTP delivery failed:", smtpError.message);
    }
  } else {
    console.warn("⚠️ EMAIL_USER or EMAIL_PASS not set in .env");
  }

  // Attempt 2: Fallback to Resend API if available
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const resendRes = await resend.emails.send({
        from: "VIMS <onboarding@resend.dev>",
        to: email,
        subject: `Your VIMS Verification Code: ${code}`,
        html: emailHtml,
      });
      console.log("✅ Verification email dispatched via Resend:", resendRes.id);
      return { success: true, resendId: resendRes.id };
    } catch (resendError) {
      console.error("⚠️ Resend fallback failed:", resendError.message);
    }
  }

  // If both failed
  return { success: false, error: "Email delivery failed" };
};
