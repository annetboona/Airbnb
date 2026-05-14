import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../middleware/Auth.middleware.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import { getCache, setCache, clearCacheByPrefix } from "../config/cache.js";

const USERS_STATS_TTL = 5 * 60 * 1000;

// ─── Get All Users ────────────────────────────────────────────────────────────
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page  = parseInt((req.query.page  as string) || "1");
    const limit = parseInt((req.query.limit as string) || "10");
    const take  = limit > 0 ? limit : 10;
    const skip  = (page > 0 ? page - 1 : 0) * take;

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        take,
        skip,
        orderBy: { createdAt: "desc" },
        select: {
          id:           true,
          name:         true,
          email:        true,
          username:     true,
          phone:        true,
          role:         true,
          avatar:       true,
          bio:          true,
          createdAt:    true,
          updatedAt:    true,
          lastLoggedIn: true,   // ← included
          // password & avatarPublicId intentionally excluded
        },
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
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Get User By ID ───────────────────────────────────────────────────────────
export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = req.params["id"] as string;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id:           true,
        name:         true,
        email:        true,
        username:     true,
        phone:        true,
        role:         true,
        avatar:       true,
        bio:          true,
        createdAt:    true,
        updatedAt:    true,
        lastLoggedIn: true,   // ← included
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user, message: "User retrieved successfully" });
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Get Users Stats ──────────────────────────────────────────────────────────
export const getUsersStats = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error("Get users stats error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Create User ──────────────────────────────────────────────────────────────
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, username, phone, role, avatar, bio } = req.body;

    const newUser = await prisma.user.create({
      data: { name, email, username, phone, role, avatar, bio },
      select: {
        id:           true,
        name:         true,
        email:        true,
        username:     true,
        phone:        true,
        role:         true,
        avatar:       true,
        bio:          true,
        createdAt:    true,
        updatedAt:    true,
        lastLoggedIn: true,
      },
    });

    clearCacheByPrefix("users");
    res.status(201).json(newUser);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Email or Username already exists" });
    }
    res.status(500).json({ message: "Error creating user", error });
  }
};

// ─── Update User ──────────────────────────────────────────────────────────────
export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, email, username, phone, role, avatar, bio } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, email, username, phone, role, avatar, bio },
      select: {
        id:           true,
        name:         true,
        email:        true,
        username:     true,
        phone:        true,
        role:         true,
        avatar:       true,
        bio:          true,
        createdAt:    true,
        updatedAt:    true,
        lastLoggedIn: true,
      },
    });

    clearCacheByPrefix("users");
    res.json(updatedUser);
  } catch (error) {
    res.status(404).json({ message: "User not found or update failed" });
  }
};

// ─── Upload Avatar ────────────────────────────────────────────────────────────
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

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
        id:           true,
        name:         true,
        email:        true,
        username:     true,
        phone:        true,
        role:         true,
        avatar:       true,
        bio:          true,
        createdAt:    true,
        updatedAt:    true,
        lastLoggedIn: true,
      },
    });

    res.status(200).json(updatedUser);
  } catch (error: any) {
    console.error("Upload avatar error:", error);
    res.status(500).json({ message: "Error uploading avatar", error: error.message });
  }
};

// ─── Delete Avatar ────────────────────────────────────────────────────────────
export const deleteAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

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
  } catch (error: any) {
    console.error("Delete avatar error:", error);
    res.status(500).json({ message: "Error deleting avatar", error: error.message });
  }
};

// ─── Delete User ──────────────────────────────────────────────────────────────
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

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
  } catch (error: any) {
    console.error("deleteUser error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const toggleUserDisabled = async (req: AuthRequest, res: Response) => {
  try {
    const id       = req.params.id as string
    const disabled = Boolean(req.body.disabled)
 
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user)               return res.status(404).json({ message: "User not found" })
    if (user.role === "ADMIN") return res.status(403).json({ message: "Cannot disable an admin account" })
 
    const updated = await prisma.user.update({
      where: { id },
      data:  { disabled },
      select: { id: true, name: true, email: true, disabled: true },
    })
 
    clearCacheByPrefix("users")
    return res.status(200).json({ message: `User ${disabled ? "disabled" : "enabled"} successfully`, user: updated })
  } catch (error: any) {
    console.error("toggleUserDisabled error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}