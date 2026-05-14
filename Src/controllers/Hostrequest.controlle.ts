import type { Response } from "express";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../middleware/Auth.middleware.js";
import { sendEmail } from "../config/email.js";

// ─── GUEST: Submit a host request ────────────────────────────────────────────
export const submitHostRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (req.role !== "GUEST") {
      return res.status(403).json({ message: "Only guests can submit a host request" });
    }

    const { reason } = req.body;

    // Check if already submitted
    const existing = await prisma.hostRequest.findUnique({
      where: { userId: req.userId! },
    });

    if (existing) {
      if (existing.status === "PENDING") {
        return res.status(400).json({ message: "You already have a pending host request" });
      }
      if (existing.status === "APPROVED") {
        return res.status(400).json({ message: "Your request was already approved" });
      }
      // REJECTED — allow resubmission by updating
      const updated = await prisma.hostRequest.update({
        where: { userId: req.userId! },
        data: { reason, status: "PENDING", adminNote: null },
      });
      return res.status(200).json({ message: "Host request resubmitted", hostRequest: updated });
    }

    const hostRequest = await prisma.hostRequest.create({
      data: {
        userId: req.userId!,
        reason,
      },
    });

    return res.status(201).json({ message: "Host request submitted successfully", hostRequest });
  } catch (error: any) {
    console.error("submitHostRequest error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── GUEST: Get own host request status ──────────────────────────────────────
export const getMyHostRequest = async (req: AuthRequest, res: Response) => {
  try {
    const hostRequest = await prisma.hostRequest.findUnique({
      where: { userId: req.userId! },
    });

    if (!hostRequest) {
      return res.status(404).json({ message: "No host request found" });
    }

    return res.status(200).json({ hostRequest });
  } catch (error: any) {
    console.error("getMyHostRequest error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── ADMIN: Get all host requests ────────────────────────────────────────────
export const getAllHostRequests = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "10");
    const status = req.query.status as string | undefined;
    const take = limit > 0 ? limit : 10;
    const skip = (page > 0 ? page - 1 : 0) * take;

    const where = status ? { status } : {};

    const [requests, total] = await Promise.all([
      prisma.hostRequest.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              avatar: true,
              role: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.hostRequest.count({ where }),
    ]);

    return res.status(200).json({
      meta: { page, limit: take, total, totalPages: Math.ceil(total / take) },
      data: requests,
    });
  } catch (error: any) {
    console.error("getAllHostRequests error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── ADMIN: Approve a host request ───────────────────────────────────────────
export const approveHostRequest = async (req: AuthRequest, res: Response) => {
  try {
    const id  = req.params.id as string;

    const hostRequest = await prisma.hostRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!hostRequest) {
      return res.status(404).json({ message: "Host request not found" });
    }

    if (hostRequest.status !== "PENDING") {
      return res.status(400).json({ message: "Request is no longer pending" });
    }

    // Upgrade user role + mark request approved in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: hostRequest.userId },
        data: { role: "HOST" },
      }),
      prisma.hostRequest.update({
        where: { id },
        data: { status: "APPROVED" },
      }),
    ]);

    // Notify user by email (non-blocking)
    sendEmail(
      hostRequest.user.email,
      "🎉 Your Host Request Has Been Approved!",
      `<p>Hi ${hostRequest.user.name},</p>
       <p>Great news! Your request to become a host has been <strong>approved</strong>.</p>
       <p>You can now list your properties on the platform. Welcome to hosting!</p>`
    ).catch((err) => console.error("Approval email failed:", err.message));

    return res.status(200).json({ message: "Host request approved. User is now a HOST." });
  } catch (error: any) {
    console.error("approveHostRequest error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── ADMIN: Reject a host request ────────────────────────────────────────────
export const rejectHostRequest = async (req: AuthRequest, res: Response) => {
  try {
    const  id  = req.params.id as string;
    const { adminNote } = req.body;

    const hostRequest = await prisma.hostRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!hostRequest) {
      return res.status(404).json({ message: "Host request not found" });
    }

    if (hostRequest.status !== "PENDING") {
      return res.status(400).json({ message: "Request is no longer pending" });
    }

    await prisma.hostRequest.update({
      where: { id },
      data: { status: "REJECTED", adminNote: adminNote ?? null },
    });

    // Notify user by email (non-blocking)
    sendEmail(
      hostRequest.user.email,
      "Your Host Request Update",
      `<p>Hi ${hostRequest.user.name},</p>
       <p>Unfortunately your host request has been <strong>declined</strong>.</p>
       ${adminNote ? `<p>Reason: ${adminNote}</p>` : ""}
       <p>You may resubmit with more details if you believe this was a mistake.</p>`
    ).catch((err) => console.error("Rejection email failed:", err.message));

    return res.status(200).json({ message: "Host request rejected." });
  } catch (error: any) {
    console.error("rejectHostRequest error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};