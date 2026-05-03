import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import morgan from 'morgan';
import userRouter from './routers/V1/user.router.js';
import listingsRouter from './routers/V1/listings.routers.js';
import authRouter from "./routers/V1/auth.router.js";
import bookingsRouter from './routers/V1/bookings.routers.js';
import uploadRouter from "./routers/V1/upload.router.js";
import { connectDB } from './config/prisma.js';
import v1Router from "./routers/V1/index.js";
import { setupSwagger } from "./config/swagger.js";
console.log("Database URL Check:", process.env.DATABASE_URL);
const app = express();
const PORT = 3000;
setupSwagger(app);
app.use(express.json());
app.use(process.env["NODE_ENV"] === "production" ? morgan("combined") : morgan("dev"));
app.use("/api/v1", v1Router);
app.use("/api/upload", uploadRouter);
app.use("/api/users", userRouter);
app.use("/api/listings", listingsRouter);
app.use("/api/auth", authRouter);
app.use('/api/bookings', bookingsRouter);
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date()
    });
});
connectDB();
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map