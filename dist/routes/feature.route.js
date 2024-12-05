import express from "express";
import { featuredPost, latestPost, relatedPost, } from "../controllers/feature.controller.js";
const router = express.Router();
router.post("/related-post", relatedPost);
router.get("/featured-post", featuredPost);
router.get("/latest-post", latestPost);
export default router;
