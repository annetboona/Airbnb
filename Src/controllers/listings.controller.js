"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteListingPhoto = exports.uploadListingPhotos = exports.deleteListings = exports.updatingListings = exports.createListings = exports.getListingsById = exports.getListingsStats = exports.getAllListings = void 0;
const express_1 = require("express");
const prisma_1 = __importDefault(require("../config/prisma"));
const Auth_middleware_1 = require("../middleware/Auth.middleware");
const cloudinary_1 = require("../config/cloudinary");
const cache_1 = require("../config/cache");
// 1. Get all listings 
const getAllListings = async (req, res) => {
    try {
        const { location, type, minPrice, maxPrice, guests, page = "1", limit = "10" } = req.query;
        const take = parseInt(limit);
        const skip = (parseInt(page) - 1) * take;
        const cacheKey = `listings:${page}:${take}:${location ?? ""}:${type ?? ""}:${minPrice ?? ""}:${maxPrice ?? ""}:${guests ?? ""}`;
        const cachedListings = (0, cache_1.getCache)(cacheKey);
        if (cachedListings) {
            return res.json(cachedListings);
        }
        // Build Filter Object
        const where = {};
        if (location) {
            where.location = { contains: location, mode: "insensitive" };
        }
        if (type) {
            where.type = type;
        }
        const priceFilter = {};
        if (minPrice) {
            priceFilter.gte = parseFloat(minPrice);
        }
        if (maxPrice) {
            priceFilter.lte = parseFloat(maxPrice);
        }
        if (Object.keys(priceFilter).length > 0) {
            where.pricePerNight = priceFilter;
        }
        if (guests) {
            where.guests = { gte: parseInt(guests) };
        }
        const [listings, totalCount] = await Promise.all([
            prisma_1.default.listing.findMany({
                where,
                take,
                skip,
                include: {
                    host: {
                        select: { name: true, email: true },
                    },
                    photos: true, // Include photos
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma_1.default.listing.count({ where })
        ]);
        const response = {
            meta: {
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / take),
                currentPage: parseInt(page),
                limit: take,
            },
            data: listings,
        };
        (0, cache_1.setCache)(cacheKey, response, 60);
        res.json(response);
    }
    catch (error) {
        res.status(500).json({ message: "Error retrieving listings", error });
    }
};
exports.getAllListings = getAllListings;
const getListingsStats = async (req, res) => {
    try {
        const cachedStats = (0, cache_1.getCache)("listingsStats");
        if (cachedStats) {
            return res.json(cachedStats);
        }
        const [totalListings, avgResult, byLocation, byType] = await Promise.all([
            prisma_1.default.listing.count(),
            prisma_1.default.listing.aggregate({
                _avg: { pricePerNight: true },
            }),
            prisma_1.default.listing.groupBy({
                by: ["location"],
                _count: { location: true },
            }),
            prisma_1.default.listing.groupBy({
                by: ["type"],
                _count: { type: true },
            }),
        ]);
        const response = {
            totalListings,
            averagePrice: Number((avgResult._avg.pricePerNight ?? 0).toFixed(2)),
            byLocation,
            byType,
        };
        (0, cache_1.setCache)("listingsStats", response, 300);
        return res.json(response);
    }
    catch (error) {
        console.error("Get listings stats error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getListingsStats = getListingsStats;
// 2. Get listing by ID
const getListingsById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return res.status(400).json({ message: "Invalid ID format" });
        const listing = await prisma_1.default.listing.findUnique({
            where: { id },
            include: {
                host: true,
                photos: true, // Include photos
                bookings: {
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                },
            },
        });
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }
        res.json(listing);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getListingsById = getListingsById;
// 3. Create a new listing
const createListings = async (req, res) => {
    try {
        const { title, description, location, pricePerNight, guests, type, amenities } = req.body;
        // Verify host exists
        const hostExists = await prisma_1.default.user.findUnique({ where: { id: req.userId } });
        if (!hostExists) {
            return res.status(404).json({ message: "Host not found. Only registered users can host listings." });
        }
        const newListing = await prisma_1.default.listing.create({
            data: {
                title,
                description,
                location,
                pricePerNight: parseFloat(pricePerNight),
                guests: parseInt(guests),
                type,
                amenities,
                hostId: Number(req.userId),
            },
        });
        (0, cache_1.clearCacheByPrefix)("listings");
        res.status(201).json(newListing);
    }
    catch (error) {
        res.status(400).json({ message: "Error creating listing. Check field types (price, guests, enum types).", error });
    }
};
exports.createListings = createListings;
// 4. Update a listing
const updatingListings = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title, description, location, pricePerNight, guests, type, amenities } = req.body;
        const existing = await prisma_1.default.listing.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Listing not found" });
        }
        if (existing.hostId !== req.userId && req.role !== "ADMIN") {
            return res.status(403).json({ message: "You can only edit your own listings" });
        }
        const updated = await prisma_1.default.listing.update({
            where: { id },
            data: {
                title,
                description,
                location,
                pricePerNight: pricePerNight ? parseFloat(pricePerNight) : undefined,
                guests: guests ? parseInt(guests) : undefined,
                type,
                amenities
            },
        });
        (0, cache_1.clearCacheByPrefix)("listings");
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: "Update failed", error });
    }
};
exports.updatingListings = updatingListings;
// 5. Delete a listing
const deleteListings = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const existing = await prisma_1.default.listing.findUnique({
            where: { id },
            include: { photos: true }
        });
        if (!existing) {
            return res.status(404).json({ message: "Listing not found" });
        }
        if (existing.hostId !== req.userId && req.role !== "ADMIN") {
            return res.status(403).json({ message: "You can only delete your own listings" });
        }
        // Delete all photos from Cloudinary
        for (const photo of existing.photos) {
            if (photo.publicId) {
                await (0, cloudinary_1.deleteFromCloudinary)(photo.publicId);
            }
        }
        await prisma_1.default.listing.delete({ where: { id } });
        (0, cache_1.clearCacheByPrefix)("listings");
        res.status(200).json({ message: "Listing and all photos deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Delete failed. Ensure this listing has no active bookings.", error });
    }
};
exports.deleteListings = deleteListings;
// 6. Upload listing photos (up to 5)
const uploadListingPhotos = async (req, res) => {
    try {
        const listingId = parseInt(req.params.id);
        // Check if files were uploaded
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }
        // Find the listing
        const listing = await prisma_1.default.listing.findUnique({
            where: { id: listingId },
            include: { photos: true }
        });
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }
        // Ownership check
        if (listing.hostId !== req.userId) {
            return res.status(403).json({ message: "You can only upload photos to your own listings" });
        }
        // Check photo limit (max 5 photos per listing)
        const currentPhotoCount = listing.photos.length;
        const newPhotoCount = req.files.length;
        if (currentPhotoCount + newPhotoCount > 5) {
            return res.status(400).json({
                message: `Cannot upload ${newPhotoCount} photos. Listing already has ${currentPhotoCount} photos. Maximum is 5 photos per listing.`
            });
        }
        // Upload all photos to Cloudinary
        const uploadedPhotos = [];
        for (const file of req.files) {
            const { url, publicId } = await (0, cloudinary_1.uploadToCloudinary)(file.buffer, "airbnb/listings");
            // Save to database
            const photo = await prisma_1.default.listingPhoto.create({
                data: {
                    url,
                    publicId,
                    listingId
                }
            });
            uploadedPhotos.push(photo);
        }
        res.status(200).json({
            message: `${uploadedPhotos.length} photo(s) uploaded successfully`,
            photos: uploadedPhotos
        });
    }
    catch (error) {
        console.error('Upload listing photos error:', error);
        res.status(500).json({ message: "Error uploading photos", error: error.message });
    }
};
exports.uploadListingPhotos = uploadListingPhotos;
// 7. Delete listing photo
const deleteListingPhoto = async (req, res) => {
    try {
        const photoId = parseInt(req.params.photoId);
        // Find the photo with listing info
        const photo = await prisma_1.default.listingPhoto.findUnique({
            where: { id: photoId },
            include: { listing: true }
        });
        if (!photo) {
            return res.status(404).json({ message: "Photo not found" });
        }
        // Ownership check - photo belongs to listing, listing belongs to user
        if (photo.listing.hostId !== req.userId) {
            return res.status(403).json({ message: "You can only delete photos from your own listings" });
        }
        // Delete from Cloudinary
        if (photo.publicId) {
            await (0, cloudinary_1.deleteFromCloudinary)(photo.publicId);
        }
        // Delete from database
        await prisma_1.default.listingPhoto.delete({
            where: { id: photoId }
        });
        res.status(200).json({ message: "Photo deleted successfully" });
    }
    catch (error) {
        console.error('Delete listing photo error:', error);
        res.status(500).json({ message: "Error deleting photo", error: error.message });
    }
};
exports.deleteListingPhoto = deleteListingPhoto;
//# sourceMappingURL=listings.controller.js.map