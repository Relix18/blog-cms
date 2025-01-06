import express from "express";
import {
  isAdmin,
  isAuthenticated,
  isAuthorOrAdmin,
} from "../middlewares/auth.js";
import {
  getAdminOverview,
  getAdminPostAnalytics,
  getGrowthReports,
  getPostAnalytics,
  getUserAnalytics,
} from "../controllers/analytic.controller.js";

const router = express.Router();

router.get(
  "/post-analytics/:days",
  isAuthenticated,
  isAuthorOrAdmin,
  getPostAnalytics
);
router.get("/admin-overview/:days", isAuthenticated, isAdmin, getAdminOverview);
router.get(
  "/admin-post-analytics",
  isAuthenticated,
  isAdmin,
  getAdminPostAnalytics
);
router.get("/admin-user-analytics", isAuthenticated, isAdmin, getUserAnalytics);
router.get("/admin-growth-reports", isAuthenticated, isAdmin, getGrowthReports);

export default router;
