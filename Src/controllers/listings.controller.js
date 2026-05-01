import prisma from "../config/prisma.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import { getCache, setCache, clearCacheByPrefix } from "../config/cache.js";
// 1. Get all listings 
export const getAllListings = async (req, res) => {
    try {
        const { location, type, minPrice, maxPrice, guests, page = "1", limit = "10" } = req.query;
        const take = parseInt(limit);
        const skip = (parseInt(page) - 1) * take;
        const cacheKey = `listings:${page}:${take}:${location ?? ""}:${type ?? ""}:${minPrice ?? ""}:${maxPrice ?? ""}:${guests ?? ""}`;
        const cachedListings = getCache(cacheKey);
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
            prisma.listing.findMany({
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
            prisma.listing.count({ where })
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
        setCache(cacheKey, response, 60);
        res.json(response);
    }
    catch (error) {
        res.status(500).json({ message: "Error retrieving listings", error });
    }
};
export const getListingsStats = async (req, res) => {
    try {
        const cachedStats = getCache("listingsStats");
        if (cachedStats) {
            return res.json(cachedStats);
        }
        const [totalListings, avgResult, byLocation, byType] = await Promise.all([
            prisma.listing.count(),
            prisma.listing.aggregate({
                _avg: { pricePerNight: true },
            }),
            prisma.listing.groupBy({
                by: ["location"],
                _count: { location: true },
            }),
            prisma.listing.groupBy({
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
        setCache("listingsStats", response, 300);
        return res.json(response);
    }
    catch (error) {
        console.error("Get listings stats error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
// 2. Get listing by ID
export const getListingsById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return res.status(400).json({ message: "Invalid ID format" });
        const listing = await prisma.listing.findUnique({
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
// 3. Create a new listing
export const createListings = async (req, res) => {
    try {
        const { title, description, location, pricePerNight, guests, type, amenities } = req.body;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Verify host exists
        const hostExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!hostExists) {
            return res.status(404).json({ message: "Host not found. Only registered users can host listings." });
        }
        const newListing = await prisma.listing.create({
            data: {
                title,
                description,
                location,
                pricePerNight: parseFloat(pricePerNight),
                guests: parseInt(guests),
                type,
                amenities,
                hostId: Number(userId),
            },
        });
        clearCacheByPrefix("listings");
        res.status(201).json(newListing);
    }
    catch (error) {
        res.status(400).json({ message: "Error creating listing. Check field types (price, guests, enum types).", error });
    }
};
// 4. Update a listing
export const updatingListings = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title, description, location, pricePerNight, guests, type, amenities } = req.body;
        const existing = await prisma.listing.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Listing not found" });
        }
        if (existing.hostId !== req.userId && req.role !== "ADMIN") {
            return res.status(403).json({ message: "You can only edit your own listings" });
        }
        const updatedData = {};
        if (title !== undefined)
            updatedData.title = title;
        if (description !== undefined)
            updatedData.description = description;
        if (location !== undefined)
            updatedData.location = location;
        if (pricePerNight !== undefined)
            updatedData.pricePerNight = parseFloat(pricePerNight);
        if (guests !== undefined)
            updatedData.guests = parseInt(guests);
        if (type !== undefined)
            updatedData.type = type;
        if (amenities !== undefined)
            updatedData.amenities = amenities;
        const updated = await prisma.listing.update({
            where: { id },
            data: updatedData,
        });
        clearCacheByPrefix("listings");
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: "Update failed", error });
    }
};
// 5. Delete a listing
export const deleteListings = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const existing = await prisma.listing.findUnique({
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
                await deleteFromCloudinary(photo.publicId);
            }
        }
        await prisma.listing.delete({ where: { id } });
        clearCacheByPrefix("listings");
        res.status(200).json({ message: "Listing and all photos deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Delete failed. Ensure this listing has no active bookings.", error });
    }
};
// 6. Upload listing photos (up to 5)
export const uploadListingPhotos = async (req, res) => {
    try {
        const listingId = parseInt(req.params.id);
        // Check if files were uploaded
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }
        // Find the listing
        const listing = await prisma.listing.findUnique({
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
            const { url, publicId } = await uploadToCloudinary(file.buffer, "airbnb/listings");
            // Save to database
            const photo = await prisma.listingPhoto.create({
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
// 7. Delete listing photo
export const deleteListingPhoto = async (req, res) => {
    try {
        const photoId = parseInt(req.params.photoId);
        // Find the photo with listing info
        const photo = await prisma.listingPhoto.findUnique({
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
            await deleteFromCloudinary(photo.publicId);
        }
        // Delete from database
        await prisma.listingPhoto.delete({
            where: { id: photoId }
        });
        res.status(200).json({ message: "Photo deleted successfully" });
    }
    catch (error) {
        console.error('Delete listing photo error:', error);
        res.status(500).json({ message: "Error deleting photo", error: error.message });
    }
};
