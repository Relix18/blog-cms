import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import prisma from "../lib/db.js";
import ErrorHandler from "../utils/errorHandler.js";
import cron from "node-cron";

export const getNotifications = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const notifications = await prisma.notification.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, notifications });
  }
);

export const updateNotification = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const notification = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
      },
    });

    if (!notification) {
      return next(new ErrorHandler(404, "Notification not found"));
    }

    res.status(200).json({
      success: true,
      message: "Marked as Read.",
    });
  }
);

export const readAllNotification = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    await prisma.notification.updateMany({
      data: {
        isRead: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Marked all as Read.",
    });
  }
);

cron.schedule("0 0 * * *", async () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  await prisma.notification.deleteMany({
    where: {
      isRead: true,
      updatedAt: {
        lt: cutoffDate,
      },
    },
  });
  console.log("Deleted read notifications older than 30 days");
});
