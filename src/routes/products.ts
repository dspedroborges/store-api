import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { authenticate, AuthenticatedRequest } from "../middleware/authenticate";

const router = Router();

router.get("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.isAdmin) return res.status(403).send("Forbidden");

    const page = parseInt(req.query.page as string) || 1;
    const take = 10;
    const skip = (page - 1) * take;

    const [products, total] = await Promise.all([
        prisma.products.findMany({
            skip,
            take,
            orderBy: { createdAt: "desc" },
            include: {
                images: true,
            }
        }),
        prisma.products.count(),
    ]);

    res.status(200).json({products, total});
});

router.get("/:id", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    const productId = Number(req.params.id);

    const product = await prisma.products.findUnique({
        where: {
            id: productId
        },
        include: {
            images: true
        }
    });

    res.status(201).json(product);
});

router.post("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    const { name, description, price, stock } = req.body;

    if (!req.isAdmin) return res.status(403);

    await prisma.products.create({
        data: { name, description, price, stock },
    });
    res.status(201).json({ message: "Product created" });
});

router.put("/:id", authenticate, async (req: AuthenticatedRequest, res: Response) => {
    const { name, description, price, stock } = req.body;
    const productId = Number(req.params.id);

    if (!req.isAdmin) return res.status(403);

    const product = await prisma.products.findUnique({
        where: {
            id: productId
        }
    });

    if (!product) return;

    await prisma.products.update({
        data: { name, description, price, stock },
        where: {
            id: productId
        }
    });
    res.status(201).json({ message: "Product updated" });
});

router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
    const productId = Number(req.params.id);

    if (!req.isAdmin) return res.status(403);

    await prisma.products.delete({
        where: {
            id: productId
        }
    });
    res.status(201).json({ message: "Product deleted" });
});

export default router;