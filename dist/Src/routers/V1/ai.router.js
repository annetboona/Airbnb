import { Router } from "express";
import { naturalLanguageSearch, generateListingDescription, chat, } from "../../controllers/ai.controller.js";
import { authenticate } from "../../middleware/Auth.middleware.js";
const router = Router();
/**
 * @swagger
 * /api/v1/ai/search:
 *   post:
 *     summary: Search listings using natural language
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *                 example: "cozy apartment in New York for 2 people under $150"
 *     responses:
 *       200:
 *         description: Listings matching the natural language query
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:
 *                   type: string
 *                 extractedFilters:
 *                   type: object
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Listing'
 *                 count:
 *                   type: integer
 *       500:
 *         description: AI search failed
 */
router.post("/search", naturalLanguageSearch);
/**
 * @swagger
 * /api/v1/ai/generate-description:
 *   post:
 *     summary: Generate a listing description using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, location, type, guests, amenities, price]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Beachfront Villa"
 *               location:
 *                 type: string
 *                 example: "Miami, FL"
 *               type:
 *                 type: string
 *                 enum: [APARTMENT, HOUSE, VILLA, CABIN]
 *                 example: "VILLA"
 *               guests:
 *                 type: integer
 *                 example: 6
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Pool", "WiFi", "BBQ", "Beach access"]
 *               price:
 *                 type: number
 *                 example: 250
 *     responses:
 *       200:
 *         description: Generated listing description
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 description:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Generation failed
 */
router.post("/generate-description", authenticate, generateListingDescription);
/**
 * @swagger
 * /api/v1/ai/chat:
 *   post:
 *     summary: Chat with the Airbnb AI assistant
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message, sessionId]
 *             properties:
 *               message:
 *                 type: string
 *                 example: "What listings do you have in Miami?"
 *               sessionId:
 *                 type: string
 *                 description: >
 *                   A stable unique identifier for this conversation session.
 *                   Use a UUID or a string like "user-<userId>-session-<n>".
 *                   Do NOT pass a JWT token here.
 *                 example: "user-2c67240c-session-1"
 *     responses:
 *       200:
 *         description: AI response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                 sessionId:
 *                   type: string
 *       400:
 *         description: Missing fields or JWT passed as sessionId
 *       500:
 *         description: Chat failed
 */
router.post("/chat", chat);
export default router;
//# sourceMappingURL=ai.router.js.map