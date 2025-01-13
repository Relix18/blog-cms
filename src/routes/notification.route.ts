import { Router } from "express";
import { isAdmin, isAuthenticated } from "../middlewares/auth.js";
import {
  getNotifications,
  readAllNotification,
  updateNotification,
} from "../controllers/notification.controller.js";

const router = Router();

router.get("/get-notification", isAuthenticated, isAdmin, getNotifications);
router.put(
  "/update-notification/:id",
  isAuthenticated,
  isAdmin,
  updateNotification
);
router.put(
  "/read-all-notifications",
  isAuthenticated,
  isAdmin,
  readAllNotification
);

export default router;
