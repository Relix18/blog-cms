import { TryCatch } from "./error.js";
import ErrorHandler from "../utils/errorHandler.js";
import jwt from "jsonwebtoken";
import prisma from "../lib/db.js";
export const isAuthenticated = TryCatch(async (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) {
        return next(new ErrorHandler(401, "Please Login to access this resource "));
    }
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedData) {
        return next(new ErrorHandler(400, "Please Login to access this resource"));
    }
    req.user = await prisma.user.findUnique({
        where: {
            id: decodedData.user.id,
        },
    });
    next();
});
export const isAdmin = TryCatch(async (req, res, next) => {
    if (req.user?.role === "ADMIN") {
        next();
    }
    else {
        return next(new ErrorHandler(400, "You are not authorized to access this resource"));
    }
});
export const isAuthorOrAdmin = TryCatch(async (req, res, next) => {
    if (req.user?.role === "AUTHOR" || req.user?.role === "ADMIN") {
        next();
    }
    else {
        return next(new ErrorHandler(400, "You are not authorized to access this resource"));
    }
});
