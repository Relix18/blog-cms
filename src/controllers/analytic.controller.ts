import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import getAllPostsAnalytics from "../utils/analytics.js";
import ErrorHandler from "../utils/errorHandler.js";

export const getPostAnalytics = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const days = req.params.days;
    const authorId = req.user?.id;

    if (!authorId) {
      return next(
        new ErrorHandler(400, "Please login to access the resource.")
      );
    }

    const analytics = await getAllPostsAnalytics({
      authorId,
      monthsForPosts: parseInt(days),
    });

    res.status(200).json({
      success: true,
      analytics,
    });
  }
);
