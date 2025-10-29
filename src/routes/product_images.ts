import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { authenticate, AuthenticatedRequest } from "../middleware/authenticate";
import multer from "multer";

const router = Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });

router.post("/", authenticate, upload.single("file"), async (req: AuthenticatedRequest, res: Response) => {
  const { productId } = req.body;
  const file = req.file;

  if (!req.isAdmin) return res.status(403).send("Forbidden");
  if (!file) return res.status(400).json({ message: "No file uploaded" });

  const url = `/uploads/${file.filename}`;

  await prisma.productImages.create({ data: { productId: Number(productId), url } });
  res.status(201).json({ message: "Image created", url });
});

router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
    const productImageId = Number(req.params.id);

    if (!req.isAdmin) return res.status(403);

    await prisma.productImages.delete({
        where: {
            id: productImageId
        }
    });
    res.status(201).json({ message: "Image deleted" });
});

export default router;