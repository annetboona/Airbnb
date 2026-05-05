import { Router } from "express";
import authRouter from "./auth.router.js";
import usersRouter from "./user.router.js";
import listingsRouter from "./listings.routers.js";
import bookingsRouter from "./bookings.routers.js";
import { deleteReview } from "../../controllers/review.controllers.js";
import { authenticate } from "../../middleware/Auth.middleware.js";

const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/users", usersRouter);
v1Router.use("/listings", listingsRouter);
v1Router.use("/bookings", bookingsRouter);

// Standalone route for deleting reviews by review ID
v1Router.delete("/reviews/:id", authenticate, deleteReview);

export default v1Router;