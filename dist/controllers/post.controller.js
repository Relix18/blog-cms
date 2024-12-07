import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/errorHandler.js";
import prisma from "../lib/db.js";
import { v2 as cloudinary } from "cloudinary";
import calculateReadingTime from "../utils/readingTime.js";
import pusher from "../utils/pusher.js";
//Author
export const createPost = TryCatch(async (req, res, next) => {
    let { title, slug, content, categories, description, featuredImage, metaTitle, metaDescription, metaKeyword, } = req.body;
    const user = req.user;
    if (!user) {
        return next(new ErrorHandler(400, "Please login to access the reasource"));
    }
    if (!title ||
        !content ||
        !slug ||
        !description ||
        !featuredImage ||
        !categories ||
        !metaTitle ||
        !metaDescription ||
        !metaKeyword) {
        return next(new ErrorHandler(400, "Please enter all fields"));
    }
    let featuredImageId;
    try {
        let myCloud = await cloudinary.uploader.upload(featuredImage, {
            folder: "blog/post",
        });
        featuredImage = myCloud.secure_url;
        featuredImageId = myCloud.public_id;
    }
    catch (error) {
        return next(new ErrorHandler(400, "An error occurred"));
    }
    const categoriesToConnect = await Promise.all(categories.map(async (category) => {
        const label = category.charAt(0).toUpperCase() + category.slice(1);
        const value = category.toLowerCase();
        const existingCategory = await prisma.category.upsert({
            where: { value },
            update: {},
            create: { value, label },
        });
        return { id: existingCategory.id };
    }));
    let isSlugExists = await prisma.post.findUnique({
        where: { slug },
    });
    let count = 1;
    while (isSlugExists) {
        slug = `${slug}-${count}`;
        isSlugExists = await prisma.post.findUnique({ where: { slug } });
        count++;
    }
    const minRead = calculateReadingTime(content);
    const post = await prisma.post.create({
        data: {
            title,
            content,
            featuredImage,
            featuredImageId,
            description,
            minRead,
            slug,
            authorId: user.id,
            categories: {
                create: categoriesToConnect.map((category) => ({
                    category: { connect: { id: category.id } },
                })),
            },
            metaTitle,
            metaDescription,
            metaKeyword,
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
            likes: true,
            comments: true,
            categories: {
                select: {
                    category: {
                        select: {
                            value: true,
                            label: true,
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
        where: { slug },
        include: {
            author: {
                select: {
                    name: true,
                    email: true,
                    id: true,
                },
            },
            categories: {
                select: {
                    category: {
                        select: {
                            value: true,
                            label: true,
                        },
                    },
                },
            },
            likes: true,
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
    let { title, slug, content, categories, featuredImage, metaTitle, metaDescription, metaKeyword, } = req.body;
    if (!title ||
        !content ||
        !slug ||
        !featuredImage ||
        !categories ||
        !metaDescription ||
        !metaTitle ||
        !metaKeyword) {
        return next(new ErrorHandler(400, "Please enter all fields"));
    }
    const categoriesToConnect = await Promise.all(categories.map(async (category) => {
        const label = category.charAt(0).toUpperCase() + category.slice(1);
        const value = category.toLowerCase();
        const existingCategory = await prisma.category.upsert({
            where: { value },
            update: {},
            create: { label, value },
        });
        return { id: existingCategory.id };
    }));
    await prisma.postCategory.deleteMany({
        where: { postId },
    });
    const oldPost = await prisma.post.findUnique({
        where: { id: postId },
    });
    let featuredImageId;
    if (!featuredImage.startsWith("https://res.cloudinary.com")) {
        try {
            await cloudinary.uploader.destroy(oldPost?.featuredImageId);
            let myCloud = await cloudinary.uploader.upload(featuredImage, {
                folder: "blog/post",
            });
            featuredImage = myCloud.secure_url;
            featuredImageId = myCloud.public_id;
        }
        catch (error) {
            return next(new ErrorHandler(400, "An error occurred"));
        }
    }
    const minRead = calculateReadingTime(content);
    const post = await prisma.post.update({
        where: { id: postId },
        data: {
            title,
            content,
            featuredImage,
            featuredImageId,
            minRead,
            slug,
            categories: {
                create: categoriesToConnect.map((category) => ({
                    category: { connect: { id: category.id } },
                })),
            },
            metaTitle,
            metaDescription,
            metaKeyword,
        },
    });
    res.status(200).json({
        success: true,
        post,
    });
});
export const deletePost = TryCatch(async (req, res, next) => {
    const id = req.params.id;
    const user = req.user;
    const postId = parseInt(id);
    const post = await prisma.post.findFirst({
        where: { id: postId, authorId: user?.id },
    });
    if (!post) {
        return next(new ErrorHandler(400, "You are not an author of this post."));
    }
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
    await prisma.like.deleteMany({
        where: { postId },
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
                            value: true,
                            label: true,
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
export const getCategory = TryCatch(async (req, res, next) => {
    const categories = await prisma.category.findMany();
    res.status(200).json({
        success: true,
        categories,
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
export const getComments = TryCatch(async (req, res, next) => {
    const { slug } = req.params;
    if (!slug) {
        return next(new ErrorHandler(404, "Post not found"));
    }
    const comments = await prisma.comment.findMany({
        where: { post: { slug } },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            replies: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            profile: {
                                select: {
                                    avatar: true,
                                },
                            },
                        },
                    },
                },
            },
            user: {
                select: {
                    name: true,
                    email: true,
                    profile: {
                        select: {
                            avatar: true,
                        },
                    },
                },
            },
        },
    });
    if (!comments) {
        return next(new ErrorHandler(404, "No comments found on this post"));
    }
    res.status(200).json({
        success: true,
        comments,
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
    let message = "";
    let likeCount = 0;
    if (existingLike) {
        await prisma.like.delete({
            where: { id: existingLike.id },
        });
        message = "Post unliked successfully";
    }
    else {
        await prisma.like.create({
            data: {
                postId,
                userId: id,
            },
        });
        message = "Post liked successfully";
    }
    likeCount = await prisma.like.count({ where: { postId } });
    await pusher.trigger("post-channel", "like-updated", {
        postId,
        likeCount,
    });
    res.status(200).json({
        success: true,
        message,
        likeCount,
    });
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
                    description: true,
                },
            },
        },
    });
    res.status(200).json({
        success: true,
        likedPost,
    });
});
//Admin
export const getAllPostAdmin = TryCatch(async (req, res, next) => {
    const posts = await prisma.post.findMany({
        include: {
            categories: {
                include: {
                    category: {
                        select: {
                            value: true,
                            label: true,
                        },
                    },
                },
            },
        },
    });
    res.status(200).json({
        success: true,
        posts,
    });
});
export const deletePosts = TryCatch(async (req, res, next) => {
    const { postId } = req.body;
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
    await prisma.like.deleteMany({
        where: { postId },
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
        message: "Post deleted successfully",
    });
});
export const deleteComment = TryCatch(async (req, res, next) => {
    const { id } = req.body;
    const comment = await prisma.comment.findUnique({
        where: { id },
    });
    if (!comment) {
        return next(new ErrorHandler(404, "Comment not found"));
    }
    await prisma.reply.deleteMany({
        where: {
            commentId: id,
        },
    });
    await prisma.comment.delete({
        where: { id },
    });
    res.status(200).json({
        success: true,
        message: "Comment deleted successfully",
    });
});
export const deleteReply = TryCatch(async (req, res, next) => {
    const { id } = req.body;
    const reply = await prisma.reply.findFirst({
        where: { id },
    });
    if (!reply) {
        return next(new ErrorHandler(404, "Reply not found"));
    }
    await prisma.reply.delete({
        where: { id },
    });
    res.status(200).json({
        success: true,
        message: "Reply deleted successfully",
    });
});
