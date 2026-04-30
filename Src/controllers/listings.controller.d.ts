import { Request, Response } from "express";
import { AuthRequest } from "../middleware/Auth.middleware";
export declare const getAllListings: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getListingsStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getListingsById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createListings: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updatingListings: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteListings: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const uploadListingPhotos: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteListingPhoto: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=listings.controller.d.ts.map