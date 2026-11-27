require("dotenv").config();
const nodemailer = require("nodemailer");

const rawUser = process.env.GMAIL_USER || process.env.EMAIL_USER || "";
const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS || "";
const cleanedPass = rawPass.replace(/\s+/g, "");

const hasAppPassword = Boolean(rawUser && cleanedPass);

const hasOAuth2 = Boolean(
  process.env.EMAIL_USER &&
  process.env.CLIENT_ID &&
  process.env.CLIENT_SECRET &&
  process.env.REFRESH_TOKEN
);

let transporter = null;

if (hasAppPassword) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: rawUser,
      pass: cleanedPass,
    },
  });
  console.log(`[Email Service] Configured live Gmail SMTP delivery for ${rawUser}`);
} else if (hasOAuth2) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL_USER,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
    },
  });
  console.log(`[Email Service] Configured using Gmail OAuth2 for ${process.env.EMAIL_USER}`);
} else {
  console.log("[Email Service] Notice: GMAIL_USER and GMAIL_APP_PASSWORD are not yet set in .env.");
  console.log("[Email Service] To deliver real emails to actual Gmail inboxes, set GMAIL_USER and GMAIL_APP_PASSWORD in .env.");
}

if (transporter) {
  transporter.verify((error) => {
    if (error) {
      console.error("[Email Service] SMTP connection verification failed:", error.message);
    } else {
      console.log("[Email Service] Gmail SMTP server connected and ready to deliver messages to inboxes.");
    }
  });
}

const sendEmail = async (to, subject, text, html) => {
  const sender = rawUser || "noreply@ledgerbank.internal";

  if (!transporter) {
    console.log(`\n┌────────────────────────────────────────────────────────┐`);
    console.log(`│ [GMAIL DISPATCH NOTICE]                                │`);
    console.log(`│ Live SMTP is not configured in .env.                   │`);
    console.log(`│ Recipient: ${to.padEnd(43)} │`);
    console.log(`│ Subject:   ${subject.slice(0, 43).padEnd(43)} │`);
    console.log(`│ Content:   ${text.replace(/\n/g, ' ').slice(0, 43).padEnd(43)} │`);
    console.log(`└────────────────────────────────────────────────────────┘\n`);
    return { mock: true, to, subject };
  }

  try {
    const info = await transporter.sendMail({
      from: `"LedgerBank Security" <${sender}>`,
      to,
      replyTo: sender,
      subject,
      text,
      html,
      headers: {
        "X-Priority": "1 (Highest)",
        "X-MSMail-Priority": "High",
        "Importance": "High"
      }
    });
    console.log(`[Email Service] Live email successfully dispatched to ${to} (Message ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`[Email Service] Failed to send email to ${to}:`, error.message);
    throw new Error(`Failed to dispatch email to ${to}: ${error.message}`);
  }
};

async function sendOtpEmail(userEmail, otp, purpose) {
  let purposeTitle = "Security Verification";
  let purposeDesc = "complete your request";

  if (purpose === "REGISTRATION") {
    purposeTitle = "Account Registration Verification";
    purposeDesc = "verify your email address and activate your bank account";
  } else if (purpose === "LOGIN") {
    purposeTitle = "Secure Sign-In Code";
    purposeDesc = "sign in to your LedgerBank account";
  } else if (purpose === "FORGOT_PASSWORD") {
    purposeTitle = "Password Reset Request";
    purposeDesc = "reset your password";
  }

  const subject = `Your Verification Code: ${otp} - LedgerBank`;
  const text = `Hello,

Your 6-digit verification code to ${purposeDesc} is:

${otp}

This code will expire in 10 minutes. If you did not request this code, please ignore this email.

Best regards,
LedgerBank Security Team`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 20px;">LedgerBank Security</h2>
        <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">${purposeTitle}</span>
      </div>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">
        Use the 6-digit verification code below to ${purposeDesc}:
      </p>
      <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1e293b;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
        ⏱️ This code is valid for <strong>10 minutes</strong>. Never share this code with anyone. LedgerBank staff will never ask for your verification code.
      </p>
      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
        LedgerBank Core Double-Entry Ledger System • Automated notification, please do not reply.
      </div>
    </div>
  `;

  return await sendEmail(userEmail, subject, text, html);
}

async function sendregistrationEmail(userEmail, name) {
  const subject = "Welcome to LedgerBank!";
  const text = `Hello ${name},\n\nThank you for registering at LedgerBank. Your double-entry banking ledger is now active!\n\nBest regards,\nThe LedgerBank Team`;
  const html = `<p>Hello ${name},</p><p>Thank you for registering at LedgerBank. Your double-entry banking ledger is now active!</p><p>Best regards,<br>The LedgerBank Team</p>`;
  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = "Transaction Confirmed - LedgerBank";
  const text = `Hello ${name},\n\nYour transfer of ₹${amount} to account ${toAccount} was successful.\n\nBest regards,\nLedgerBank Core Banking`;
  const html = `<p>Hello ${name},</p><p>Your transfer of <strong>₹${amount}</strong> to account <code>${toAccount}</code> was completed successfully.</p><p>Best regards,<br>LedgerBank Core Banking</p>`;
  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
  const subject = "Transaction Failed - LedgerBank";
  const text = `Hello ${name},\n\nWe regret to inform you that your transaction of ₹${amount} to account ${toAccount} has failed.\n\nBest regards,\nLedgerBank Core Banking`;
  const html = `<p>Hello ${name},</p><p>Your transaction of ₹${amount} to account ${toAccount} has failed. Any deducted funds have been rolled back.</p><p>Best regards,<br>LedgerBank Core Banking</p>`;
  await sendEmail(userEmail, subject, text, html);
}

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendregistrationEmail,
  sendTransactionEmail,
  sendTransactionFailureEmail,
};
