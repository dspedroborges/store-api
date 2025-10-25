import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";

export async function log(req: Request, res: Response, next: NextFunction) {
  // Get IP (handles proxies too)
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
    req.socket.remoteAddress ||
    req.ip;

  console.log("User IP:", ip);

  await prisma.log.create({
    data: {
      ip,
      path: req.path,
      method: req.method,
      createdAt: new Date(),
    },
  });

  next();
}
