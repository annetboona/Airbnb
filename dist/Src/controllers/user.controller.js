import prisma from "../config/prisma.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import { getCache, setCache, clearCacheByPrefix } from "../config/cache.js";
const USERS_STATS_TTL = 5 * 60 * 1000;
// ─── Get All Users ────────────────────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page || "1");
        const limit = parseInt(req.query.limit || "10");
        const search = req.query.search || "";
        const role = req.query.role || "";
        const take = limit > 0 ? limit : 10;
        const skip = (page > 0 ? page - 1 : 0) * take;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { username: { contains: search, mode: "insensitive" } },
            ];
        }
        if (role && ["ADMIN", "HOST", "GUEST"].includes(role.toUpperCase())) {
            where.role = role.toUpperCase();
        }
        const [users, totalCount] = await Promise.all([
            prisma.user.findMany({
                where,
                take,
                skip,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    phone: true,
                    role: true,
                    avatar: true,
                    bio: true,
                    createdAt: true,
                    updatedAt: true,
                    lastLoggedIn: true,
                    disabled: true,
                },
            }),
            prisma.user.count({ where }),
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
// ─── Get User By ID ───────────────────────────────────────────────────────────
export const getUserById = async (req, res) => {
    try {
        const id = req.params["id"];
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                phone: true,
                role: true,
                avatar: true,
                bio: true,
                createdAt: true,
                updatedAt: true,
                lastLoggedIn: true, // ← included
            },
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
// ─── Get Users Stats ──────────────────────────────────────────────────────────
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
        const response = { totalUsers, byRole };
        setCache("usersStats", response, USERS_STATS_TTL / 1000);
        return res.json(response);
    }
    catch (error) {
        console.error("Get users stats error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
// ─── Create User ──────────────────────────────────────────────────────────────
export const createUser = async (req, res) => {
    try {
        const { name, email, username, phone, role, avatar, bio } = req.body;
        const newUser = await prisma.user.create({
            data: { name, email, username, phone, role, avatar, bio },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                phone: true,
                role: true,
                avatar: true,
                bio: true,
                createdAt: true,
                updatedAt: true,
                lastLoggedIn: true,
            },
        });
        clearCacheByPrefix("users");
        res.status(201).json(newUser);
    }
    catch (error) {
        if (error.code === "P2002") {
            return res.status(400).json({ message: "Email or Username already exists" });
        }
        res.status(500).json({ message: "Error creating user", error });
    }
};
// ─── Upload Avatar ────────────────────────────────────────────────────────────
export const uploadAvatar = async (req, res) => {
    try {
        const id = req.params.id;
        if (req.userId !== id) {
            return res.status(403).json({ message: "You can only update your own avatar" });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.avatarPublicId) {
            await deleteFromCloudinary(user.avatarPublicId);
        }
        const { url, publicId } = await uploadToCloudinary(req.file.buffer, "airbnb/avatars");
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { avatar: url, avatarPublicId: publicId },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                phone: true,
                role: true,
                avatar: true,
                bio: true,
                createdAt: true,
                updatedAt: true,
                lastLoggedIn: true,
            },
        });
        res.status(200).json(updatedUser);
    }
    catch (error) {
        console.error("Upload avatar error:", error);
        res.status(500).json({ message: "Error uploading avatar", error: error.message });
    }
};
// ─── Delete Avatar ────────────────────────────────────────────────────────────
export const deleteAvatar = async (req, res) => {
    try {
        const id = req.params.id;
        if (req.userId !== id) {
            return res.status(403).json({ message: "You can only delete your own avatar" });
        }
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!user.avatar) {
            return res.status(400).json({ message: "No avatar to remove" });
        }
        if (user.avatarPublicId) {
            await deleteFromCloudinary(user.avatarPublicId);
        }
        await prisma.user.update({
            where: { id },
            data: { avatar: null, avatarPublicId: null },
        });
        res.status(200).json({ message: "Avatar deleted successfully" });
    }
    catch (error) {
        console.error("Delete avatar error:", error);
        res.status(500).json({ message: "Error deleting avatar", error: error.message });
    }
};
// ─── Delete User ──────────────────────────────────────────────────────────────
export const deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({ message: "User ID is required" });
        }
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.role === "ADMIN") {
            return res.status(403).json({ message: "Cannot delete an admin account" });
        }
        if (user.avatarPublicId) {
            await deleteFromCloudinary(user.avatarPublicId);
        }
        await prisma.user.delete({ where: { id } });
        clearCacheByPrefix("users");
        return res.status(200).json({ message: "User deleted successfully" });
    }
    catch (error) {
        console.error("deleteUser error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const toggleUserDisabled = async (req, res) => {
    try {
        const id = req.params.id;
        const disabled = Boolean(req.body.disabled);
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        if (user.role === "ADMIN")
            return res.status(403).json({ message: "Cannot disable an admin account" });
        const updated = await prisma.user.update({
            where: { id },
            data: { disabled },
            select: { id: true, name: true, email: true, disabled: true },
        });
        clearCacheByPrefix("users");
        return res.status(200).json({ message: `User ${disabled ? "disabled" : "enabled"} successfully`, user: updated });
    }
    catch (error) {
        console.error("toggleUserDisabled error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, username, phone, bio } = req.body;
        // ✅ Check authentication
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // ✅ Ownership check: users can only update their own profile (unless admin)
        if (req.userId !== id && req.role !== "ADMIN") {
            return res.status(403).json({ message: "You can only update your own profile" });
        }
        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }
        // Update only safe fields
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { name, username, phone, bio },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                phone: true,
                role: true,
                avatar: true,
                bio: true,
                createdAt: true,
                updatedAt: true,
                lastLoggedIn: true,
            },
        });
        clearCacheByPrefix("users");
        res.json(updatedUser);
    }
    catch (error) {
        console.error("updateUser error:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "Username already exists" });
        }
        res.status(500).json({ message: "Failed to update user" });
    }
};
//# sourceMappingURL=user.controller.js.map