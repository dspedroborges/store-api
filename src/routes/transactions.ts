import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { authenticate, AuthenticatedRequest } from "../middleware/authenticate";

const router = Router();

router.get("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.isAdmin) return res.status(403).send("Forbidden");

    const page = parseInt(req.query.page as string) || 1;
    const take = 10;
    const skip = (page - 1) * take;

    const [transactions, total] = await Promise.all([
        prisma.transactions.findMany({
            skip,
            take,
            orderBy: { createdAt: "desc" },
        }),
        prisma.transactions.count(),
    ]);

    res.status(200).json({transactions, total});
});

router.get("/:id", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    const transactionId = Number(req.params.id);

    const transaction = await prisma.transactions.findUnique({
        where: {
            id: transactionId
        },
    });

    res.status(201).json(transaction);
});

router.post("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    const { productId, userId, price, expiresAt } = req.body;

    if (!req.isAdmin) return res.status(403);

    await prisma.transactions.create({
        data: { productId, userId, price, expiresAt: new Date(expiresAt) },
    });
    res.status(201).json({ message: "Transaction created" });
});

router.put("/:id", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    const { status } = req.body;
    const transactionId = Number(req.params.id);

    if (!req.isAdmin) return res.status(403);

    const transaction = await prisma.transactions.findUnique({
        where: {
            id: transactionId
        }
    });

    if (!transaction) return;

    await prisma.transactions.update({
        data: { status },
        where: {
            id: transactionId
        }
    });
    res.status(201).json({ message: "Transaction updated" });
});

export default router;