import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Rental API",
      version: "1.0.0",
      description: "API documentation for the rental platform",
    },
    components: {
      securitySchemes:{
        bearerAuth:{
          type:"http",
          scheme:"bearer",
          bearerFormat:"JWT"
        }
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            username: { type: "string" },
            phone: { type: "string" },
            role: { type: "string", enum: ["host", "guest"] },
            avatar: { type: "string", nullable: true },
            bio: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
          required: ["id", "name", "email", "username", "phone", "role", "createdAt"],
        },
        Listing: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            description: { type: "string" },
            location: { type: "string" },
            pricePerNight: { type: "number", format: "float" },
            guests: { type: "integer" },
            type: { type: "string", enum: ["apartment", "house", "villa", "cabin"] },
            amenities: { type: "array", items: { type: "string" } },
            rating: { type: "number", format: "float", nullable: true },
            userId: { type: "integer" },
            host: { $ref: "#/components/schemas/User" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Booking: {
          type: "object",
          properties: {
            id: { type: "integer" },
            checkIn: { type: "string", format: "date-time" },
            checkOut: { type: "string", format: "date-time" },
            total: { type: "number", format: "float" },
            status: { type: "string", enum: ["confirmed", "cancelled"] },
            userId: { type: "integer" },
            listingId: { type: "integer" },
            user: { $ref: "#/components/schemas/User" },
            listing: { $ref: "#/components/schemas/Listing" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Review: {
          type: "object",
          properties: {
            id: { type: "integer" },
            rating: { type: "integer", minimum: 1, maximum: 5 },
            comment: { type: "string" },
            userId: { type: "integer" },
            listingId: { type: "integer" },
            user: { $ref: "#/components/schemas/User" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        RegisterInput: {
          type: "object",
          required: ["name", "email", "username", "phone", "password", "role"],
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            username: { type: "string" },
            phone: { type: "string" },
            password: { type: "string" },
            role: { type: "string", enum: ["host", "guest"] },
          },
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
        CreateListingInput: {
          type: "object",
          required: ["title", "description", "location", "pricePerNight", "guests", "type", "amenities"],
          properties: {
            title: { type: "string", example: "Cosy Cabin in the Hills" },
            description: { type: "string", example: "A peaceful retreat with stunning views and modern amenities." },
            location: { type: "string", example: "Musanze, Rwanda" },
            pricePerNight: { type: "number", format: "float", example: 85.00 },
            guests: { type: "integer", example: 4 },
            type: { type: "string", enum: ["apartment", "house", "villa", "cabin"], example: "cabin" },
            amenities: { type: "array", items: { type: "string" }, example: ["WiFi", "Hot tub", "Fireplace"] },
          },
        },
        CreateBookingInput: {
          type: "object",
          required: ["listingId", "userId", "checkIn", "checkOut"],
          properties: {
            listingId: { type: "integer" },
            userId: { type: "integer" },
            checkIn: { type: "string", format: "date-time" },
            checkOut: { type: "string", format: "date-time" },
          },
        },
        CreateReviewInput: {
          type: "object",
          required: ["userId", "rating", "comment"],
          properties: {
            userId: { type: "integer" },
            rating: { type: "integer", minimum: 1, maximum: 5 },
            comment: { type: "string" },
          },
        },
        CreateUserInput: {
          type: "object",
          required: ["name", "email", "username", "phone", "password", "role"],
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            username: { type: "string" },
            phone: { type: "string" },
            password: { type: "string" },
            role: { type: "string", enum: ["host", "guest"] },
            avatar: { type: "string", nullable: true },
            bio: { type: "string", nullable: true },
          },
        },
        UpdateUserInput: {
          type: "object",
          properties: {
            name: { type: "string" },
            username: { type: "string" },
            phone: { type: "string" },
            bio: { type: "string" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string", example: "Resource not found" },
          },
        },
      },
    },

    security:[
      {
        bearerAuth:[],
      }
    ]
  },
  apis: [
  "./Src/routers/**/*.ts",
],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}