import type { Request, Response, NextFunction } from "express";
export interface AuthRequest extends Request {
    userId?: string | undefined;
    role?: string | undefined;
    file?: Express.Multer.File | undefined;
}
export declare function authenticate(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function requireHost(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function requireGuest(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=Auth.middleware.d.ts.map