import jwt, { Secret } from "jsonwebtoken";
import { IRegistration } from "../types/types.js";
import { Response } from "express";
import { IUser } from "../types/types";
import crypto from "crypto";

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const token = jwt.sign(
    {
      user,
    },
    process.env.JWT_SECRET as Secret,
    {
      expiresIn: "15d",
    }
  );

  const option = {
    expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  res.cookie("access_token", token, option);

  res.status(statusCode).json({
    success: true,
    user,
    token,
  });
};

export const activationToken = (user: IRegistration) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const token = jwt.sign(
    {
      user,
      activationCode: {
        otp,
        expire: new Date(Date.now() + 5 * 60 * 1000),
      },
    },
    process.env.JWT_SECRET as Secret,
    {
      expiresIn: "60m",
    }
  );
  return { token, otp };
};

export const getResetPassword = () => {
  const resetToken = crypto.randomBytes(20).toString("hex");
  const resetExpire = Date.now() + 60 * 60 * 1000;

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  return { resetExpire, resetToken, resetPasswordToken };
};
