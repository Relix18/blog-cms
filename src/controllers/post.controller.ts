import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import { IPost } from "../types/types";
import ErrorHandler from "../utils/errorHandler.js";
import prisma from "../lib/db.js";

export const createPost = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      title,
      slug,
      content,
      categories,
      featuredImage,
      metaTitle,
      metaDescription,
    } = req.body as IPost;
    const user = req.user;

    if (!user) {
      return next(
        new ErrorHandler(400, "Please login to access the reasource")
      );
    }

    if (
      !title ||
      !content ||
      !slug ||
      !featuredImage ||
      !categories ||
      !metaDescription ||
      !metaTitle
    ) {
      return next(new ErrorHandler(400, "Please enter all fields"));
    }

    //Note: cloudinary for image

    const categoriesToConnect = await Promise.all(
      categories.map(async (category) => {
        const existingCategory = await prisma.category.upsert({
          where: { name: category },
          update: {},
          create: { name: category },
        });
        return { id: existingCategory.id };
      })
    );

    const post = await prisma.post.create({
      data: {
        title,
        content,
        featuredImage,
        slug,
        authorId: user.id,
        categories: {
          create: categoriesToConnect.map((category) => ({
            category: { connect: { id: category.id } },
          })),
        },
        metaTitle,
        metaDescription,
      },
    });

    res.status(200).json({
      success: true,
      post,
    });
  }
);

export const publishPost = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const id = req.params.id;

    const postId = parseInt(id);

    if (!user) {
      return next(new ErrorHandler(400, "Please login to access the resource"));
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        published: true,
        publishedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Your post is published and available to readers.",
    });
  }
);

export const getAuthorPost = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new ErrorHandler(400, "Please login to access the resource"));
    }

    const post = await prisma.post.findMany({
      where: { authorId: user.id },
      include: {
        comments: {
          include: {
            replies: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      post,
    });
  }
);

export const updatePost = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {}
);

export const deletePost = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const postId = parseInt(id);

    await prisma.reply.deleteMany({
      where: {
        comment: {
          postId,
        },
      },
    });

    await prisma.comment.deleteMany({
      where: {
        postId,
      },
    });

    await prisma.postCategory.deleteMany({
      where: { postId },
    });

    await prisma.post.delete({
      where: {
        id: postId,
      },
    });

    res.status(200).json({
      success: true,
      message: "Your post has been deleted.",
    });
  }
);

export const getAllPost = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const posts = await prisma.post.findMany({
      where: { published: true },

      include: {
        author: {
          select: {
            name: true,
            email: true,
            id: true,
          },
        },
        comments: {
          include: {
            replies: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      posts,
    });
  }
);
