import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";
import { prisma } from "../utils/prisma";

export interface AuthenticatedRequest extends Request {
  authenticatedUserId?: number;
  isAdmin?: boolean;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) return res.sendStatus(401);

  const decoded = await verifyToken(token);
  
  if (!decoded.valid) return res.sendStatus(401);

  const user = await prisma.users.findUnique({
    where: {
      id: decoded.data.userId
    }
  });

  if (!user) return res.sendStatus(404);

  if (user.is_admin) {
    req.isAdmin = true;
  }

  req.authenticatedUserId = decoded.data.id;
  next();
}