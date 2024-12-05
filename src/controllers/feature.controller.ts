import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import prisma from "../lib/db.js";
import ErrorHandler from "../utils/errorHandler.js";

export const relatedPost = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { value, currentId } = req.body;

    if (!value) {
      return next(new ErrorHandler(400, "Category value is required"));
    }

    const post = await prisma.category.findMany({
      where: { value },
      include: {
        posts: {
          include: {
            post: {
              include: {
                author: true,
              },
            },
          },

          where: {
            postId: {
              not: currentId,
            },
          },
          orderBy: {
            post: {
              views: "desc",
            },
          },

          take: 3,
        },
      },
    });

    res.status(200).json({
      success: true,
      post,
    });
  }
);

export const featuredPost = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const featuredPost = await prisma.post.findMany({
      orderBy: {
        views: "desc",
      },
      take: 3,
    });

    res.status(200).json({
      success: true,
      featuredPost,
    });
  }
);

export const latestPost = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const latestPost = await prisma.post.findMany({
      orderBy: {
        publishedAt: "desc",
      },
      take: 10,
    });

    res.status(200).json({
      success: true,
      latestPost,
    });
  }
);
