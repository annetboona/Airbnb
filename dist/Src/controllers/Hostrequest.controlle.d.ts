import type { Response } from "express";
import type { AuthRequest } from "../middleware/Auth.middleware.js";
export declare const submitHostRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyHostRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAllHostRequests: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const approveHostRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rejectHostRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=Hostrequest.controlle.d.ts.map