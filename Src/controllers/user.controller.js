"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAvatar = exports.uploadAvatar = exports.updateUser = exports.createUser = exports.getUsersStats = exports.getUserById = exports.getAllUsers = void 0;
const express_1 = require("express");
const prisma_js_1 = __importDefault(require("../config/prisma.js"));
const Auth_middleware_js_1 = require("../middleware/Auth.middleware.js");
const cloudinary_js_1 = require("../config/cloudinary.js");
const cache_1 = require("../config/cache");
const USERS_STATS_TTL = 5 * 60 * 1000;
//get all users
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page || "1");
        const limit = parseInt(req.query.limit || "10");
        const take = limit > 0 ? limit : 10;
        const skip = (page > 0 ? page - 1 : 0) * take;
        const [users, totalCount] = await Promise.all([
            prisma_js_1.default.user.findMany({
                take,
                skip,
                orderBy: { createdAt: 'desc' },
            }),
            prisma_js_1.default.user.count(),
        ]);
        res.status(200).json({
            meta: {
                page,
                limit: take,
                total: totalCount,
                totalPages: Math.ceil(totalCount / take),
            },
            data: users,
        });
    }
    catch (error) {
        console.error("Error retrieving users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getAllUsers = getAllUsers;
//get user by id
const getUserById = async (req, res) => {
    try {
        const id = parseInt(req.params["id"]);
        const user = await prisma_js_1.default.user.findUnique({
            where: { id }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ user, message: "User retrieved successfully" });
    }
    catch (error) {
        console.error("Error retrieving user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getUserById = getUserById;
const getUsersStats = async (req, res) => {
    try {
        const cachedUsersStats = (0, cache_1.getCache)("usersStats");
        if (cachedUsersStats) {
            return res.json(cachedUsersStats);
        }
        const [totalUsers, byRole] = await Promise.all([
            prisma_js_1.default.user.count(),
            prisma_js_1.default.user.groupBy({
                by: ["role"],
                _count: { role: true },
            }),
        ]);
        const response = {
            totalUsers,
            byRole,
        };
        (0, cache_1.setCache)("usersStats", response, USERS_STATS_TTL / 1000);
        return res.json(response);
    }
    catch (error) {
        console.error("Get users stats error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getUsersStats = getUsersStats;
// create user
const createUser = async (req, res) => {
    try {
        const { name, email, username, phone, role, avatar, bio } = req.body;
        const newUser = await prisma_js_1.default.user.create({
            data: {
                name,
                email,
                username,
                phone,
                role,
                avatar,
                bio
            }
        });
        (0, cache_1.clearCacheByPrefix)("users");
        res.status(201).json(newUser);
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "Email or Username already exists" });
        }
        res.status(500).json({ message: "Error creating user", error });
    }
};
exports.createUser = createUser;
//update user
const updateUser = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, email, username, phone, role, avatar, bio } = req.body;
        const updatedUser = await prisma_js_1.default.user.update({
            where: { id },
            data: { name, email, username, phone, role, avatar, bio }
        });
        (0, cache_1.clearCacheByPrefix)("users");
        res.json(updatedUser);
    }
    catch (error) {
        res.status(404).json({ message: "User not found or update failed" });
    }
};
exports.updateUser = updateUser;
//delete user
const uploadAvatar = async (req, res) => {
    try {
        // 1. Get user ID from params and convert to number
        const id = parseInt(req.params.id);
        // 2. Check ownership - users can only change their own avatar
        // req.userId comes from your authenticate middleware
        if (req.userId !== id) {
            return res.status(403).json({ message: "You can only update your own avatar" });
        }
        // 3. Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        // 4. Find the user
        const user = await prisma_js_1.default.user.findUnique({
            where: { id }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // 5. Delete old avatar from Cloudinary if it exists
        // This prevents orphaned files accumulating in your Cloudinary storage
        if (user.avatarPublicId) {
            await (0, cloudinary_js_1.deleteFromCloudinary)(user.avatarPublicId);
        }
        // 6. Upload new avatar to Cloudinary
        // req.file.buffer contains the file data in memory (from multer)
        const { url, publicId } = await (0, cloudinary_js_1.uploadToCloudinary)(req.file.buffer, "airbnb/avatars" // Cloudinary folder path
        );
        // 7. Update user with new avatar URL and publicId
        const updatedUser = await prisma_js_1.default.user.update({
            where: { id },
            data: {
                avatar: url,
                avatarPublicId: publicId
            },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                phone: true,
                role: true,
                avatar: true,
                avatarPublicId: true,
                bio: true,
                createdAt: true,
                updatedAt: true
                // password is excluded - NEVER return password in response
            }
        });
        // 8. Return updated user
        res.status(200).json(updatedUser);
    }
    catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ message: "Error uploading avatar", error: error.message });
    }
};
exports.uploadAvatar = uploadAvatar;
// DELETE AVATAR ENDPOINT
const deleteAvatar = async (req, res) => {
    try {
        // 1. Get user ID and check ownership
        const id = parseInt(req.params.id);
        if (req.userId !== id) {
            return res.status(403).json({ message: "You can only delete your own avatar" });
        }
        // 2. Find the user
        const user = await prisma_js_1.default.user.findUnique({
            where: { id }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // 3. Check if user has an avatar to delete
        if (!user.avatar) {
            return res.status(400).json({ message: "No avatar to remove" });
        }
        // 4. Delete from Cloudinary
        if (user.avatarPublicId) {
            await (0, cloudinary_js_1.deleteFromCloudinary)(user.avatarPublicId);
        }
        // 5. Update user - set avatar fields to null
        await prisma_js_1.default.user.update({
            where: { id },
            data: {
                avatar: null,
                avatarPublicId: null
            }
        });
        // 6. Return success message
        res.status(200).json({ message: "Avatar deleted successfully" });
    }
    catch (error) {
        console.error('Delete avatar error:', error);
        res.status(500).json({ message: "Error deleting avatar", error: error.message });
    }
};
exports.deleteAvatar = deleteAvatar;
//# sourceMappingURL=user.controller.js.map