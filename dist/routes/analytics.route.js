import express from "express";
import { isAuthenticated, isAuthorOrAdmin } from "../middlewares/auth.js";
import { getPostAnalytics } from "../controllers/analytic.controller.js";
const router = express.Router();
router.get("/post-analytics/:days", isAuthenticated, isAuthorOrAdmin, getPostAnalytics);
export default router;
