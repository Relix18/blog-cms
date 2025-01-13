import { NextFunction, Request, Response } from "express";
import prisma from "../lib/db.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/errorHandler.js";
import { v2 as cloudinary } from "cloudinary";

export const createSiteSettings = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      logo,
      name,
      heroTitle,
      heroDescription,
      accentColor,
      heroImage,
      gradientStart,
      gradientEnd,
    } = req.body;

    if (
      !logo ||
      !name ||
      !heroTitle ||
      !heroDescription ||
      !accentColor ||
      !gradientStart ||
      !gradientEnd
    ) {
      return next(new ErrorHandler(400, "All fields are required"));
    }

    try {
      const logoUpload = await cloudinary.uploader.upload(logo, {
        folder: "blog/site",
        crop: "scale",
      });

      let heroImageData = {};
      if (heroImage) {
        const heroUpload = await cloudinary.uploader.upload(heroImage, {
          folder: "blog/site",
          crop: "scale",
        });
        heroImageData = {
          heroImageUrl: heroUpload.secure_url,
          heroImageUrlId: heroUpload.public_id,
        };
      }

      await prisma.siteSettings.create({
        data: {
          siteName: name,
          heroTitle,
          heroDescription,
          logoUrl: logoUpload.secure_url,
          logoUrlId: logoUpload.public_id,
          accentColor,
          gradientStart,
          gradientEnd,
          ...heroImageData,
        },
      });

      res.status(200).json({
        success: true,
        message: "Site Settings has been created successfully.",
      });
    } catch (error) {
      return next(
        new ErrorHandler(500, "An error occurred while creating site settings")
      );
    }
  }
);

export const getSiteSettings = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const siteSettings = await prisma.siteSettings.findFirst();

    res.status(200).json({
      success: true,
      siteSettings,
    });
  }
);

export const updateSiteSettings = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      id,
      heroTitle,
      heroDescription,
      logo,
      siteName,
      accentColor,
      gradientStart,
      gradientEnd,
      heroImage,
    } = req.body;

    if (
      !id ||
      !heroTitle ||
      !heroDescription ||
      !logo ||
      !siteName ||
      !accentColor ||
      !gradientStart ||
      !gradientEnd
    ) {
      return next(new ErrorHandler(400, "All fields are required"));
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { id },
    });

    if (!settings) {
      return next(new ErrorHandler(404, "Settings not found."));
    }

    let logoUrl = settings.logoUrl;
    let logoUrlId = settings.logoUrlId;

    if (!logo.startsWith("https://res.cloudinary.com")) {
      if (settings.logoUrlId) {
        await cloudinary.uploader.destroy(settings.logoUrlId);
      }
      const uploadedLogo = await cloudinary.uploader.upload(logo, {
        folder: "blog/site",
        crop: "scale",
      });
      logoUrl = uploadedLogo.secure_url;
      logoUrlId = uploadedLogo.public_id;
    }

    let heroImageUrl = settings.heroImageUrl;
    let heroImageUrlId = settings.heroImageUrlId;

    if (heroImage && !heroImage.startsWith("https://res.cloudinary.com")) {
      if (settings.heroImageUrlId) {
        await cloudinary.uploader.destroy(settings.heroImageUrlId);
      }
      const uploadedHeroImage = await cloudinary.uploader.upload(heroImage, {
        folder: "blog/site",
        crop: "scale",
      });
      heroImageUrl = uploadedHeroImage.secure_url;
      heroImageUrlId = uploadedHeroImage.public_id;
    } else if (!heroImage && settings.heroImageUrlId) {
      await cloudinary.uploader.destroy(settings.heroImageUrlId);
      heroImageUrl = null;
      heroImageUrlId = null;
    }

    await prisma.siteSettings.update({
      where: { id },
      data: {
        siteName,
        heroTitle,
        heroDescription,
        logoUrl,
        logoUrlId,
        accentColor,
        gradientStart,
        gradientEnd,
        heroImageUrl,
        heroImageUrlId,
      },
    });

    res.status(200).json({
      success: true,
      message: "Site settings updated successfully.",
    });
  }
);
