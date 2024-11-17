import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/errorHandler.js";
import prisma from "../lib/db.js";
//Author
export const createPost = TryCatch(async (req, res, next) => {
    const { title, slug, content, categories, featuredImage, metaTitle, metaDescription, } = req.body;
    const user = req.user;
    if (!user) {
        return next(new ErrorHandler(400, "Please login to access the reasource"));
    }
    if (!title ||
        !content ||
        !slug ||
        !featuredImage ||
        !categories ||
        !metaDescription ||
        !metaTitle) {
        return next(new ErrorHandler(400, "Please enter all fields"));
    }
    //Note: cloudinary for image
    const categoriesToConnect = await Promise.all(categories.map(async (category) => {
        const existingCategory = await prisma.category.upsert({
            where: { name: category },
            update: {},
            create: { name: category },
        });
        return { id: existingCategory.id };
    }));
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
});
export const publishPost = TryCatch(async (req, res, next) => {
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
});
export const getAuthorPost = TryCatch(async (req, res, next) => {
    const user = req.user;
    if (!user) {
        return next(new ErrorHandler(400, "Please login to access the resource"));
    }
    const post = await prisma.post.findMany({
        where: { authorId: user.id },
        include: {
            categories: {
                select: {
                    category: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
    });
    res.status(200).json({
        success: true,
        post,
    });
});
export const getSinglePost = TryCatch(async (req, res, next) => {
    const slug = req.params.slug;
    const post = await prisma.post.findUnique({
        where: { slug, published: true },
        include: {
            categories: {
                select: {
                    category: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
            likes: true,
            comments: {
                include: {
                    replies: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });
    if (!post) {
        return next(new ErrorHandler(404, "Post not found"));
    }
    res.status(200).json({
        success: true,
        post,
    });
});
export const updatePost = TryCatch(async (req, res, next) => {
    const id = req.params.id;
    const postId = parseInt(id);
    const { title, slug, content, categories, featuredImage, metaTitle, metaDescription, } = req.body;
    if (!title ||
        !content ||
        !slug ||
        !featuredImage ||
        !categories ||
        !metaDescription ||
        !metaTitle) {
        return next(new ErrorHandler(400, "Please enter all fields"));
    }
    const categoriesToConnect = await Promise.all(categories.map(async (category) => {
        const existingCategory = await prisma.category.upsert({
            where: { name: category },
            update: {},
            create: { name: category },
        });
        return { id: existingCategory.id };
    }));
    await prisma.postCategory.deleteMany({
        where: { postId },
    });
    //Note : cloudinary image functionality
    const post = await prisma.post.update({
        where: { id: postId },
        data: {
            title,
            content,
            featuredImage,
            slug,
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
});
export const deletePost = TryCatch(async (req, res, next) => {
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
});
//User
export const getAllPost = TryCatch(async (req, res, next) => {
    const posts = await prisma.post.findMany({
        where: { published: true },
        include: {
            categories: {
                select: {
                    category: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
            author: {
                select: {
                    name: true,
                    email: true,
                    id: true,
                },
            },
        },
    });
    res.status(200).json({
        success: true,
        posts,
    });
});
export const postComment = TryCatch(async (req, res, next) => {
    const { slug } = req.params;
    const user = req.user;
    const { comment } = req.body;
    if (!comment) {
        return next(new ErrorHandler(400, "Comment is empty"));
    }
    const post = await prisma.post.findUnique({
        where: { slug },
    });
    if (!post) {
        return next(new ErrorHandler(404, "Post not found"));
    }
    await prisma.comment.create({
        data: {
            content: comment,
            userId: user.id,
            postId: post.id,
        },
    });
    res.status(200).json({
        success: true,
        message: "Commented successfully",
    });
});
export const commentReply = TryCatch(async (req, res, next) => {
    const { id } = req.user;
    const { reply, commentId } = req.body;
    if (!reply) {
        return next(new ErrorHandler(400, "Comment is empty"));
    }
    await prisma.reply.create({
        data: {
            userId: id,
            commentId,
            content: reply,
        },
    });
    res.status(200).json({
        success: true,
        message: "Replied Successfully",
    });
});
export const postviews = TryCatch(async (req, res, next) => {
    const { slug } = req.params;
    if (!slug) {
        return next(new ErrorHandler(400, "slug is required"));
    }
    await prisma.post.update({
        where: { slug },
        data: {
            views: {
                increment: 1,
            },
        },
    });
    res.status(200).json({
        success: true,
        message: "Views updated successfully",
    });
});
export const postLike = TryCatch(async (req, res, next) => {
    const { id } = req.user;
    const { postId } = req.body;
    if (!id) {
        return next(new ErrorHandler(401, "Please log in to like the post"));
    }
    if (!postId) {
        return next(new ErrorHandler(400, "Post ID is required"));
    }
    const isPublished = await prisma.post.findUnique({
        where: { id: postId, published: true },
    });
    if (!isPublished) {
        return next(new ErrorHandler(400, "Post is not published yet."));
    }
    const existingLike = await prisma.like.findFirst({
        where: { userId: id, postId },
    });
    try {
        if (existingLike) {
            await prisma.like.delete({
                where: { id: existingLike.id },
            });
            return res.status(200).json({
                success: true,
                message: "Post unliked",
            });
        }
        else {
            await prisma.like.create({
                data: {
                    postId,
                    userId: id,
                },
            });
            res.status(200).json({
                success: true,
                message: "Post liked",
            });
        }
    }
    catch (error) {
        next(new ErrorHandler(500, "Error occured"));
    }
});
export const likedPost = TryCatch(async (req, res, next) => {
    const { id } = req.user;
    if (!id) {
        return next(new ErrorHandler(401, "Please log in to access this resource"));
    }
    const likedPost = await prisma.like.findMany({
        where: { userId: id },
        include: {
            post: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    featuredImage: true,
                    views: true,
                    likes: {
                        select: { id: true }, // Include the number of likes
                    },
                    author: {
                        select: { id: true, name: true }, // Include author details
                    },
                },
            },
        },
    });
    const result = likedPost.map((like) => ({
        id: like.post.id,
        title: like.post.title,
        slug: like.post.slug,
        featuredImage: like.post.featuredImage,
        views: like.post.views,
        likeCount: like.post.likes.length,
        author: like.post.author,
    }));
    res.status(200).json({
        success: true,
        result,
    });
});
//Note admin delete comment and reply
