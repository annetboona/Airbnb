import { Request, Response, NextFunction } from "express";
export declare const generalRateLimiter: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const strictRateLimiter: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=rateLimiter.d.ts.map