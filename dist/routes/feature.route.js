import express from "express";
import { featuredAuthor, featuredPost, latestPost, popularCategory, relatedPost, } from "../controllers/feature.controller.js";
const router = express.Router();
router.post("/related-post", relatedPost);
router.get("/featured-post", featuredPost);
router.get("/latest-post", latestPost);
router.get("/popular-categories", popularCategory);
router.get("/featured-author", featuredAuthor);
export default router;
