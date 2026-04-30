"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
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
    }
    else {
        console.log("✅ SMTP connection verified — ready to send emails");
    }
});
async function sendEmail(to, subject, html) {
    await transporter.sendMail({
        from: process.env["EMAIL_FROM"],
        to,
        subject,
        html,
    });
}
exports.default = transporter;
//# sourceMappingURL=email.js.map