import prisma from "../data/db.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/errorHandler.js";
import bcrypt from "bcryptjs";
import { activationToken, sendToken } from "../utils/jwtToken.js";
import jwt from "jsonwebtoken";
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
    const { token, activationCode } = activationToken(user);
    const option = {
        expires: new Date(Date.now() + 5 * 60 * 1000),
    };
    return res.status(200).cookie("activation", token, option).json({
        success: true,
        token,
        activationCode,
    });
});
export const activateUser = TryCatch(async (req, res, next) => {
    const { activationCode } = req.body;
    const { activation } = req.cookies;
    if (!activation) {
        return next(new ErrorHandler(400, "Activation Code already expired. Try Again"));
    }
    const newUser = jwt.verify(activation, process.env.JWT_SECRET);
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
    const created = await prisma.user.create({
        data: {
            name,
            email,
            password,
        },
    });
    res.status(200).json({
        success: true,
        user: created,
    });
});
export const login = TryCatch(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorHandler(400, "Please enter email and password"));
    }
    const user = await prisma.user.findUnique({
        where: { email },
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
