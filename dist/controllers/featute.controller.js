import { TryCatch } from "../middlewares/error";
import prisma from "../lib/db";
export const RelatedPost = TryCatch(async (req, res, next) => {
    const { value } = req.body;
    const post = await prisma.category.findMany({
        where: { value },
        take: 3,
        include: {
            posts: true,
        },
    });
    res.status(200).json({
        success: true,
        post,
    });
});
