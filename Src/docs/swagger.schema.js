"use strict";
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: Jane Doe
 *         email:
 *           type: string
 *           format: email
 *           example: jane@example.com
 *         username:
 *           type: string
 *           example: janedoe
 *         phone:
 *           type: string
 *           example: "+250788000000"
 *         role:
 *           type: string
 *           enum: ["host", "guest"]
 *           example: guest
 *         avatar:
 *           type: string
 *           nullable: true
 *           example: "https://cdn.example.com/avatars/jane.jpg"
 *         bio:
 *           type: string
 *           nullable: true
 *           example: "Loves mountain hiking and cosy cabins."
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T09:30:00.000Z"
 *
 *     Listing:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 42
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
 *         rating:
 *           type: number
 *           format: float
 *           nullable: true
 *           example: 4.7
 *         userId:
 *           type: integer
 *           example: 1
 *         host:
 *           $ref: '#/components/schemas/User'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-02-01T12:00:00.000Z"
 *
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 7
 *         checkIn:
 *           type: string
 *           format: date-time
 *           example: "2024-06-01T14:00:00.000Z"
 *         checkOut:
 *           type: string
 *           format: date-time
 *           example: "2024-06-07T11:00:00.000Z"
 *         total:
 *           type: number
 *           format: float
 *           example: 510.00
 *         status:
 *           type: string
 *           enum: [confirmed, cancelled]
 *           example: confirmed
 *         userId:
 *           type: integer
 *           example: 3
 *         listingId:
 *           type: integer
 *           example: 42
 *         user:
 *           $ref: '#/components/schemas/User'
 *         listing:
 *           $ref: '#/components/schemas/Listing'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-05-10T08:45:00.000Z"
 *
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 15
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 *         comment:
 *           type: string
 *           example: "Absolutely wonderful stay — will be back!"
 *         userId:
 *           type: integer
 *           example: 3
 *         listingId:
 *           type: integer
 *           example: 42
 *         user:
 *           $ref: '#/components/schemas/User'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-06-08T10:00:00.000Z"
 *
 *     RegisterInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - username
 *         - phone
 *         - password
 *         - role
 *       properties:
 *         name:
 *           type: string
 *           example: Jane Doe
 *         email:
 *           type: string
 *           format: email
 *           example: jane@example.com
 *         username:
 *           type: string
 *           example: janedoe
 *         phone:
 *           type: string
 *           example: "+250788000000"
 *         password:
 *           type: string
 *           format: password
 *           example: "S3cur3P@ssw0rd!"
 *         role:
 *           type: string
 *           enum: [host, guest]
 *           example: guest
 *
 *     LoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: jane@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: "S3cur3P@ssw0rd!"
 *
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
 *
 *     CreateBookingInput:
 *       type: object
 *       required:
 *         - listingId
 *         - userId
 *         - checkIn
 *         - checkOut
 *         - guests
 *       properties:
 *         listingId:
 *           type: integer
 *           example: 42
 *         userId:
 *           type: integer
 *           example: 3
 *         checkIn:
 *           type: string
 *           format: date-time
 *           example: "2024-06-01T14:00:00.000Z"
 *         checkOut:
 *           type: string
 *           format: date-time
 *           example: "2024-06-07T11:00:00.000Z"
 *         guests:
 *           type: integer
 *           example: 2
 *
 *     CreateReviewInput:
 *       type: object
 *       required:
 *         - userId
 *         - rating
 *         - comment
 *       properties:
 *         userId:
 *           type: integer
 *           example: 3
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 *         comment:
 *           type: string
 *           example: "Absolutely wonderful stay — will be back!"
 *
 *     CreateUserInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - username
 *         - phone
 *         - password
 *         - role
 *       properties:
 *         name:
 *           type: string
 *           example: Jane Doe
 *         email:
 *           type: string
 *           format: email
 *           example: jane@example.com
 *         username:
 *           type: string
 *           example: janedoe
 *         phone:
 *           type: string
 *           example: "+250788000000"
 *         password:
 *           type: string
 *           format: password
 *           example: "S3cur3P@ssw0rd!"
 *         role:
 *           type: string
 *           enum: [host, guest]
 *           example: guest
 *
 *     UpdateUserInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Jane Doe
 *         username:
 *           type: string
 *           example: janedoe
 *         phone:
 *           type: string
 *           example: "+250788000000"
 *         bio:
 *           type: string
 *           example: "Loves mountain hiking and cosy cabins."
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiJ9..."
 *         user:
 *           $ref: '#/components/schemas/User'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Resource not found"
 */
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=swagger.schema.js.map