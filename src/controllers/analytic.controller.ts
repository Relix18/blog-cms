import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import {
  getAllPostsAnalytics,
  getAdminAnalytics,
  getAdminAllPostAnalytics,
  userAnalytics,
  growthReports,
} from "../utils/analytics.js";
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

export const getAdminOverview = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const days = req.params.days;

    const overview = await getAdminAnalytics({
      monthsForPosts: parseInt(days),
    });

    res.status(200).json({
      success: true,
      overview,
    });
  }
);

export const getAdminPostAnalytics = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const PostAnalytics = await getAdminAllPostAnalytics();

    res.status(200).json({
      success: true,
      PostAnalytics,
    });
  }
);

export const getUserAnalytics = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const UserAnalytics = await userAnalytics();

    res.status(200).json({
      success: true,
      UserAnalytics,
    });
  }
);

export const getGrowthReports = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const GrowthReport = await growthReports();

    res.status(200).json({
      success: true,
      GrowthReport,
    });
  }
);
