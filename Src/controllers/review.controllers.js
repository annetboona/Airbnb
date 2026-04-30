"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.createListingReview = exports.getListingReviews = void 0;
const express_1 = require("express");
const prisma_1 = __importDefault(require("../config/prisma"));
const Auth_middleware_1 = require("../middleware/Auth.middleware");
const cache_1 = require("../config/cache");
const CACHE_TTL = 30;
const getListingReviews = async (req, res) => {
    try {
        const listingId = parseInt(req.params.id);
        if (isNaN(listingId))
            return res.status(400).json({ message: "Invalid listing ID" });
        const page = parseInt(req.query.page || "1");
        const limit = parseInt(req.query.limit || "10");
        const take = limit > 0 ? limit : 10;
        const skip = (page > 0 ? page - 1 : 0) * take;
        const listing = await prisma_1.default.listing.findUnique({ where: { id: listingId } });
        if (!listing)
            return res.status(404).json({ message: "Listing not found" });
        const cacheKey = `listingReviews:${listingId}:${page}:${take}`;
        const cached = (0, cache_1.getCache)(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        const [reviews, totalCount] = await Promise.all([
            prisma_1.default.review.findMany({
                where: { listingId },
                take,
                skip,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: { name: true, avatar: true },
                    },
                },
            }),
            prisma_1.default.review.count({ where: { listingId } }),
        ]);
        const response = {
            meta: {
                page,
                limit: take,
                total: totalCount,
                totalPages: Math.ceil(totalCount / take),
            },
            data: reviews,
        };
        (0, cache_1.setCache)(cacheKey, response, CACHE_TTL);
        return res.json(response);
    }
    catch (error) {
        console.error("Get listing reviews error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getListingReviews = getListingReviews;
const createListingReview = async (req, res) => {
    try {
        const listingId = parseInt(req.params.id);
        const { userId, rating, comment } = req.body;
        if (isNaN(listingId))
            return res.status(400).json({ message: "Invalid listing ID" });
        if (!userId || rating === undefined || comment === undefined) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        if (parseInt(userId) !== req.userId) {
            return res.status(401).json({ message: "User ID does not match authenticated user" });
        }
        const parsedRating = parseInt(rating);
        if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }
        const [user, listing] = await Promise.all([
            prisma_1.default.user.findUnique({ where: { id: req.userId } }),
            prisma_1.default.listing.findUnique({ where: { id: listingId } }),
        ]);
        if (!listing)
            return res.status(404).json({ message: "Listing not found" });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const newReview = await prisma_1.default.review.create({
            data: {
                userId: user.id,
                listingId,
                rating: parsedRating,
                comment,
            },
            include: {
                user: {
                    select: { name: true, avatar: true },
                },
            },
        });
        (0, cache_1.clearCacheByPrefix)(`listingReviews:${listingId}:`);
        return res.status(201).json(newReview);
    }
    catch (error) {
        console.error("Create listing review error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.createListingReview = createListingReview;
const deleteReview = async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        if (isNaN(reviewId))
            return res.status(400).json({ message: "Invalid review ID" });
        const existingReview = await prisma_1.default.review.findUnique({ where: { id: reviewId } });
        if (!existingReview)
            return res.status(404).json({ message: "Review not found" });
        await prisma_1.default.review.delete({ where: { id: reviewId } });
        (0, cache_1.clearCacheByPrefix)(`listingReviews:${existingReview.listingId}:`);
        return res.status(200).json({ message: "Review deleted successfully" });
    }
    catch (error) {
        console.error("Delete review error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.deleteReview = deleteReview;
//# sourceMappingURL=review.controllers.js.map