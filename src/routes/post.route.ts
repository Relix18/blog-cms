import { Router } from "express";
import {
  commentReply,
  createPost,
  deleteComment,
  deletePost,
  deletePosts,
  deleteReply,
  editCategory,
  editTag,
  getAllPost,
  getAllPostAdmin,
  getAuthorPost,
  getCategory,
  getComments,
  getRecentActivity,
  getSinglePost,
  getTags,
  likedPost,
  postComment,
  postLike,
  postviews,
  publishPost,
  unpublishPost,
  updatePost,
} from "../controllers/post.controller.js";
import {
  isAdmin,
  isAuthenticated,
  isAuthorOrAdmin,
} from "../middlewares/auth.js";

const router = Router();

router.post("/create-post", isAuthenticated, isAuthorOrAdmin, createPost);
router.get("/get-author-post", isAuthenticated, isAuthorOrAdmin, getAuthorPost);
router.get("/get-single-post/:slug", getSinglePost);
router.put("/publish-post/:id", isAuthenticated, isAuthorOrAdmin, publishPost);
router.put("/update-post/:id", isAuthenticated, isAuthorOrAdmin, updatePost);
router.delete("/delete-post/:id", isAuthenticated, isAuthorOrAdmin, deletePost);
router.get("/get-all-posts", getAllPost);
router.get("/get-category", getCategory);
router.get("/get-tags", getTags);
router.post("/post-comment/:slug", isAuthenticated, postComment);
router.get("/get-comments/:slug", getComments);
router.post("/comment-reply", isAuthenticated, commentReply);
router.post("/post-view/:slug", postviews);
router.post("/like-post", isAuthenticated, postLike);
router.get("/liked-post", isAuthenticated, likedPost);
router.get("/recent-activity", isAuthenticated, getRecentActivity);
router.get("/get-all-post-admin", isAuthenticated, isAdmin, getAllPostAdmin);
router.put("/unpublish-post", isAuthenticated, isAdmin, unpublishPost);
router.put("/edit-category", isAuthenticated, isAdmin, editCategory);
router.put("/edit-tag", isAuthenticated, isAdmin, editTag);
router.delete("/delete-post-admin", isAuthenticated, isAdmin, deletePosts);
router.delete("/delete-comment", isAuthenticated, isAdmin, deleteComment);
router.delete("/delete-reply", isAuthenticated, isAdmin, deleteReply);

export default router;
