import { Router } from "express";
import {
  activateUser,
  authorRequest,
  deleteUser,
  forgotPassword,
  getAllUser,
  getAuthorDetails,
  getUser,
  getUserDetails,
  login,
  logout,
  register,
  resendOtp,
  resetPassword,
  socialAuth,
  updataAvatar,
  updatePassword,
  updateProfile,
  updateRole,
} from "../controllers/user.controller.js";
import { isAdmin, isAuthenticated } from "../middlewares/auth.js";
import { apiLimiter } from "../middlewares/rateLimit.js";

const router = Router();

router.post("/register", register);
router.post("/activation", activateUser);
router.post("/resend-otp", apiLimiter, resendOtp);
router.post("/login", login);
router.get("/logout", logout);
router.post("/social", socialAuth);
router.post("/forget-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", isAuthenticated, getUser);
router.post("/author-request", isAuthenticated, authorRequest);
router.get("/get-author-profile/:id", getAuthorDetails);
router.put("/update-profile", isAuthenticated, updateProfile);
router.put("/update-avatar", isAuthenticated, updataAvatar);
router.put("/change-password", isAuthenticated, updatePassword);
router.get("/get-all-users", isAuthenticated, isAdmin, getAllUser);
router.put("/update-role/:id", isAuthenticated, isAdmin, updateRole);
router.get("/user-details/:id", isAuthenticated, isAdmin, getUserDetails);
router.delete("/delete-user/:id", isAuthenticated, isAdmin, deleteUser);

export default router;
