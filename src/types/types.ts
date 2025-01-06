export interface IUser {
  name: string;
  email: string;
  password: string | null;
  id: string;
  role: "USER" | "AUTHOR" | "ADMIN";
  resetPasswordToken: string | null;
  resetPasswordExpire: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRegistration {
  name: string;
  email: string;
  password: string;
}

export interface IPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  category: string;
  categoryId: number;
  tags: string[];
  description: string;
  featuredImage: string;
  published: boolean;
  publishedAt: Date;
  author: IUser;
  authorId: string;
  views: number;
  likes: ILike;
  minRead: number;
  comments: IComment;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeyword: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReply {
  reply: string;
  commentId: number;
}

export interface IComment {
  comment: string;
}

export interface ILike {
  id: string;
  postId: number;
  userId: string;
  createdAt: Date;
}

export interface MonthlyMetrics {
  month: string;
  views: number;
  likes: number;
  comments: number;
  replies: number;
  posts: number;
  totalEngagement: number;
  viewsGrowth?: number;
  likesGrowth?: number;
  commentsGrowth?: number;
  repliesGrowth?: number;
}

export interface PostAnalytics {
  postId: number;
  title: string;
  views: number;
  likes: number;
  comments: number;
  replies: number;
  totalEngagement: number;
  createdAt: Date;
}

export interface DetailedAnalytics {
  monthlyAnalytics: MonthlyMetrics[];
  postAnalytics: PostAnalytics[];
}

export interface MonthlyUserActivity {
  month: string;
  newUsers: number;
  activeUsers: number;
  interactions: {
    views: number;
    likes: number;
    comments: number;
    replies: number;
  };
  newAuthors: number;
}

export interface DetailedPlatformUserAnalytics {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  authors: number;
  monthlyActivity: MonthlyUserActivity[];
  allMonthlyActivity: MonthlyUserActivity[];
}
