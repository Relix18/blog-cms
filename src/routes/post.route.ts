import { Router } from "express";
import {
  createPost,
  deletePost,
  getAllPost,
  getAuthorPost,
  getAuthorSinglePost,
  publishPost,
  updatePost,
} from "../controllers/post.controller.js";
import { isAuthenticated, isAuthor } from "../middlewares/auth.js";

const router = Router();

router.post("/create-post", isAuthenticated, isAuthor, createPost);
router.get("/get-author-post", isAuthenticated, isAuthor, getAuthorPost);
router.get(
  "/get-author-single-post/:slug",
  isAuthenticated,
  isAuthor,
  getAuthorSinglePost
);
router.put("/publish-post/:id", isAuthenticated, isAuthor, publishPost);
router.put("/update-post/:id", isAuthenticated, isAuthor, updatePost);
router.delete("/delete-post/:id", isAuthenticated, isAuthor, deletePost);
router.get("/get-all-posts", isAuthenticated, getAllPost);

export default router;
