import { Router } from "express";
import {
  commentReply,
  createPost,
  deleteComment,
  deletePost,
  deletePosts,
  deleteReply,
  getAllPost,
  getAllPostAdmin,
  getAuthorPost,
  getSinglePost,
  likedPost,
  postComment,
  postLike,
  postviews,
  publishPost,
  updatePost,
} from "../controllers/post.controller.js";
import { isAdmin, isAuthenticated, isAuthor } from "../middlewares/auth.js";

const router = Router();

router.post("/create-post", isAuthenticated, isAuthor, createPost);
router.get("/get-author-post", isAuthenticated, isAuthor, getAuthorPost);
router.get("/get-single-post/:slug", isAuthenticated, getSinglePost);
router.put("/publish-post/:id", isAuthenticated, isAuthor, publishPost);
router.put("/update-post/:id", isAuthenticated, isAuthor, updatePost);
router.delete("/delete-post/:id", isAuthenticated, isAuthor, deletePost);
router.get("/get-all-posts", isAuthenticated, getAllPost);
router.post("/post-comment/:slug", isAuthenticated, postComment);
router.post("/comment-reply", isAuthenticated, commentReply);
router.post("/post-view/:slug", isAuthenticated, postviews);
router.post("/like-post", isAuthenticated, postLike);
router.get("/liked-post", isAuthenticated, likedPost);
router.get("/get-all-post-admin", isAuthenticated, isAdmin, getAllPostAdmin);
router.delete("/delete-post-admin", isAuthenticated, isAdmin, deletePosts);
router.delete("/delete-comment", isAuthenticated, isAdmin, deleteComment);
router.delete("/delete-reply", isAuthenticated, isAdmin, deleteReply);

export default router;
