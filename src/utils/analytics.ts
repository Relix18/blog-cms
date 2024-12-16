import { subMonths, format } from "date-fns";
import prisma from "../lib/db.js";

interface IAnalytics {
  startDate?: Date;
  endDate?: Date;
  authorId?: string | undefined;
  monthsForPosts: number;
}

export const getAllPostsAnalytics = async ({
  startDate,
  endDate,
  authorId,
  monthsForPosts = 6,
}: IAnalytics) => {
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
  }, {} as Record<string, number>);

  const categoryPercentages = Object.entries(categoryCounts)
    .map(([category, count]) => ({
      name: category,
      value: (count / totalPosts) * 100,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const categoryMetrics = categoryPercentages.map(({ name }) => {
    const filteredPosts = postsData.filter(
      (post) => (post.category.label || "Uncategorized") === name
    );
    const views = filteredPosts.reduce((sum, post) => sum + post.views, 0);
    const comments = commentsData.filter((comment) =>
      filteredPosts.some((post) => post.id === comment.postId)
    ).length;
    const likes = likesData.filter((like) =>
      filteredPosts.some((post) => post.id === like.postId)
    ).length;

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
  const lastPeriodViews = lastPeriodViewsData.reduce(
    (sum, post) => sum + post.views,
    0
  );

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

  const calculateGrowth = (current: number, previous: number) =>
    previous > 0 ? ((current - previous) / previous) * 100 : 0;

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

export const geAdminAnalytics = async ({
  startDate,
  endDate,
  monthsForPosts = 6,
}: IAnalytics) => {
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

  const commentsData = await prisma.comment.findMany({
    where: {
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

  const totalPosts = postsData.length;

  const categoryCounts = postsData.reduce((counts, post) => {
    const category = post.category || "Uncategorized";
    counts[category.label] = (counts[category.label] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const categoryPercentages = Object.entries(categoryCounts)
    .map(([category, count]) => ({
      name: category,
      value: (count / totalPosts) * 100,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const categoryMetrics = categoryPercentages.map(({ name }) => {
    const filteredPosts = postsData.filter(
      (post) => (post.category.label || "Uncategorized") === name
    );
    const views = filteredPosts.reduce((sum, post) => sum + post.views, 0);
    const comments = commentsData.filter((comment) =>
      filteredPosts.some((post) => post.id === comment.postId)
    ).length;
    const likes = likesData.filter((like) =>
      filteredPosts.some((post) => post.id === like.postId)
    ).length;

    return {
      name,
      views,
      comments,
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
  const lastPeriodViews = lastPeriodViewsData.reduce(
    (sum, post) => sum + post.views,
    0
  );

  const lastPeriodCommentsData = await prisma.comment.findMany({
    where: {
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

  const calculateGrowth = (current: number, previous: number) =>
    previous > 0 ? ((current - previous) / previous) * 100 : 0;

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

export const getAdminAnalytics = async ({
  startDate,
  endDate,
  monthsForPosts = 6,
}: IAnalytics) => {
  const start = startDate || subMonths(new Date(), monthsForPosts);
  const end = endDate || new Date();
  const lastPeriodStart = subMonths(start, monthsForPosts);
  const lastPeriodEnd = subMonths(end, monthsForPosts);

  // Utility to calculate monthly breakdowns
  const getData = async (model, startDate, endDate) => {
    const data = await prisma[model].findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { createdAt: true },
    });

    const monthsMap = {};
    data.forEach((item) => {
      const month = format(item.createdAt, "MMMM");
      monthsMap[month] = (monthsMap[month] || 0) + 1;
    });

    return Object.entries(monthsMap).map(([month, count]) => ({
      month,
      count,
    }));
  };

  // Current period data
  const viewsData = await prisma.post.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: { id: true, views: true },
  });
  const totalViews = viewsData.reduce((sum, post) => sum + post.views, 0);

  const commentsData = await prisma.comment.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: { id: true },
  });
  const totalComments = commentsData.length;

  const likesData = await prisma.like.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: { id: true },
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
      views: true,
      likes: true,
      comments: true,
      category: true,
      createdAt: true,
    },
  });
  const totalPosts = postsData.length;

  // New users
  const newUsersData = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: { id: true },
  });
  const totalNewUsers = newUsersData.length;

  // Last period data
  const lastPeriodViewsData = await prisma.post.findMany({
    where: {
      createdAt: {
        gte: lastPeriodStart,
        lte: lastPeriodEnd,
      },
    },
    select: { views: true },
  });
  const lastPeriodViews = lastPeriodViewsData.reduce(
    (sum, post) => sum + post.views,
    0
  );

  const lastPeriodCommentsData = await prisma.comment.findMany({
    where: {
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

  const lastPeriodUsersData = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: lastPeriodStart,
        lte: lastPeriodEnd,
      },
    },
    select: { id: true },
  });
  const lastPeriodNewUsers = lastPeriodUsersData.length;

  // Total views for 6 months and 1 year
  const sixMonthsAgo = subMonths(new Date(), 6);
  const oneYearAgo = subMonths(new Date(), 12);

  const sixMonthsViewsData = await prisma.post.findMany({
    where: {
      createdAt: {
        gte: sixMonthsAgo,
        lte: end,
      },
    },
    select: { views: true },
  });
  const sixMonthsViews = sixMonthsViewsData.reduce(
    (sum, post) => sum + post.views,
    0
  );

  const oneYearViewsData = await prisma.post.findMany({
    where: {
      createdAt: {
        gte: oneYearAgo,
        lte: end,
      },
    },
    select: { views: true },
  });
  const oneYearViews = oneYearViewsData.reduce(
    (sum, post) => sum + post.views,
    0
  );

  // Monthly breakdowns for area chart
  const monthlyViews = await getData("post", oneYearAgo, end);
  const monthlyUsers = await getData("user", oneYearAgo, end);

  const calculateGrowth = (current, previous) =>
    previous > 0 ? ((current - previous) / previous) * 100 : 0;

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
    newUsers: {
      percentage: calculateGrowth(totalNewUsers, lastPeriodNewUsers).toFixed(2),
      currentPeriod: totalNewUsers,
      lastPeriod: lastPeriodNewUsers,
    },
  };

  return {
    customTime: monthsForPosts,
    totalViews,
    totalComments,
    totalLikes,
    totalPosts,
    totalNewUsers,
    sixMonthsViews,
    oneYearViews,
    posts: postsData,
    growth: growthDetails,
    monthlyViews,
    monthlyUsers,
  };
};
