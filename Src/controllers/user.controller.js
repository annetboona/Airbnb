import prisma from "../config/prisma.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import { getCache, setCache, clearCacheByPrefix } from "../config/cache.js";
const USERS_STATS_TTL = 5 * 60 * 1000;
//get all users
export const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page || "1");
        const limit = parseInt(req.query.limit || "10");
        const take = limit > 0 ? limit : 10;
        const skip = (page > 0 ? page - 1 : 0) * take;
        const [users, totalCount] = await Promise.all([
            prisma.user.findMany({
                take,
                skip,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count(),
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
//get user by id
export const getUserById = async (req, res) => {
    try {
        const id = parseInt(req.params["id"]);
        const user = await prisma.user.findUnique({
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
export const getUsersStats = async (req, res) => {
    try {
        const cachedUsersStats = getCache("usersStats");
        if (cachedUsersStats) {
            return res.json(cachedUsersStats);
        }
        const [totalUsers, byRole] = await Promise.all([
            prisma.user.count(),
            prisma.user.groupBy({
                by: ["role"],
                _count: { role: true },
            }),
        ]);
        const response = {
            totalUsers,
            byRole,
        };
        setCache("usersStats", response, USERS_STATS_TTL / 1000);
        return res.json(response);
    }
    catch (error) {
        console.error("Get users stats error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
// create user
export const createUser = async (req, res) => {
    try {
        const { name, email, username, phone, role, avatar, bio } = req.body;
        const newUser = await prisma.user.create({
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
        clearCacheByPrefix("users");
        res.status(201).json(newUser);
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "Email or Username already exists" });
        }
        res.status(500).json({ message: "Error creating user", error });
    }
};
//update user
export const updateUser = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, email, username, phone, role, avatar, bio } = req.body;
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { name, email, username, phone, role, avatar, bio }
        });
        clearCacheByPrefix("users");
        res.json(updatedUser);
    }
    catch (error) {
        res.status(404).json({ message: "User not found or update failed" });
    }
};
//delete user
export const uploadAvatar = async (req, res) => {
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
        const user = await prisma.user.findUnique({
            where: { id }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // 5. Delete old avatar from Cloudinary if it exists
        // This prevents orphaned files accumulating in your Cloudinary storage
        if (user.avatarPublicId) {
            await deleteFromCloudinary(user.avatarPublicId);
        }
        // 6. Upload new avatar to Cloudinary
        // req.file.buffer contains the file data in memory (from multer)
        const { url, publicId } = await uploadToCloudinary(req.file.buffer, "airbnb/avatars" // Cloudinary folder path
        );
        // 7. Update user with new avatar URL and publicId
        const updatedUser = await prisma.user.update({
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
// DELETE AVATAR ENDPOINT
export const deleteAvatar = async (req, res) => {
    try {
        // 1. Get user ID and check ownership
        const id = parseInt(req.params.id);
        if (req.userId !== id) {
            return res.status(403).json({ message: "You can only delete your own avatar" });
        }
        // 2. Find the user
        const user = await prisma.user.findUnique({
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
            await deleteFromCloudinary(user.avatarPublicId);
        }
        // 5. Update user - set avatar fields to null
        await prisma.user.update({
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
