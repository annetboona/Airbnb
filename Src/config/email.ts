import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env["EMAIL_HOST"],
  port: Number(process.env["EMAIL_PORT"]),
  secure: false, // TLS on port 587
  auth: {
    user: process.env["EMAIL_USER"],
    pass: process.env["EMAIL_PASS"],
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
  await transporter.sendMail({
    from: process.env["EMAIL_FROM"],
    to,
    subject,
    html,
  });
}

export default transporter;