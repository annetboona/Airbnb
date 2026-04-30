import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import compression from 'compression';
import userRouter from './routers/user.router';
import listingsRouter from './routers/listings.routers'
import authRouter from "./routers/auth.router"
import bookinksRouter from './routers/bookings.routers'
import reviewsRouter from './routers/reviews.routers'
import uploadRouter from "./routers/upload.router.js";
import { connectDB } from './config/prisma'
import { generalRateLimiter, strictRateLimiter } from './middlewares/rateLimiter'
console.log("Database URL Check:", process.env.DATABASE_URL);

import { setupSwagger } from "./config/swagger.config.js";

const app = express();
const PORT = 3000;
setupSwagger(app);

app.use(compression());
app.use(generalRateLimiter);
app.use(strictRateLimiter);
app.use(express.json());
app.use("/api/upload", uploadRouter);
app.use("/api/users", userRouter);
app.use("/api/listings", listingsRouter)
app.use("/api/auth", authRouter)
app.use('/api/bookings', bookinksRouter)
app.use('/api', reviewsRouter)
connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });