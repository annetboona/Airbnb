import nodemailer from "nodemailer";

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const EMAIL_SECURE = process.env.EMAIL_SECURE === "true";
const EMAIL_TLS_REJECT_UNAUTHORIZED = process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== "false";

const missingVars = [
  !EMAIL_HOST && "EMAIL_HOST",
  !process.env.EMAIL_PORT && "EMAIL_PORT",
  !EMAIL_USER && "EMAIL_USER",
  !EMAIL_PASS && "EMAIL_PASS",
  !EMAIL_FROM && "EMAIL_FROM",
].filter(Boolean);

if (missingVars.length > 0) {
  console.error(`❌ Missing email environment variables: ${missingVars.join(", ")}`);
}

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_SECURE,
  auth: EMAIL_USER && EMAIL_PASS ? { user: EMAIL_USER, pass: EMAIL_PASS } : undefined,
  tls: {
    rejectUnauthorized: EMAIL_TLS_REJECT_UNAUTHORIZED,
  },
});

// Verify SMTP connection on startup — logs clearly if credentials are wrong
transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP connection failed:", error.message);
  } else {
    console.log("✅ SMTP connection verified — ready to send emails");
  }
});

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (missingVars.length > 0) {
    throw new Error(`Email configuration incomplete: ${missingVars.join(", ")}`);
  }

  const message = {
    from: EMAIL_FROM,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log(`✅ Email sent to ${to} (messageId=${info.messageId})`);
  } catch (error) {
    console.error(`❌ sendEmail failed for ${to}:`, error);
    throw error;
  }
}

export default transporter;