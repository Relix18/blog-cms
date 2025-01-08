import prisma from "../lib/db";
import { TryCatch } from "../middlewares/error";
import ErrorHandler from "../utils/errorHandler";
import { v2 as cloudinary } from "cloudinary";
export const createSiteSettings = TryCatch(async (req, res, next) => {
    const { logo, name, accentColor, heroImage, gradientBackground } = req.body;
    if (!logo || !name || !accentColor || !gradientBackground) {
        return next(new ErrorHandler(400, "All field is required"));
    }
    let logoUrl;
    let logoUrlId;
    try {
        const myCloud = await cloudinary.uploader.upload(logo, {
            folder: "blog/site",
            crop: "scale",
        });
        logoUrl = myCloud.secure_url;
        logoUrlId = myCloud.public_id;
    }
    catch (error) {
        return next(new ErrorHandler(400, "An error occurred"));
    }
    if (heroImage) {
        try {
            const myCloud = await cloudinary.uploader.upload(heroImage, {
                folder: "blog/site",
                crop: "scale",
            });
            const heroUrl = myCloud.secure_url;
            const heroUrlId = myCloud.public_id;
            await prisma.siteSettings.create({
                data: {
                    siteName: name,
                    logoUrl,
                    logoUrlId,
                    accentColor,
                    gradientBackground,
                    heroImageUrl: heroUrl,
                    heroImageUrlId: heroUrlId,
                },
            });
        }
        catch (error) {
            return next(new ErrorHandler(400, "An error occurred"));
        }
    }
    else {
        await prisma.siteSettings.create({
            data: {
                siteName: name,
                logoUrl,
                logoUrlId,
                accentColor,
                gradientBackground,
            },
        });
    }
    res.status(200).json({
        success: true,
        message: "Site Settings has been created successfully.",
    });
});
export const updateSiteSettings = TryCatch(async (req, res, next) => {
    const { settingId, logo, name, accentColor, gradientBackground } = req.body;
    if (!settingId || !logo || !name || !accentColor || !gradientBackground) {
        return next(new ErrorHandler(400, "All field is required"));
    }
    const settings = await prisma.siteSettings.findUnique({
        where: { id: settingId },
    });
    if (!settings) {
        return next(new ErrorHandler(404, "Settings not found."));
    }
    let logoUrl;
    let logoUrlId;
    if (!logo.startsWith("https://res.cloudinary.com")) {
        await cloudinary.uploader.destroy(settings?.logoUrlId);
        const myCloud = await cloudinary.uploader.upload(logo, {
            folder: "blog/site",
            crop: "scale",
        });
        logoUrl = myCloud.secure_url;
        logoUrlId = myCloud.public_id;
    }
    await prisma.siteSettings.create({
        data: {
            siteName: name,
            logoUrl,
            logoUrlId,
            accentColor,
            gradientBackground,
        },
    });
    res.status(200).json({
        success: true,
        message: "Site Settings has been updated successfully.",
    });
});
export const updateSiteHeroImage = TryCatch(async (req, res, next) => {
    const { id, image } = req.body;
    const settings = await prisma.siteSettings.findUnique({
        where: { id },
    });
    if (!settings) {
        return next(new ErrorHandler(404, "Settings not found."));
    }
    let heroImageUrl;
    let heroImageUrlId;
    if (settings?.heroImageUrl) {
        if (settings?.heroImageUrlId) {
            await cloudinary.uploader.destroy(settings.heroImageUrlId);
        }
        const myCloud = await cloudinary.uploader.upload(image, {
            folder: "blog/avatar",
            crop: "scale",
        });
        heroImageUrl = myCloud.secure_url;
        heroImageUrlId = myCloud.public_id;
    }
    else {
        const myCloud = await cloudinary.uploader.upload(avatar, {
            folder: "blog/avatar",
            crop: "scale",
        });
        heroImageUrl = myCloud.secure_url;
        heroImageUrlId = myCloud.public_id;
    }
    await prisma.siteSettings.update({
        where: { id },
        data: {
            heroImageUrl,
            heroImageUrlId,
        },
    });
    res.status(200).json({
        success: true,
        message: "Image updated successfully",
    });
});
