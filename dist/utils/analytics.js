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
export async function getAdminAllPostAnalytics() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    // Fetch posts within the last 6 months with related data
    const posts = await prisma.post.findMany({
        where: {
            createdAt: { gte: sixMonthsAgo },
        },
        select: {
            id: true,
            title: true,
            views: true,
            likes: { select: { id: true, createdAt: true } },
            comments: {
                select: {
                    id: true,
                    createdAt: true,
                    replies: { select: { id: true, createdAt: true } },
                },
            },
            createdAt: true,
        },
    });
    const monthlyData = {};
    const postAnalytics = [];
    posts.forEach((post) => {
        const postMonth = post.createdAt.toISOString().slice(0, 7); // Format: YYYY-MM
        // Initialize monthly data if not present
        if (!monthlyData[postMonth]) {
            monthlyData[postMonth] = {
                views: 0,
                likes: 0,
                comments: 0,
                totalEngagement: 0,
                replies: 0,
                posts: 0,
            };
        }
        // Aggregate monthly data
        monthlyData[postMonth].views += post.views;
        monthlyData[postMonth].likes += post.likes.length;
        monthlyData[postMonth].comments += post.comments.length;
        monthlyData[postMonth].replies += post.comments.reduce((acc, comment) => acc + comment.replies.length, 0);
        monthlyData[postMonth].totalEngagement +=
            post.views +
                post.likes.length +
                post.comments.length +
                post.comments.reduce((acc, comment) => acc + comment.replies.length, 0);
        monthlyData[postMonth].posts += 1;
        // Add detailed post analytics
        const likes = post.likes.length;
        const comments = post.comments.length;
        const replies = post.comments.reduce((acc, comment) => acc + comment.replies.length, 0);
        const totalEngagement = post.views + likes + comments + replies;
        postAnalytics.push({
            postId: post.id,
            title: post.title,
            views: post.views,
            likes,
            comments,
            replies,
            totalEngagement,
            createdAt: post.createdAt,
        });
    });
    // Transform monthly data into a sorted array
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const monthlyAnalytics = sortedMonths.map((month) => ({
        month,
        ...monthlyData[month],
    }));
    // Calculate growth metrics
    for (let i = 1; i < monthlyAnalytics.length; i++) {
        const current = monthlyAnalytics[i];
        const previous = monthlyAnalytics[i - 1];
        current.viewsGrowth =
            previous.views === 0
                ? 0
                : ((current.views - previous.views) / previous.views) * 100;
        current.likesGrowth =
            previous.likes === 0
                ? 0
                : ((current.likes - previous.likes) / previous.likes) * 100;
        current.commentsGrowth =
            previous.comments === 0
                ? 0
                : ((current.comments - previous.comments) / previous.comments) * 100;
        current.repliesGrowth =
            previous.replies === 0
                ? 0
                : ((current.replies - previous.replies) / previous.replies) * 100;
    }
    return { monthlyAnalytics, postAnalytics };
}
export async function userAnalytics() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    // Fetch basic stats
    const [totalUsers, newUsers, authors] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: sixMonthsAgo } } }),
        prisma.user.count({ where: { posts: { some: {} } } }),
    ]);
    // Initialize monthly data
    const monthlyActivity = Array.from({ length: 6 }).map((_, i) => {
        const month = new Date();
        month.setMonth(month.getMonth() - (5 - i));
        const monthKey = month.toISOString().slice(0, 7); // Format YYYY-MM
        return {
            month: monthKey,
            newUsers: 0,
            activeUsers: 0,
            interactions: {
                views: 0,
                likes: 0,
                comments: 0,
                replies: 0,
            },
            newAuthors: 0,
        };
    });
    // Fetch and group interactions
    const posts = await prisma.post.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: {
            views: true,
            createdAt: true,
            likes: { select: { userId: true, createdAt: true } },
            comments: {
                select: {
                    userId: true,
                    createdAt: true,
                    replies: { select: { userId: true, createdAt: true } },
                },
            },
        },
    });
    // Create a map to track active users per month
    const activeUsersPerMonth = {};
    monthlyActivity.forEach((m) => {
        activeUsersPerMonth[m.month] = new Set();
    });
    posts.forEach((post) => {
        const postCreatedMonth = post.createdAt.toISOString().slice(0, 7);
        const monthData = monthlyActivity.find((m) => m.month === postCreatedMonth);
        // Add views to the post's created month
        if (monthData) {
            monthData.interactions.views += post.views;
        }
        // Process likes
        post.likes.forEach((like) => {
            const monthKey = like.createdAt.toISOString().slice(0, 7);
            const monthData = monthlyActivity.find((m) => m.month === monthKey);
            if (monthData) {
                monthData.interactions.likes++;
                activeUsersPerMonth[monthKey].add(like.userId);
            }
        });
        // Process comments and replies
        post.comments.forEach((comment) => {
            const commentMonth = comment.createdAt.toISOString().slice(0, 7);
            const monthData = monthlyActivity.find((m) => m.month === commentMonth);
            if (monthData) {
                monthData.interactions.comments++;
                activeUsersPerMonth[commentMonth].add(comment.userId);
            }
            comment.replies.forEach((reply) => {
                const replyMonth = reply.createdAt.toISOString().slice(0, 7);
                const monthData = monthlyActivity.find((m) => m.month === replyMonth);
                if (monthData) {
                    monthData.interactions.replies++;
                    activeUsersPerMonth[replyMonth].add(reply.userId);
                }
            });
        });
    });
    // Populate active users count
    Object.entries(activeUsersPerMonth).forEach(([month, users]) => {
        const monthData = monthlyActivity.find((m) => m.month === month);
        if (monthData) {
            monthData.activeUsers = users.size; // Count unique users for the month
        }
    });
    // Populate new users
    const monthlyNewUsersRaw = await prisma.user.groupBy({
        by: ["createdAt"],
        where: { createdAt: { gte: sixMonthsAgo } },
        _count: { createdAt: true },
    });
    monthlyNewUsersRaw.forEach(({ createdAt, _count }) => {
        const monthKey = createdAt.toISOString().slice(0, 7);
        const monthData = monthlyActivity.find((m) => m.month === monthKey);
        if (monthData)
            monthData.newUsers += _count.createdAt;
    });
    return {
        totalUsers,
        newUsers,
        activeUsers: Object.values(activeUsersPerMonth).reduce((acc, users) => acc + users.size, 0),
        authors,
        monthlyActivity,
    };
}
