import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Too many attempts, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
