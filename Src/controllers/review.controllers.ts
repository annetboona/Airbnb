import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../middleware/Auth.middleware.js";
import { getCache, setCache, clearCacheByPrefix } from "../config/cache.js";

const CACHE_TTL = 30;

export const getListingReviews = async (req: Request, res: Response) => {
  try {
    const listingId = parseInt(req.params.id as string);
    if (isNaN(listingId)) return res.status(400).json({ message: "Invalid listing ID" });

    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "10");
    const take = limit > 0 ? limit : 10;
    const skip = (page > 0 ? page - 1 : 0) * take;

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const cacheKey = `listingReviews:${listingId}:${page}:${take}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
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
      prisma.review.count({ where: { listingId } }),
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

    setCache(cacheKey, response, CACHE_TTL);
    return res.json(response);
  } catch (error) {
    console.error("Get listing reviews error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createListingReview = async (req: AuthRequest, res: Response) => {
  try {
    const listingId = parseInt(req.params.id as string);
    const { userId, rating, comment } = req.body;

    if (isNaN(listingId)) return res.status(400).json({ message: "Invalid listing ID" });
    if (!userId || rating === undefined || comment === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (parseInt(userId as string) !== req.userId) {
      return res.status(401).json({ message: "User ID does not match authenticated user" });
    }

    const parsedRating = parseInt(rating as string);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const [user, listing] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.userId! } }),
      prisma.listing.findUnique({ where: { id: listingId } }),
    ]);

    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (!user) return res.status(404).json({ message: "User not found" });

    const newReview = await prisma.review.create({
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

    clearCacheByPrefix(`listingReviews:${listingId}:`);

    return res.status(201).json(newReview);
  } catch (error) {
    console.error("Create listing review error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id as string);
    if (isNaN(reviewId)) return res.status(400).json({ message: "Invalid review ID" });

    const existingReview = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existingReview) return res.status(404).json({ message: "Review not found" });

    await prisma.review.delete({ where: { id: reviewId } });

    clearCacheByPrefix(`listingReviews:${existingReview.listingId}:`);

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
