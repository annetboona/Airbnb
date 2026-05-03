import { Router } from "express";
import authRouter from "./auth.router.js";
import usersRouter from "./user.router.js";
import listingsRouter from "./listings.routers.js";
import bookingsRouter from "./bookings.routers.js";
import reviewsRouter from "./reviews.routers.js";

const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/users", usersRouter);
v1Router.use("/listings", listingsRouter);
v1Router.use("/bookings", bookingsRouter);
v1Router.use("/reviews", reviewsRouter);

export default v1Router;