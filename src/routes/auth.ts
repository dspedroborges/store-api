import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { checkEncryptedPassword, encryptPassword, generateToken, verifyToken } from "../utils/auth";
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post("/signup", async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email or password is missing" });
        }

        const isEmailTaken = await prisma.users.findUnique({
            where: {
                email
            }
        });

        if (isEmailTaken) {
            return res.status(401).json({ error: "Email already taken" });
        }

        const passwordEncrypted = await encryptPassword(password);

        const user = await prisma.users.create({
            data: { name, email, password: passwordEncrypted, is_admin: false },
        });

        const token = await generateToken({ userId: user.id, refresh: false });
        const refreshToken = await generateToken({ userId: user.id, refresh: true });

        res.status(201).json({ token, refreshToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error when trying to create user" });
    }
});

router.post("/signin", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email or password is missing" });
        }

        const user = await prisma.users.findUnique({
            where: {
                email
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const verifyPassword = await checkEncryptedPassword(password, user.password);

        if (!verifyPassword) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = await generateToken({ userId: user.id, refresh: false });
        const refreshToken = await generateToken({ userId: user.id, refresh: true });

        res.status(201).json({ token, refreshToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error when trying to create user" });
    }
});

router.post("/refresh-token", async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        const isTokenRevoked = await prisma.revokedTokens.findUnique({
            where: {
                token: refreshToken
            }
        });

        if (isTokenRevoked) {
            return res.status(401).json({ error: "Token revoked" });
        }

        if (!refreshToken) {
            return res.status(401).json({ error: "Refresh token must be provided" });
        }

        const verifiedToken = await verifyToken(refreshToken);

        if (!verifiedToken) {
            return res.status(401).json({ error: "Invalid token" });
        }

        await prisma.revokedTokens.create({
            data: {
                token: refreshToken
            }
        });

        const token = await generateToken({ userId: verifiedToken.data.userId, refresh: false });
        const newRefreshToken = await generateToken({ userId: verifiedToken.data.userId, refresh: true });

        res.status(201).json({ token, newRefreshToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error when trying to create user" });
    }
});

router.post("/password-recovery", async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        const user = await prisma.users.findUnique({
            where: {
                email
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        await prisma.passwordRecoveries.create({
            data: {
                token: uuidv4(),
                userId: user.id,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000) // expires in 1 hour
            }
        });

        // code to send email here:

        res.status(201).json({ message: "Email has been sent" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error when trying to create user" });
    }
});

export default router;