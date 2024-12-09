import { TryCatch } from "../middlewares/error.js";
import prisma from "../lib/db.js";
import ErrorHandler from "../utils/errorHandler.js";
export const relatedPost = TryCatch(async (req, res, next) => {
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
});
export const featuredPost = TryCatch(async (req, res, next) => {
    const featuredPost = await prisma.post.findMany({
        orderBy: {
            views: "desc",
        },
        include: {
            author: {
                include: {
                    profile: true,
                },
            },
        },
        take: 3,
    });
    res.status(200).json({
        success: true,
        featuredPost,
    });
});
export const latestPost = TryCatch(async (req, res, next) => {
    const latestPost = await prisma.post.findMany({
        orderBy: {
            publishedAt: "desc",
        },
        include: {
            author: {
                include: {
                    profile: true,
                },
            },
        },
        take: 10,
    });
    res.status(200).json({
        success: true,
        latestPost,
    });
});
export const popularCategory = TryCatch(async (req, res, next) => {
    const popularCategory = await prisma.category.findMany({
        select: {
            id: true,
            value: true,
            label: true,
            _count: {
                select: {
                    posts: true,
                },
            },
        },
        orderBy: {
            posts: {
                _count: "desc",
            },
        },
        take: 20,
    });
    res.status(200).json({
        success: true,
        popularCategory,
    });
});
export const featuredAuthor = TryCatch(async (req, res, next) => {
    const authorPostViews = await prisma.post.groupBy({
        by: ["authorId"],
        _sum: {
            views: true,
        },
        orderBy: {
            _sum: {
                views: "desc",
            },
        },
        take: 1,
    });
    const featuredAuthor = await prisma.user.findUnique({
        where: {
            id: authorPostViews[0].authorId,
        },
        select: {
            id: true,
            name: true,
            _count: {
                select: {
                    posts: true,
                },
            },
            profile: {
                select: {
                    avatar: true,
                    bio: true,
                },
            },
        },
    });
    res.status(200).json({
        success: true,
        featuredAuthor,
    });
});
export const getRecentActivity = TryCatch(async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "User not authenticated",
        });
    }
    const [likedPosts, comments, replies] = await Promise.all([
        prisma.like.findMany({
            where: { userId },
            include: {
                post: true,
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.comment.findMany({
            where: { userId },
            include: { post: true },
            orderBy: { createdAt: "desc" },
        }),
        prisma.reply.findMany({
            where: { userId },
            include: {
                comment: { include: { post: true } },
            },
            orderBy: { createdAt: "desc" },
        }),
    ]);
    const activities = [
        ...likedPosts.map((like) => ({
            type: "LIKE",
            createdAt: like.createdAt,
            post: {
                id: like.postId,
                slug: like.post.slug,
                title: like.post.title,
                description: like.post.description,
            },
        })),
        ...comments.map((comment) => ({
            type: "COMMENT",
            content: comment.content,
            createdAt: comment.createdAt,
            post: {
                id: comment.postId,
                slug: comment.post.slug,
                title: comment.post.title,
                description: comment.post.description,
            },
        })),
        ...replies.map((reply) => ({
            type: "REPLY",
            content: reply.content,
            createdAt: reply.createdAt,
            post: {
                id: reply.comment.postId,
                slug: reply.comment.post.slug,
                title: reply.comment.post.title,
                description: reply.comment.post.description,
            },
        })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.status(200).json({
        success: true,
        activities,
    });
});
