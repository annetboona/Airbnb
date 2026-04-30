"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateListingSchema = exports.createListingSchema = void 0;
const zod_1 = require("zod");
exports.createListingSchema = zod_1.z.object({
    title: zod_1.z.string().min(5, "Title must be at least 5 characters"),
    description: zod_1.z.string().min(10, "Description must be at least 10 characters"),
    location: zod_1.z.string().min(2, "Location is required"),
    pricePerNight: zod_1.z.number().positive("Price must be a positive number"),
    guests: zod_1.z.number().int().min(1, "Must allow at least 1 guest"),
    type: zod_1.z.enum(["APARTMENT", "HOUSE", "VILLA", "CABIN"]),
    amenities: zod_1.z.array(zod_1.z.string()).min(1, "At least one amenity is required"),
});
exports.updateListingSchema = exports.createListingSchema.partial();
//# sourceMappingURL=validator.listings.js.map