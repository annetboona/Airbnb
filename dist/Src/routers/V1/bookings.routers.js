import { Router } from "express";
import { createBooking, deleteBooking, getAllBookings, getBookingById, getUserBookings, updateBookingStatus, } from "../../controllers/booking.controllers.js";
import { authenticate, requireGuest } from "../../middleware/Auth.middleware.js";
const router = Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     CreateBookingInput:
 *       type: object
 *       required:
 *         - userId
 *         - listingId
 *         - checkIn
 *         - checkOut
 *         - guests
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           example: "2c67240c-08f6-4577-9d10-e1c1e0865e3c"
 *         listingId:
 *           type: string
 *           format: uuid
 *           example: "08a735a7-7100-49b8-b867-437f060054d2"
 *         checkIn:
 *           type: string
 *           description: Accepts plain date "2026-06-01" or full ISO "2026-06-01T00:00:00Z"
 *           example: "2026-06-01"
 *         checkOut:
 *           type: string
 *           description: Accepts plain date "2026-06-20" or full ISO "2026-06-20T00:00:00Z"
 *           example: "2026-06-20"
 *         guests:
 *           type: integer
 *           example: 4
 *     PaginatedBookings:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Booking'
 *         meta:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             limit:
 *               type: integer
 *               example: 10
 *             total:
 *               type: integer
 *               example: 100
 *             totalPages:
 *               type: integer
 *               example: 10
 */
// ─────────────────────────────────────────────────────────────────────────────
// Static / non-parameterised routes first
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     summary: Get all bookings (admin)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated bookings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedBookings'
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, requireGuest, getAllBookings);
/**
 * @swagger
 * /api/v1/bookings:
 *   post:
 *     summary: Create a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       description: >
 *         totalPrice is auto-calculated (pricePerNight × nights).
 *         checkIn / checkOut accept plain dates ("2026-06-01") or full ISO strings.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingInput'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Validation error or invalid dates
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Listing or user not found
 *       409:
 *         description: Listing already booked for these dates
 */
router.post("/", authenticate, requireGuest, createBooking);
// ─────────────────────────────────────────────────────────────────────────────
// Dynamic /:id routes — registered after static routes
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   get:
 *     summary: Get a booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking UUID
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Booking not found
 */
router.get("/:id", authenticate, requireGuest, getBookingById);
/**
 * @swagger
 * /api/v1/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, CANCELLED]
 *                 example: CONFIRMED
 *     responses:
 *       200:
 *         description: Booking status updated
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Booking not found
 */
router.patch("/:id/status", authenticate, requireGuest, updateBookingStatus);
/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   delete:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking UUID
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Booking is already cancelled
 *       403:
 *         description: Not your booking
 *       404:
 *         description: Booking not found
 */
router.delete("/:id", authenticate, requireGuest, deleteBooking);
// ─────────────────────────────────────────────────────────────────────────────
// FIX 3: Register the getUserBookings route.
// Previously this handler was defined in the controller but never wired up,
// causing GET /users/:id/bookings to return a 404 HTML "Cannot GET" error.
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/bookings/user/{id}:
 *   get:
 *     summary: Get all bookings for a specific user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated bookings for the user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedBookings'
 *       404:
 *         description: User not found
 */
router.get("/user/:id", authenticate, requireGuest, getUserBookings);
export default router;
//# sourceMappingURL=bookings.routers.js.map