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
  categories: string[];
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
