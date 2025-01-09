import { Router } from "express";
import { isAdmin, isAuthenticated } from "../middlewares/auth.js";
import {
  createSiteSettings,
  getSiteSettings,
  updateSiteSettings,
} from "../controllers/site.controller.js";

const router = Router();

router.post(
  "/create-site-settings",
  isAuthenticated,
  isAdmin,
  createSiteSettings
);
router.get("/get-site-settings", getSiteSettings);
router.put(
  "/update-site-settings",
  isAuthenticated,
  isAdmin,
  updateSiteSettings
);

export default router;
