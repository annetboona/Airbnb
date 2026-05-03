import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/Auth.middleware.js";
export declare const getListingReviews: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createListingReview: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteReview: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=review.controllers.d.ts.map