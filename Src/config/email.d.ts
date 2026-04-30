import nodemailer from "nodemailer";
declare const transporter: nodemailer.Transporter<import("nodemailer/lib/smtp-transport").SentMessageInfo, import("nodemailer/lib/smtp-transport").Options>;
export declare function sendEmail(to: string, subject: string, html: string): Promise<void>;
export default transporter;
//# sourceMappingURL=email.d.ts.map