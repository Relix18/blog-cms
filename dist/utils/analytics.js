import { subMonths, format } from "date-fns";
import prisma from "../lib/db.js";
export const getAllPostsAnalytics = async ({ startDate, endDate, authorId, monthsForPosts = 6, }) => {
    const start = startDate || subMonths(new Date(), monthsForPosts);
    const end = endDate || new Date();
    const lastPeriodStart = subMonths(start, monthsForPosts);
    const lastPeriodEnd = subMonths(end, monthsForPosts);
    const viewsData = await prisma.post.findMany({
        where: {
            authorId,
            createdAt: {
                gte: start,
                lte: end,
            },
        },
        select: { id: true, title: true, views: true },
    });
    const totalViews = viewsData.reduce((sum, post) => sum + post.views, 0);
    const commentsData = await prisma.comment.findMany({
        where: {
            post: {
                authorId,
            },
            createdAt: {
                gte: start,
                lte: end,
            },
        },
        select: { id: true, postId: true },
    });
    const totalComments = commentsData.length;
    const likesData = await prisma.like.findMany({
        where: {
            post: {
                authorId,
            },
            createdAt: {
                gte: start,
                lte: end,
            },
        },
        select: { id: true, postId: true },
    });
    const totalLikes = likesData.length;
    const postsData = await prisma.post.findMany({
        where: {
            authorId,
            createdAt: {
                gte: start,
                lte: end,
            },
        },
        orderBy: {
            views: "desc",
        },
        select: {
            id: true,
            title: true,
            featuredImage: true,
            views: true,
            likes: true,
            comments: true,
            category: true,
            createdAt: true,
        },
    });
    const totalPosts = postsData.length;
    const categoryCounts = postsData.reduce((counts, post) => {
        const category = post.category || "Uncategorized";
        counts[category.label] = (counts[category.label] || 0) + 1;
        return counts;
    }, {});
    const categoryPercentages = Object.entries(categoryCounts)
        .map(([category, count]) => ({
        name: category,
        value: (count / totalPosts) * 100,
        count,
    }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);
    const categoryMetrics = categoryPercentages.map(({ name }) => {
        const filteredPosts = postsData.filter((post) => (post.category.label || "Uncategorized") === name);
        const views = filteredPosts.reduce((sum, post) => sum + post.views, 0);
        const comments = commentsData.filter((comment) => filteredPosts.some((post) => post.id === comment.postId)).length;
        const likes = likesData.filter((like) => filteredPosts.some((post) => post.id === like.postId)).length;
        return {
            name,
            views,
            comments,
            likes,
        };
    });
    const lastPeriodViewsData = await prisma.post.findMany({
        where: {
            authorId,
            createdAt: {
                gte: lastPeriodStart,
                lte: lastPeriodEnd,
            },
        },
        select: { views: true },
    });
    const lastPeriodViews = lastPeriodViewsData.reduce((sum, post) => sum + post.views, 0);
    const lastPeriodCommentsData = await prisma.comment.findMany({
        where: {
            post: {
                authorId,
            },
            createdAt: {
                gte: lastPeriodStart,
                lte: lastPeriodEnd,
            },
        },
        select: { id: true },
    });
    const lastPeriodComments = lastPeriodCommentsData.length;
    const lastPeriodLikesData = await prisma.like.findMany({
        where: {
            post: {
                authorId,
            },
            createdAt: {
                gte: lastPeriodStart,
                lte: lastPeriodEnd,
            },
        },
        select: { id: true },
    });
    const lastPeriodLikes = lastPeriodLikesData.length;
    const lastPeriodPostsData = await prisma.post.findMany({
        where: {
            authorId,
            createdAt: {
                gte: lastPeriodStart,
                lte: lastPeriodEnd,
            },
        },
        select: { id: true },
    });
    const lastPeriodPosts = lastPeriodPostsData.length;
    const calculateGrowth = (current, previous) => previous > 0 ? ((current - previous) / previous) * 100 : 0;
    const growthDetails = {
        views: {
            percentage: calculateGrowth(totalViews, lastPeriodViews).toFixed(2),
            currentPeriod: totalViews,
            lastPeriod: lastPeriodViews,
        },
        comments: {
            percentage: calculateGrowth(totalComments, lastPeriodComments).toFixed(2),
            currentPeriod: totalComments,
            lastPeriod: lastPeriodComments,
        },
        likes: {
            percentage: calculateGrowth(totalLikes, lastPeriodLikes).toFixed(2),
            currentPeriod: totalLikes,
            lastPeriod: lastPeriodLikes,
        },
        posts: {
            percentage: calculateGrowth(totalPosts, lastPeriodPosts).toFixed(2),
            currentPeriod: totalPosts,
            lastPeriod: lastPeriodPosts,
        },
    };
    return {
        customTime: monthsForPosts,
        totalViews,
        totalComments,
        totalLikes,
        totalPosts,
        posts: postsData,
        growth: growthDetails,
        categoryPercentages,
        categoryMetrics,
    };
};
export const getAdminAnalytics = async ({ startDate, endDate, monthsForPosts = 6, }) => {
    const start = startDate || subMonths(new Date(), monthsForPosts);
    const end = endDate || new Date();
    const lastPeriodStart = subMonths(start, monthsForPosts);
    const lastPeriodEnd = subMonths(end, monthsForPosts);
    const viewsData = await prisma.post.findMany({
        where: {
            createdAt: {
                gte: start,
                lte: end,
            },
        },
        select: { id: true, title: true, views: true },
    });
    const totalViews = viewsData.reduce((sum, post) => sum + post.views, 0);
    const usersData = await prisma.user.findMany({
        where: {
            createdAt: {
                gte: start,
                lte: end,
            },
        },
    });
    const totalUsers = usersData.length;
    const likesData = await prisma.like.findMany({
        where: {
            createdAt: {
                gte: start,
                lte: end,
            },
        },
        select: { id: true, postId: true },
    });
    const totalLikes = likesData.length;
    const postsData = await prisma.post.findMany({
        where: {
            createdAt: {
                gte: start,
                lte: end,
            },
        },
        orderBy: {
            views: "desc",
        },
        select: {
            id: true,
            title: true,
            featuredImage: true,
            views: true,
            likes: true,
            comments: true,
            category: true,
            createdAt: true,
        },
    });
    const postsDataYearly = await prisma.post.findMany({
        where: {
            createdAt: {
                gte: subMonths(new Date(), 12),
                lte: end,
            },
        },
        orderBy: {
            createdAt: "asc",
        },
        select: {
            id: true,
            title: true,
            featuredImage: true,
            views: true,
            likes: true,
            comments: true,
            category: true,
            createdAt: true,
        },
    });
    const monthlyViews = postsDataYearly.reduce((acc, item) => {
        const month = format(item.createdAt, "yyyy-MM-dd");
        if (!acc[month]) {
            acc[month] = { month, views: 0, posts: [] };
        }
        acc[month].views += item.views;
        acc[month].posts.push({
            id: item.id,
            title: item.title,
            views: item.views,
        });
        return acc;
    }, {});
    const monthlyUsers = usersData.reduce((acc, item) => {
        const month = format(item.createdAt, "yyyy-MM-dd");
        if (!acc[month]) {
            acc[month] = { month, users: 0 };
        }
        acc[month].users += 1;
        return acc;
    }, {});
    const viewsChart = Object.values(monthlyViews);
    const usersChart = Object.values(monthlyUsers);
    const totalPosts = postsData.length;
    const categoryCounts = postsData.reduce((counts, post) => {
        const category = post.category || "Uncategorized";
        counts[category.label] = (counts[category.label] || 0) + 1;
        return counts;
    }, {});
    const categoryPercentages = Object.entries(categoryCounts)
        .map(([category, count]) => ({
        name: category,
        value: (count / totalPosts) * 100,
        count,
    }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);
    const categoryMetrics = categoryPercentages.map(({ name }) => {
        const filteredPosts = postsData.filter((post) => (post.category.label || "Uncategorized") === name);
        const views = filteredPosts.reduce((sum, post) => sum + post.views, 0);
        const likes = likesData.filter((like) => filteredPosts.some((post) => post.id === like.postId)).length;
        return {
            name,
            views,
            likes,
        };
    });
    const lastPeriodViewsData = await prisma.post.findMany({
        where: {
            createdAt: {
                gte: lastPeriodStart,
                lte: lastPeriodEnd,
            },
        },
        select: { views: true },
    });
    const lastPeriodViews = lastPeriodViewsData.reduce((sum, post) => sum + post.views, 0);
    const lastPeriodUsersData = await prisma.user.findMany({
        where: {
            createdAt: {
                gte: lastPeriodStart,
                lte: lastPeriodEnd,
            },
        },
        select: { id: true },
    });
    const lastPeriodUsers = lastPeriodUsersData.length;
    const lastPeriodLikesData = await prisma.like.findMany({
        where: {
            createdAt: {
                gte: lastPeriodStart,
                lte: lastPeriodEnd,
            },
        },
        select: { id: true },
    });
    const lastPeriodLikes = lastPeriodLikesData.length;
    const lastPeriodPostsData = await prisma.post.findMany({
        where: {
            createdAt: {
                gte: lastPeriodStart,
                lte: lastPeriodEnd,
            },
        },
        select: { id: true },
    });
    const lastPeriodPosts = lastPeriodPostsData.length;
    const calculateGrowth = (current, previous) => previous > 0 ? ((current - previous) / previous) * 100 : 0;
    const growthDetails = {
        views: {
            percentage: calculateGrowth(totalViews, lastPeriodViews).toFixed(2),
            currentPeriod: totalViews,
            lastPeriod: lastPeriodViews,
        },
        users: {
            percentage: calculateGrowth(totalUsers, lastPeriodUsers).toFixed(2),
            currentPeriod: totalUsers,
            lastPeriod: lastPeriodUsers,
        },
        likes: {
            percentage: calculateGrowth(totalLikes, lastPeriodLikes).toFixed(2),
            currentPeriod: totalLikes,
            lastPeriod: lastPeriodLikes,
        },
        posts: {
            percentage: calculateGrowth(totalPosts, lastPeriodPosts).toFixed(2),
            currentPeriod: totalPosts,
            lastPeriod: lastPeriodPosts,
        },
    };
    return {
        customTime: monthsForPosts,
        totalViews,
        totalUsers,
        totalLikes,
        totalPosts,
        viewsChart,
        usersChart,
        posts: postsData,
        growth: growthDetails,
        categoryPercentages,
        categoryMetrics,
    };
};