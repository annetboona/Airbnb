"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBooking = exports.updateBookingStatus = exports.createBooking = exports.getUserBookings = exports.getBookingById = exports.getAllBookings = void 0;
const express_1 = require("express");
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("../generated/prisma/client");
const Auth_middleware_1 = require("../middleware/Auth.middleware");
const email_1 = require("../config/email");
const booking_confirmation_template_1 = require("../templates/booking-confirmation.template");
const booking_cancellation_template_1 = require("../templates/booking-cancellation.template");
//  Error Handling
const handleBookingError = (res, error, operation) => {
    console.error(`[Booking Error] ${operation}:`, error);
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002")
            return res.status(409).json({ message: "A booking with these details already exists." });
        if (error.code === "P2025")
            return res.status(404).json({ message: "Booking not found." });
        if (error.code === "P2003")
            return res.status(400).json({ message: "Invalid foreign key: Check your guestId or listingId." });
    }
    return res.status(500).json({ message: "Something went wrong" });
};
// 1. Get all bookings 
const getAllBookings = async (req, res) => {
    try {
        const page = parseInt(req.query.page || "1");
        const limit = parseInt(req.query.limit || "10");
        const take = limit > 0 ? limit : 10;
        const skip = (page > 0 ? page - 1 : 0) * take;
        const [bookings, totalCount] = await Promise.all([
            prisma_1.default.booking.findMany({
                take,
                skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    guest: { select: { name: true, email: true } },
                    listing: { select: { title: true, location: true } }
                }
            }),
            prisma_1.default.booking.count(),
        ]);
        res.json({
            meta: {
                page,
                limit: take,
                total: totalCount,
                totalPages: Math.ceil(totalCount / take),
            },
            data: bookings,
        });
    }
    catch (error) {
        handleBookingError(res, error, "Get All Bookings");
    }
};
exports.getAllBookings = getAllBookings;
// 2. Get booking by ID 
const getBookingById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const booking = await prisma_1.default.booking.findUnique({
            where: { id },
            include: {
                guest: true,
                listing: true
            }
        });
        if (!booking)
            return res.status(404).json({ message: "Booking not found" });
        res.json(booking);
    }
    catch (error) {
        handleBookingError(res, error, "Get Booking By ID");
    }
};
exports.getBookingById = getBookingById;
const getUserBookings = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId))
            return res.status(400).json({ message: "Invalid user ID" });
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const page = parseInt(req.query.page || "1");
        const limit = parseInt(req.query.limit || "10");
        const take = limit > 0 ? limit : 10;
        const skip = (page > 0 ? page - 1 : 0) * take;
        const [bookings, totalCount] = await Promise.all([
            prisma_1.default.booking.findMany({
                where: { guestId: userId },
                take,
                skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    guest: { select: { name: true, email: true } },
                    listing: { select: { title: true, location: true } }
                }
            }),
            prisma_1.default.booking.count({ where: { guestId: userId } }),
        ]);
        res.json({
            meta: {
                page,
                limit: take,
                total: totalCount,
                totalPages: Math.ceil(totalCount / take),
            },
            data: bookings,
        });
    }
    catch (error) {
        handleBookingError(res, error, "Get User Bookings");
    }
};
exports.getUserBookings = getUserBookings;
// 3. Create booking 
const createBooking = async (req, res) => {
    try {
        const { userId, listingId, checkIn, checkOut, guests } = req.body;
        const guestId = req.userId;
        if (!guestId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!userId || !listingId || !checkIn || !checkOut || guests === undefined) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        if (parseInt(userId) !== guestId) {
            return res.status(401).json({ message: "User ID does not match authenticated user" });
        }
        const guest = await prisma_1.default.user.findUnique({ where: { id: guestId } });
        if (!guest)
            return res.status(404).json({ message: "User not found" });
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (start >= end) {
            return res.status(400).json({ message: "Check-in date must be before check-out date" });
        }
        if (start < today) {
            return res.status(400).json({ message: "Check-in date cannot be in the past" });
        }
        const parsedGuests = parseInt(guests);
        if (isNaN(parsedGuests) || parsedGuests <= 0) {
            return res.status(400).json({ message: "Guests must be a positive integer" });
        }
        const listing = await prisma_1.default.listing.findUnique({
            where: { id: parseInt(listingId) },
            include: { host: { select: { name: true } } }
        });
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }
        const conflictingBooking = await prisma_1.default.booking.findFirst({
            where: {
                listingId: listing.id,
                status: "CONFIRMED",
                AND: [
                    { checkIn: { lt: end } },
                    { checkOut: { gt: start } }
                ]
            }
        });
        if (conflictingBooking) {
            return res.status(409).json({ message: "The listing is already booked for these dates" });
        }
        const diffInTime = end.getTime() - start.getTime();
        const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));
        const totalPrice = diffInDays * listing.pricePerNight;
        const newBooking = await prisma_1.default.booking.create({
            data: {
                guestId,
                listingId: listing.id,
                checkIn: start,
                checkOut: end,
                totalPrice,
                guests: parsedGuests,
                status: "PENDING"
            },
            include: {
                guest: { select: { name: true, email: true } },
                listing: { select: { title: true, location: true } }
            }
        });
        // Send booking confirmation email
        if (newBooking.guest.email) {
            (0, email_1.sendEmail)(newBooking.guest.email, "Booking Confirmation - Airbnb 🏡", (0, booking_confirmation_template_1.bookingConfirmationTemplate)(newBooking.guest.name, newBooking.listing.title, newBooking.listing.location, start.toLocaleDateString(), end.toLocaleDateString(), diffInDays, totalPrice))
                .then(() => console.log(`✅ Booking confirmation email sent to ${newBooking.guest.email}`))
                .catch((err) => console.error(`❌ Booking confirmation email failed:`, err.message));
        }
        return res.status(201).json(newBooking);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.createBooking = createBooking;
// 4. Update Booking Status 
const updateBookingStatus = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;
        const updatedBooking = await prisma_1.default.booking.update({
            where: { id },
            data: { status }
        });
        res.json(updatedBooking);
    }
    catch (error) {
        handleBookingError(res, error, "Update Booking Status");
    }
};
exports.updateBookingStatus = updateBookingStatus;
// 5. Delete/Cancel booking
const deleteBooking = async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const booking = await prisma_1.default.booking.findUnique({
            where: { id: bookingId },
            include: {
                guest: { select: { name: true, email: true } },
                listing: { select: { title: true, location: true } }
            }
        });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        if (booking.guestId !== req.userId) {
            return res.status(403).json({ message: "You do not have permission to cancel this booking" });
        }
        if (booking.status === "CANCELLED") {
            return res.status(400).json({ message: "Booking is already cancelled" });
        }
        const cancelledBooking = await prisma_1.default.booking.update({
            where: { id: bookingId },
            data: { status: "CANCELLED" },
        });
        // Send cancellation email
        if (booking.guest.email) {
            (0, email_1.sendEmail)(booking.guest.email, "Booking Cancellation - Airbnb", (0, booking_cancellation_template_1.bookingCancellationTemplate)(booking.guest.name, booking.listing.title, booking.listing.location, booking.checkIn.toLocaleDateString(), booking.checkOut.toLocaleDateString()))
                .then(() => console.log(`✅ Cancellation email sent to ${booking.guest.email}`))
                .catch((err) => console.error(`❌ Cancellation email failed:`, err.message));
        }
        return res.status(200).json({
            message: "Booking cancelled successfully",
            booking: cancelledBooking,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.deleteBooking = deleteBooking;
//# sourceMappingURL=booking.controllers.js.map