import { Router } from "express";
import {
  submitHostRequest,
  getMyHostRequest,
  getAllHostRequests,
  approveHostRequest,
  rejectHostRequest,
} from "../../controllers/Hostrequest.controlle.js";
import { authenticate, requireAdmin } from "../../middleware/Auth.middleware.js";

const hostRequestRouter = Router();

// ── Guest routes ──────────────────────────────────────────────────────────────
// Submit or resubmit a host request
hostRequestRouter.post("/", authenticate, submitHostRequest);

// Get own request status
hostRequestRouter.get("/me", authenticate, getMyHostRequest);

// ── Admin routes ──────────────────────────────────────────────────────────────
// Get all requests (filter by ?status=PENDING|APPROVED|REJECTED)
hostRequestRouter.get("/", authenticate, requireAdmin, getAllHostRequests);

// Approve
hostRequestRouter.patch("/:id/approve", authenticate, requireAdmin, approveHostRequest);

// Reject (body: { adminNote?: string })
hostRequestRouter.patch("/:id/reject", authenticate, requireAdmin, rejectHostRequest);

export default hostRequestRouter;