import { Router } from "express";
import {
  createListings,
  deleteListingPhoto,
  getAllListings,
  getListingsById,
  getListingsStats,
  updatingListings,
  deleteListings,
  uploadListingPhotos,
} from "../controllers/listings.controller.js";
import { authenticate, requireHost } from "../middleware/Auth.middleware.js";
import upload from "../config/multer.config.js";

const router = Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     Listing:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         type:
 *           type: string
 *           enum: [apartment, house, villa, cabin]
 *           example: apartment
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled]
 *           example: confirmed
 *         host:
 *           $ref: '#/components/schemas/User'
 *         bookings:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Booking'
 *     CreateListingInput:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - location
 *         - pricePerNight
 *         - guests
 *         - type
 *         - amenities
 *       properties:
 *         title:
 *           type: string
 *           example: "Cosy Cabin in the Hills"
 *         description:
 *           type: string
 *           example: "A peaceful retreat with stunning views and modern amenities."
 *         location:
 *           type: string
 *           example: "Musanze, Rwanda"
 *         pricePerNight:
 *           type: number
 *           format: float
 *           example: 85.00
 *         guests:
 *           type: integer
 *           example: 4
 *         type:
 *           type: string
 *           enum: [apartment, house, villa, cabin]
 *           example: cabin
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           example: ["WiFi", "Hot tub", "Fireplace"]
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Resource not found"
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         checkIn:
 *           type: string
 *           format: date-time
 *         checkOut:
 *           type: string
 *           format: date-time
 *         total:
 *           type: number
 *           format: float
 *         status:
 *           type: string
 *           enum: [confirmed, cancelled]
 *         userId:
 *           type: integer
 *         listingId:
 *           type: integer
 *         user:
 *           $ref: '#/components/schemas/User'
 *         listing:
 *           $ref: '#/components/schemas/Listing'
 *         createdAt:
 *           type: string
 *           format: date-time
 *     PaginatedListings:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Listing'
 *         meta:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             total:
 *               type: integer
 *             totalPages:
 *               type: integer
 *     ListingWithReviews:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         location:
 *           type: string
 *         pricePerNight:
 *           type: number
 *           format: float
 *         guests:
 *           type: integer
 *         type:
 *           type: string
 *           enum: [apartment, house, villa, cabin]
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *         rating:
 *           type: number
 *           format: float
 *           nullable: true
 *         userId:
 *           type: integer
 *         host:
 *           $ref: '#/components/schemas/User'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         reviews:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Review'
 *     UpdateListingInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         location:
 *           type: string
 *         pricePerNight:
 *           type: number
 *           format: float
 *         guests:
 *           type: integer
 *         type:
 *           type: string
 *           enum: [apartment, house, villa, cabin]
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *         rating:
 *           type: number
 *           format: float
 *     ListingsStats:
 *       type: object
 *       properties:
 *         totalListings:
 *           type: integer
 *         averagePrice:
 *           type: number
 *           format: float
 *         byLocation:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *         byType:
 *           type: object
 *           additionalProperties:
 *             type: integer
 */

/**
 * @swagger
 * /api/listings:
 *   get:
 *     summary: Get all listings
 *     tags: [Listings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [apartment, house, villa, cabin]
 *         description: Filter by type
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price per night
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price per night
 *       - in: query
 *         name: guests
 *         schema:
 *           type: integer
 *         description: Minimum number of guests
 *     responses:
 *       200:
 *         description: Paginated list of listings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedListings'
 */
router.get("/", getAllListings);

/**
 * @swagger
 * /api/listings/{id}:
 *   get:
 *     summary: Retrieve a listing by ID
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the listing to retrieve
 *     responses:
 *       200:
 *         description: Listing retrieved successfully with host and reviews
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListingWithReviews'
 *       404:
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", getListingsById);

/**
 * @swagger
 * /api/listings:
 *   post:
 *     summary: Create a new listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateListingInput'
 *     responses:
 *       201:
 *         description: Listing created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", authenticate, requireHost, createListings);

/**
 * @swagger
 * /api/listings/{id}:
 *   put:
 *     summary: Update a listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the listing to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateListingInput'
 *     responses:
 *       200:
 *         description: Listing updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/:id", authenticate, requireHost, updatingListings);

/**
 * @swagger
 * /api/listings/{id}:
 *   delete:
 *     summary: Delete a listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the listing to delete
 *     responses:
 *       200:
 *         description: Listing deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", authenticate, requireHost, deleteListings);

/**
 * @swagger
 * /api/listings/search:
 *   get:
 *     summary: Search listings
 *     tags: [Listings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [apartment, house, villa, cabin]
 *         description: Filter by type
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price per night
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price per night
 *       - in: query
 *         name: guests
 *         schema:
 *           type: integer
 *         description: Minimum number of guests
 *     responses:
 *       200:
 *         description: Paginated list of listings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedListings'
 */
router.get("/search", getAllListings);

/**
 * @swagger
 * /api/listings/stats:
 *   get:
 *     summary: Get listings statistics
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: Listings statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListingsStats'
 */
router.get("/stats", getListingsStats);

/**
 * @swagger
 * /api/listings/{id}/photos:
 */
router.post(
  "/:id/photos",
  authenticate,
  requireHost,
  upload.array("photos", 5),
  uploadListingPhotos
);

router.delete("/photos/:photoId", authenticate, requireHost, deleteListingPhoto);

export default router;