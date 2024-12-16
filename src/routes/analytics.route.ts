import express from "express";
import {
  isAdmin,
  isAuthenticated,
  isAuthorOrAdmin,
} from "../middlewares/auth.js";
import {
  getAdminOverview,
  getPostAnalytics,
} from "../controllers/analytic.controller.js";

const router = express.Router();

router.get(
  "/post-analytics/:days",
  isAuthenticated,
  isAuthorOrAdmin,
  getPostAnalytics
);
router.get("/admin-overview/:days", isAuthenticated, isAdmin, getAdminOverview);

export default router;
