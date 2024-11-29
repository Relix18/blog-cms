import prisma from "../lib/db.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/errorHandler.js";
import bcrypt from "bcryptjs";
import { activationToken, getResetPassword, sendToken, } from "../utils/jwtToken.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import ejs from "ejs";
import path from "path";
import sendEmail from "../utils/sendMail.js";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const register = TryCatch(async (req, res, next) => {
    const { name, email, password } = req.body;
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
    const data = { user: { name: user.name }, otp };
    const html = await ejs.renderFile(path.join(__dirname, "../../src/mails/activation-mail.ejs"), data);
    try {
        await sendEmail({
            email: user.email,
            subject: "Activate your account",
            template: "activation-mail.ejs",
            data,
        });
    }
    catch (error) {
        return next(new ErrorHandler(400, error?.message));
    }
    return res.status(200).cookie("activation", token, option).json({
        success: true,
        message: "Verification mail has been sent to your email.",
    });
});
export const activateUser = TryCatch(async (req, res, next) => {
    const { otp } = req.body;
    const { activation } = req.cookies;
    if (!activation) {
        return next(new ErrorHandler(400, "Verification session expired. Please sign up again."));
    }
    const newUser = jwt.verify(activation, process.env.JWT_SECRET);
    if (newUser.activationCode.expire < new Date(Date.now())) {
        return next(new ErrorHandler(400, "Activation code already expired. Try again "));
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
        data: {
            name,
            email,
            password,
        },
    });
    sendToken(user, 200, res);
});
export const resendOtp = TryCatch(async (req, res, next) => {
    const { activation } = req.cookies;
    if (!activation) {
        return next(new ErrorHandler(400, "Verification session expired. Please sign up again."));
    }
    let decodedToken;
    try {
        decodedToken = jwt.verify(activation, process.env.JWT_SECRET);
    }
    catch (err) {
        return next(new ErrorHandler(400, "Invalid or expired activation token."));
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
    const newActivationToken = jwt.sign({
        user,
        activationCode: {
            otp,
            expire,
        },
    }, process.env.JWT_SECRET, { expiresIn: "60m" });
    res.cookie("activation", newActivationToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 1000,
    });
    const data = { user: { name: user.name }, otp };
    await ejs.renderFile(path.join(__dirname, "../../src/mails/activation-mail.ejs"), data);
    try {
        await sendEmail({
            email: user.email,
            subject: "Activate your account",
            template: "activation-mail.ejs",
            data,
        });
    }
    catch (error) {
        return next(new ErrorHandler(400, error?.message));
    }
    res.status(200).json({
        success: true,
        message: "OTP has been resent successfully. Please check your email.",
    });
});
export const login = TryCatch(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorHandler(400, "Please enter email and password"));
    }
    const user = await prisma.user.findUnique({
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
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return next(new ErrorHandler(400, "Invalid email or password"));
    }
    sendToken(user, 200, res);
});
export const logout = TryCatch(async (req, res, next) => {
    res.clearCookie("access_token");
    res.status(200).json({
        success: true,
        message: "Logout Successfully",
    });
});
export const getUser = TryCatch(async (req, res, next) => {
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
});
export const socialAuth = TryCatch(async (req, res, next) => {
    const { name, email, avatar } = req.body;
    const user = await prisma.user.findUnique({
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
    }
    else {
        sendToken(user, 200, res);
    }
});
export const forgotPassword = TryCatch(async (req, res, next) => {
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
    const data = { link: resetPasswordLink };
    const html = await ejs.renderFile(path.join(__dirname, "../../src/mails/reset-password.ejs"), data);
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
    }
    catch (error) {
        await prisma.user.update({
            where: { email },
            data: {
                resetPasswordToken: null,
                resetPasswordExpire: null,
            },
        });
        const err = error;
        return next(new ErrorHandler(400, err.message || "Failed to send email"));
    }
});
export const resetPassword = TryCatch(async (req, res, next) => {
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
        return next(new ErrorHandler(400, "Reset Password token is invalid or expired"));
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
});
export const updateProfile = TryCatch(async (req, res, next) => {
    const data = req.user;
    const { name, email, bio, mailLink, instaLink, linkedinLink, facebookLink, githubLink, } = req.body;
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
});
export const updataAvatar = TryCatch(async (req, res, next) => {
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
        await cloudinary.uploader.destroy(user.avatarId);
        const myCloud = await cloudinary.uploader.upload(avatar, {
            folder: "blog/avatar",
            crop: "scale",
        });
        avatarUrl = myCloud.secure_url;
        avatarId = myCloud.public_id;
    }
    else {
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
});
export const updatePassword = TryCatch(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const id = req.user?.id;
    if (!currentPassword || !newPassword) {
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
    const isMatch = await bcrypt.compare(currentPassword, user.password);
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
});
// Admin
export const getAllUser = TryCatch(async (req, res, next) => {
    const users = await prisma.user.findMany();
    res.status(200).json({
        success: true,
        users,
    });
});
export const getUserDetails = TryCatch(async (req, res, next) => {
    const id = req.params.id;
    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            posts: true,
            profile: true,
        },
    });
    if (!user) {
        return next(new ErrorHandler(404, "User not found"));
    }
    res.status(200).json({
        success: true,
        user,
    });
});
export const updateRole = TryCatch(async (req, res, next) => {
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
    res.status(200).json({
        success: true,
        message: "Role updated successfully",
    });
});
export const deleteUser = TryCatch(async (req, res, next) => {
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
});
