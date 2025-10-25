import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { authenticate, AuthenticatedRequest } from "../middleware/authenticate";

const router = Router();

router.get("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.isAdmin) return res.status(403).send("Forbidden");

    const page = parseInt(req.query.page as string) || 1;
    const take = 10;
    const skip = (page - 1) * take;

    const [discounts, total] = await Promise.all([
        prisma.discounts.findMany({
            skip,
            take,
            orderBy: { createdAt: "desc" },
        }),
        prisma.discounts.count(),
    ]);

    res.status(200).json({discounts, total});
});

router.get("/:id", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    const discountId = Number(req.params.id);

    const discount = await prisma.discounts.findUnique({
        where: {
            id: discountId
        }
    });
    res.status(201).json(discount);
});

router.post("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    const { value, productId, expiresAt } = req.body;

    if (!req.isAdmin) return res.status(403);

    await prisma.discounts.create({
        data: { value, productId, expiresAt: new Date(expiresAt) },
    });
    res.status(201).json({ message: "Discount created" });
});

router.put("/:id", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    const { value, productId, expiresAt } = req.body;
    const discountId = Number(req.params.id);

    if (!req.isAdmin) return res.status(403);

    const discount = await prisma.discounts.findUnique({
        where: {
            id: discountId
        }
    });

    if (!discount) return;

    await prisma.discounts.update({
        data: { value, productId, expiresAt: new Date(expiresAt) },
        where: {
            id: discountId
        }
    });
    res.status(201).json({ message: "discount updated" });
});

router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
    const discountId = Number(req.params.id);

    if (!req.isAdmin) return res.status(403);

    await prisma.discounts.delete({
        where: {
            id: discountId
        }
    });
    res.status(201).json({ message: "discount deleted" });
});

export default router;