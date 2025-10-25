import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { authenticate, AuthenticatedRequest } from "../middleware/authenticate";

const router = Router();

router.get("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.isAdmin) return res.status(403).send("Forbidden");

    const page = parseInt(req.query.page as string) || 1;
    const take = 10;
    const skip = (page - 1) * take;

    const [reviews, total] = await Promise.all([
        prisma.reviews.findMany({
            skip,
            take,
            orderBy: { createdAt: "desc" },
        }),
        prisma.reviews.count(),
    ]);

    res.status(200).json({ reviews, total });
});

router.get("/:id", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    const reviewId = Number(req.params.id);

    const review = await prisma.reviews.findUnique({
        where: {
            id: reviewId
        }
    });

    res.status(201).json(review);
});

router.post("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    const { title, content, rating, productId } = req.body;

    const userHasTransaction = await prisma.transactions.findFirst({
        where: {
            userId: req.authenticatedUserId,
            status: "COMPLETED",
            productId: productId
        }
    });

    if (!userHasTransaction) {
        return res.status(403).send("Forbidden");
    }

    await prisma.reviews.create({
        data: { title, content, rating, productId, userId: userHasTransaction.userId },
    });
    res.status(201).json({ message: "Review created" });
});

router.put("/:id", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    const { title, content, rating, productId } = req.body;
    const reviewId = Number(req.params.id);

    const review = await prisma.reviews.findUnique({
        where: {
            userId: req.authenticatedUserId,
            id: reviewId
        }
    });

    if (!review) {
        return res.status(403).send("Forbidden");
    }

    await prisma.reviews.update({
        data: { title, content, rating, productId },
        where: {
            id: reviewId
        }
    });
    res.status(201).json({ message: "Review updated" });
});

router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
    const reviewId = Number(req.params.id);

    const review = await prisma.reviews.findUnique({
        where: {
            userId: req.authenticatedUserId,
            id: reviewId
        }
    });

    if (!review && !req.isAdmin) {
        return res.status(403).send("Forbidden");
    }

    await prisma.reviews.delete({
        where: {
            id: reviewId
        }
    });
    res.status(201).json({ message: "Review deleted" });
});

router.patch("/approve-review/:id", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    const reviewId = Number(req.params.id);

    if (!req.isAdmin) {
        return res.status(403).send("Forbidden");
    }

    await prisma.reviews.update({
        where: {
            id: reviewId
        },
        data: { approved: true },
    });
    res.status(201).json({ message: "Review created" });
});

export default router;