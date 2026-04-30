"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBookingSchema = void 0;
const zod_1 = require("zod");
exports.createBookingSchema = zod_1.z.object({
    listingId: zod_1.z.number().int().positive(),
    checkIn: zod_1.z.string().datetime("Invalid checkIn date"),
    checkOut: zod_1.z.string().datetime("Invalid checkOut date"),
}).refine((data) => new Date(data.checkIn) < new Date(data.checkOut), { message: "checkIn must be before checkOut", path: ["checkIn"] }).refine((data) => new Date(data.checkIn) > new Date(), { message: "checkIn must be in the future", path: ["checkIn"] });
//# sourceMappingURL=validator.bookings.js.map