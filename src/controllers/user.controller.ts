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

//Register a User
export interface IRegistration {
  name: string;
  email: string;
  password: string;
}

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

    const { token, activationCode } = activationToken(user);

    const option = {
      expires: new Date(Date.now() + 5 * 60 * 1000),
    };

    //Note nodemailer

    return res.status(200).cookie("activation", token, option).json({
      success: true,
      token,
      activationCode,
    });
  }
);

export const activateUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { activationCode } = req.body;
    const { activation } = req.cookies;

    if (!activation) {
      return next(
        new ErrorHandler(400, "Activation Code already expired. Try Again")
      );
    }

    const newUser = jwt.verify(
      activation,
      process.env.JWT_SECRET as Secret
    ) as { user: IRegistration; activationCode: string };

    if (newUser.activationCode !== activationCode)
      return next(new ErrorHandler(400, "Invalid activation code"));

    res.cookie("activation", "", { expires: new Date() });

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
      data: {
        name,
        email,
        password,
      },
    });

    await prisma.profile.create({
      data: {
        userId: user.id,
        avatar: "foi",
      },
    });

    res.status(200).json({
      success: true,
      user,
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
      where: { email },
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
    res.cookie("access_token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });

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
        profile: true,
      },
    });

    res.status(200).json({
      success: true,
      user,
    });
  }
);

interface ISocialAuth {
  name: string;
  email: string;
}

export const socialAuth = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email } = req.body as ISocialAuth;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
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

    try {
      //Note nodemailer
      console.log(resetToken);
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
    const { name, email, bio, avatar } = req.body;

    if (!data) {
      return next(new ErrorHandler(400, "Please login to access the resource"));
    }

    if (!avatar || !name || !email || !bio) {
      return next(new ErrorHandler(400, "Please fill all the fields"));
    }

    //Note cloudinary avatar upload

    await prisma.user.update({
      where: {
        id: data?.id,
      },
      data: {
        name,
        email,
        profile: {
          update: {
            avatar,
            bio,
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

export const updatePassword = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { oldPassword, newPassword } = req.body;
    const id = req.user?.id;

    if (!oldPassword || !newPassword) {
      return next(new ErrorHandler(400, "Please enter old and new password"));
    }

    const user = await prisma.user.findUnique({
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

    const isMatch = await bcrypt.compare(oldPassword, user.password as string);

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
