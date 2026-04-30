"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.changePassword = exports.getMe = exports.loginUser = exports.registerUser = void 0;
const express_1 = require("express");
const prisma_1 = __importDefault(require("../config/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const Auth_middleware_1 = require("../middleware/Auth.middleware");
const email_1 = require("../config/email");
const Welcome_template_1 = require("../templates/Welcome.template");
const reset_password_template_1 = require("../templates/reset-password.template");
// ─── Register ────────────────────────────────────────────────────────────────
const registerUser = async (req, res) => {
    try {
        const { name, email, phone, username, password, role } = req.body;
        if (!name || !email || !phone || !username || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }
        const existingUser = await prisma_1.default.user.findFirst({
            where: { OR: [{ email }, { username }] },
        });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email or username already exists" });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const finalRole = role ?? "GUEST";
        const newUser = await prisma_1.default.user.create({
            data: {
                name,
                email,
                phone,
                username,
                password: hashedPassword,
                role: finalRole,
            },
        });
        // Send role-specific welcome email — failure is logged but never blocks the response
        const roleMessage = finalRole === "HOST"
            ? "You can now start listing your properties!"
            : "Start exploring amazing places to stay!";
        (0, email_1.sendEmail)(email, "Welcome to Airbnb! 🎉", (0, Welcome_template_1.welcomeEmailTemplate)(name, roleMessage))
            .then(() => console.log(`✅ Welcome email sent to ${email}`))
            .catch((err) => console.error(`❌ Welcome email failed for ${email}:`, err.message));
        const { password: _, ...userWithoutPassword } = newUser;
        return res.status(201).json({ message: "User registered successfully", user: userWithoutPassword });
    }
    catch (error) {
        console.error("registerUser error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.registerUser = registerUser;
// ─── Login ────────────────────────────────────────────────────────────────────
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
        return res.status(200).json({ message: "Login successful", token });
    }
    catch (error) {
        console.error("loginUser error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.loginUser = loginUser;
// ─── Get Me ───────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.userId },
            include: { listings: req.role === "HOST" },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json({ user: userWithoutPassword });
    }
    catch (error) {
        console.error("getMe error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getMe = getMe;
// ─── Change Password ──────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current password and new password are required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters long" });
        }
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await prisma_1.default.user.findUnique({ where: { id: req.userId } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isMatch = await bcrypt_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        await prisma_1.default.user.update({
            where: { id: req.userId },
            data: { password: hashedPassword },
        });
        return res.status(200).json({ message: "Password changed successfully" });
    }
    catch (error) {
        console.error("changePassword error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.changePassword = changePassword;
// ─── Forgot Password ──────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
    // Always return the same message — prevents email enumeration
    const successResponse = { message: "If that email exists, a reset link has been sent." };
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        const user = await prisma_1.default.user.findFirst({ where: { email } });
        if (!user) {
            // Don't reveal whether the email exists
            return res.status(200).json(successResponse);
        }
        // Generate a secure random token
        const rawToken = crypto_1.default.randomBytes(32).toString("hex");
        // Store only the hash — never the raw token
        const hashedToken = crypto_1.default.createHash("sha256").update(rawToken).digest("hex");
        const tokenExpiry = new Date(Date.now() + 3_600_000); // 1 hour
        await prisma_1.default.user.update({
            where: { email },
            data: {
                resetToken: hashedToken,
                resetTokenExpiry: tokenExpiry,
            },
        });
        // The link carries the raw token — the controller will hash it for comparison
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${rawToken}`;
        await (0, email_1.sendEmail)(email, "Reset Your Airbnb Password 🔐", (0, reset_password_template_1.resetPasswordEmailTemplate)(user.name, resetUrl));
        console.log(`✅ Password reset email sent to ${email}`);
        return res.status(200).json(successResponse);
    }
    catch (error) {
        console.error("forgotPassword error:", error);
        // Still return success to prevent email enumeration
        return res.status(200).json(successResponse);
    }
};
exports.forgotPassword = forgotPassword;
// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        if (!token) {
            return res.status(400).json({ message: "Reset token is required" });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        // Hash the incoming raw token to compare against the stored hash
        const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
        const user = await prisma_1.default.user.findFirst({
            where: {
                resetToken: hashedToken,
                resetTokenExpiry: { gt: new Date() },
            },
        });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Clear token after successful reset
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
        return res.status(200).json({ message: "Password reset successfully" });
    }
    catch (error) {
        console.error("resetPassword error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=auth.controller.js.map