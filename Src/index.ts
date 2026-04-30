import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import userRouter from './routers/user.router';
import listingsRouter from './routers/listings.routers'
import authRouter from "./routers/auth.router"
import bookinksRouter from './routers/bookings.routers'
import uploadRouter from "./routers/upload.router.js";
import {connectDB} from './config/prisma'
console.log("Database URL Check:", process.env.DATABASE_URL);

import { setupSwagger } from "./config/swagger.js";

const app = express();
const PORT = 3000;
setupSwagger(app);

app.use(express.json());
app.use("/api/upload", uploadRouter);
app.use("/api/users", userRouter);
app.use("/api/listings", listingsRouter)
app.use("/api/auth", authRouter)
app.use('/api/bookings', bookinksRouter)
connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });