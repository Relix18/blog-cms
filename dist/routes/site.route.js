import { Router } from "express";
import { isAdmin, isAuthenticated } from "../middlewares/auth";
import { createSiteSettings, updateSiteHeroImage, updateSiteSettings, } from "../controllers/site.controller";
const router = Router();
router.post("/create-site-settings", isAuthenticated, isAdmin, createSiteSettings);
router.put("/update-site-settings", isAuthenticated, isAdmin, updateSiteSettings);
router.put("/update-site-image", isAuthenticated, isAdmin, updateSiteHeroImage);
export default router;
