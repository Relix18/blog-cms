import { Router } from "express";
import {
  activateUser,
  login,
  register,
} from "../controllers/user.controller.js";

const router = Router();

router.post("/register", register);
router.post("/activation", activateUser);
router.post("/login", login);

export default router;
