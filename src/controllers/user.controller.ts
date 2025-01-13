import { NextFunction, Request, Response } from "express";
import prisma from "../lib/db.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/errorHandler.js";
import bcrypt from "bcryptjs";
import {
  activationToken,
  getResetPassword,
  sendToken,
} from "../utils/jwtToken.js";
import jwt, { Secret } from "jsonwebtoken";
import crypto from "crypto";
import { IRegistration } from "../types/types.js";
import sendEmail from "../utils/sendMail.js";
import { v2 as cloudinary } from "cloudinary";

export const register = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body as IRegistration;

    const isExist = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (isExist) {
      return next(new ErrorHandler(400, "Email already exists."));
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      name,
      email,
      password: hashedPassword,
    };

    const { token, otp } = activationToken(user);

    const option = {
      expires: new Date(Date.now() + 60 * 60 * 1000),
    };

    const settings = await prisma.siteSettings.findFirst({});

    const data = {
      siteName: settings?.siteName,
      user: { name: user.name },
      otp,
    };

    try {
      await sendEmail({
        email: user.email,
        subject: "Activate your account",
        template: "activation-mail.ejs",
        data,
      });
    } catch (error: any) {
      return next(new ErrorHandler(400, error?.message));
    }

    return res.status(200).cookie("activation", token, option).json({
      success: true,
      message: "Verification mail has been sent to your email.",
    });
  }
);

export const activateUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { otp } = req.body;
    const { activation } = req.cookies;

    if (!activation) {
      return next(
        new ErrorHandler(
          400,
          "Verification session expired. Please sign up again."
        )
      );
    }

    const newUser = jwt.verify(
      activation,
      process.env.JWT_SECRET as Secret
    ) as { user: IRegistration; activationCode: { otp: string; expire: Date } };

    if (newUser.activationCode.expire < new Date(Date.now())) {
      return next(
        new ErrorHandler(400, "Activation code already expired. Try again ")
      );
    }

    if (newUser.activationCode.otp !== otp)
      return next(new ErrorHandler(400, "Invalid activation code"));

    res.clearCookie("activation", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    const { name, email, password } = newUser.user;

    const isExist = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (isExist) {
      return next(new ErrorHandler(400, "Email already exists."));
    }

    const user = await prisma.user.create({
      omit: {
        password: false,
      },
      data: {
        name,
        email,
        password,
      },
    });

    await prisma.profile.create({
      data: {
        userId: user.id,
      },
    });

    sendToken(user, 200, res);
  }
);

export const resendOtp = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { activation } = req.cookies;

    if (!activation) {
      return next(
        new ErrorHandler(
          400,
          "Verification session expired. Please sign up again."
        )
      );
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(
        activation,
        process.env.JWT_SECRET as Secret
      ) as {
        user: IRegistration;
        activationCode: { otp: string; expire: Date };
      };
    } catch (err) {
      return next(
        new ErrorHandler(400, "Invalid or expired activation token.")
      );
    }

    const { user } = decodedToken;

    const isExist = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (isExist) {
      return next(new ErrorHandler(400, "Email already exists."));
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expire = new Date(Date.now() + 5 * 60 * 1000);

    const newActivationToken = jwt.sign(
      {
        user,
        activationCode: {
          otp,
          expire,
        },
      },
      process.env.JWT_SECRET as Secret,
      { expiresIn: "60m" }
    );

    res.cookie("activation", newActivationToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    const settings = await prisma.siteSettings.findFirst({});

    const data = {
      siteName: settings?.siteName,
      user: { name: user.name },
      otp,
    };

    try {
      await sendEmail({
        email: user.email,
        subject: "Activate your account",
        template: "activation-mail.ejs",
        data,
      });
    } catch (error: any) {
      return next(new ErrorHandler(400, error?.message));
    }

    res.status(200).json({
      success: true,
      message: "OTP has been resent successfully. Please check your email.",
    });
  }
);

interface ILogin {
  email: string;
  password: string;
}

export const login = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body as ILogin;
    if (!email || !password) {
      return next(new ErrorHandler(400, "Please enter email and password"));
    }

    const user = await prisma.user.findUnique({
      omit: {
        password: false,
      },
      where: { email },
      include: {
        profile: {
          select: {
            avatar: true,
          },
        },
      },
    });
    if (!user) {
      return next(new ErrorHandler(400, "Invalid email or password"));
    }

    const isMatch = await bcrypt.compare(password, user.password as string);

    if (!isMatch) {
      return next(new ErrorHandler(400, "Invalid email or password"));
    }
    sendToken(user, 200, res);
  }
);

export const logout = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie("access_token");

    res.status(200).json({
      success: true,
      message: "Logout Successfully",
    });
  }
);

export const getUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = req.user;

    if (!data) {
      return next(new ErrorHandler(404, "User not found"));
    }

    const user = await prisma.user.findUnique({
      where: { id: data.id },
      include: {
        profile: {
          include: {
            social: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      user,
    });
  }
);

export const getAuthorDetails = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const author = await prisma.user.findUnique({
      where: { id },
      include: {
        posts: {
          where: { published: true },
          include: {
            likes: true,
            comments: true,
          },
        },
        profile: {
          include: {
            social: true,
          },
        },
      },
    });

    if (!author) {
      return next(new ErrorHandler(404, "User not found"));
    }

    res.status(200).json({
      success: true,
      author,
    });
  }
);

interface ISocialAuth {
  name: string;
  email: string;
  avatar: string;
}

export const socialAuth = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, avatar } = req.body as ISocialAuth;

    const user = await prisma.user.findUnique({
      omit: {
        password: false,
      },
      where: {
        email,
      },
      include: {
        profile: {
          include: {
            social: true,
          },
        },
      },
    });

    if (!user) {
      const newUser = await prisma.user.create({
        omit: {
          password: false,
        },
        data: {
          name,
          email,
          isSocial: true,
          profile: {
            create: {
              avatar,
            },
          },
        },
      });

      sendToken(newUser, 201, res);
    } else {
      sendToken(user, 200, res);
    }
  }
);

export const forgotPassword = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return next(new ErrorHandler(404, "User not found"));
    }

    const { resetExpire, resetToken, resetPasswordToken } = getResetPassword();

    await prisma.user.update({
      where: {
        email,
      },
      data: {
        resetPasswordToken,
        resetPasswordExpire: new Date(resetExpire),
      },
    });

    const resetPasswordLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const settings = await prisma.siteSettings.findFirst({});

    const data = { siteName: settings?.siteName, link: resetPasswordLink };

    try {
      await sendEmail({
        email: user.email,
        subject: "Account password reset",
        template: "reset-password.ejs",
        data,
      });

      res.status(200).json({
        success: true,
        message: `Email sent to ${user.email} successfully.`,
      });
    } catch (error) {
      await prisma.user.update({
        where: { email },
        data: {
          resetPasswordToken: null,
          resetPasswordExpire: null,
        },
      });

      const err = error as Error;
      return next(new ErrorHandler(400, err.message || "Failed to send email"));
    }
  }
);

export const resetPassword = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken,
        resetPasswordExpire: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return next(
        new ErrorHandler(400, "Reset Password token is invalid or expired")
      );
    }

    if (req.body.password !== req.body.confirmPassword) {
      return next(new ErrorHandler(400, "Password does not match"));
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: null,
        resetPasswordExpire: null,
        password: hashedPassword,
      },
    });

    res.status(200).json({
      success: true,
      message: "Password Reset Successfully",
    });
  }
);

export const updateProfile = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = req.user;
    const {
      name,
      email,
      bio,
      mailLink,
      instaLink,
      linkedinLink,
      facebookLink,
      githubLink,
    } = req.body;

    if (!data) {
      return next(new ErrorHandler(400, "Please login to access the resource"));
    }

    if (!name || !email || !bio) {
      return next(new ErrorHandler(400, "Please fill all the fields"));
    }

    await prisma.user.update({
      where: { id: data.id },
      data: {
        name,
        email,
        profile: {
          upsert: {
            create: {
              bio,
              social: {
                create: {
                  mailLink,
                  instaLink,
                  linkedinLink,
                  facebookLink,
                  githubLink,
                },
              },
            },
            update: {
              bio,
              social: {
                upsert: {
                  create: {
                    mailLink,
                    instaLink,
                    linkedinLink,
                    facebookLink,
                    githubLink,
                  },
                  update: {
                    mailLink,
                    instaLink,
                    linkedinLink,
                    facebookLink,
                    githubLink,
                  },
                },
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
    });
  }
);

export const updataAvatar = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { avatar } = req.body;
    const id = req.user?.id;

    if (!avatar) {
      return next(new ErrorHandler(400, "Please upload image"));
    }

    const user = await prisma.profile.findUnique({
      where: { userId: id },
    });

    let avatarUrl;
    let avatarId;

    if (user?.avatar) {
      if (user?.avatarId) {
        await cloudinary.uploader.destroy(user.avatarId as string);
      }
      const myCloud = await cloudinary.uploader.upload(avatar, {
        folder: "blog/avatar",
        crop: "scale",
      });

      avatarUrl = myCloud.secure_url;
      avatarId = myCloud.public_id;
    } else {
      const myCloud = await cloudinary.uploader.upload(avatar, {
        folder: "blog/avatar",
        crop: "scale",
      });

      avatarUrl = myCloud.secure_url;
      avatarId = myCloud.public_id;
    }
    await prisma.profile.update({
      where: { userId: id },
      data: {
        avatar: avatarUrl,
        avatarId,
      },
    });

    res
      .status(200)
      .json({ success: true, message: "Profile picture updated successfully" });
  }
);

export const updatePassword = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword } = req.body;
    const id = req.user?.id;

    if (!currentPassword || !newPassword) {
      return next(new ErrorHandler(400, "Please enter old and new password"));
    }

    const user = await prisma.user.findUnique({
      omit: {
        password: false,
      },
      where: {
        id,
      },
    });

    if (user?.password === undefined) {
      return next(new ErrorHandler(400, "Invalid user"));
    }

    if (!user) {
      return next(new ErrorHandler(404, "User not found"));
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password as string
    );

    if (!isMatch) {
      return next(new ErrorHandler(400, "Old password is incorrect"));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  }
);

export const authorRequest = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.user?.id;

    if (!id) {
      return next(new ErrorHandler(400, "Please login to access the resource"));
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return next(new ErrorHandler(404, "User not found."));
    }

    const reason =
      "I am passionate about writing and want to share my expertise in technology, programming, and personal growth. I believe my articles will provide valuable insights to the readers of Orbit Blog and contribute to building an engaging community. I would love the opportunity to inspire and educate others through your platform.";

    const settings = await prisma.siteSettings.findFirst({});

    const data = {
      siteName: settings?.siteName,
      name: user?.name,
      email: user?.email,
      userReason: reason,
    };

    const isNotified = await prisma.notification.findFirst({
      where: { userId: id, isRead: false },
    });

    if (isNotified) {
      return next(
        new ErrorHandler(400, "Already requested. Please wait 24 hours.")
      );
    }

    await prisma.notification.create({
      data: {
        title: "Author request",
        message: `You have a new author request by ${user?.name}`,
        userId: id,
      },
    });

    try {
      await sendEmail({
        email: process.env.ADMIN_MAIL || "",
        subject: `New Author Request on ${settings?.siteName}`,
        template: "author-request.ejs",
        data,
      });
    } catch (error) {
      return next(new ErrorHandler(400, error as string));
    }

    res.status(200).json({
      success: true,
      message: "You will get the mail within 24 hours.",
    });
  }
);

// Admin

export const getAllUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = await prisma.user.findMany();

    res.status(200).json({
      success: true,
      users,
    });
  }
);

export const getUserDetails = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            comments: true,
            reply: true,
            posts: true,
            postLike: true,
          },
        },
        posts: true,
        profile: {
          include: {
            social: true,
          },
        },
      },
    });

    if (!user) {
      return next(new ErrorHandler(404, "User not found"));
    }

    res.status(200).json({
      success: true,
      user,
    });
  }
);

export const getAllComments = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const comments = await prisma.comment.findMany({
      include: {
        post: {
          select: {
            slug: true,
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const replyData = await prisma.reply.findMany({
      include: {
        comment: {
          select: {
            content: true,
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            post: {
              select: {
                slug: true,
                id: true,
                title: true,
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
    });

    const replies = replyData.map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
      post: r.comment?.post || null,
      postId: r.comment?.post.id,
      user: r.user,
      RepliedTo: {
        id: r.comment?.id || null,
        content: r.comment?.content || null,
        user: r.comment?.user || null,
      },
      userId: r.userId,
      type: "Reply",
    }));

    const comms = [
      ...comments.map((c) => ({ ...c, type: "Comment" })),
      ...replies,
    ];

    res.status(200).json({
      success: true,
      comms,
    });
  }
);

export const updateRole = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const { role } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return next(new ErrorHandler(404, "User not found"));
    }

    await prisma.user.update({
      where: { id },
      data: {
        role,
      },
    });

    const settings = await prisma.siteSettings.findFirst({});

    const data = {
      siteName: settings?.siteName,
      name: user.name,
      dashboardUrl: `${process.env.CLIENT_URL}/profile`,
    };

    try {
      await sendEmail({
        email: user.email,
        subject: "Author request has been Approved",
        template: "author-approved.ejs",
        data,
      });
    } catch (error) {
      return next(new ErrorHandler(400, error as string));
    }

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
    });
  }
);

export const deleteUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return next(new ErrorHandler(404, "User not found"));
    }

    await prisma.user.delete({
      where: { id },
      include: { profile: true },
    });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  }
);
