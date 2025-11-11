import { Router, type Request, type Response } from "express";
import { prisma } from "../utils/prisma.js";
import { checkEncryptedPassword, encryptPassword, generateToken, verifyToken } from "../utils/auth.js";
import { v4 as uuidv4 } from "uuid";
import { authenticate, type AuthenticatedRequest } from "../middleware/authenticate.js";
import rateLimit from "express-rate-limit";

const router = Router();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 5,
    message: "Too many attempts, please try again later",
});

router.get("/verify-token", authenticate, async (req: AuthenticatedRequest, res) => {
    return res.sendStatus(201);
});

router.post("/sign-up", async (req: Request, res: Response) => {
    try {
        const { username, password, type } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username or password is missing" });
        }

        const isUsernameTaken = await prisma.users.findUnique({
            where: { username },
        });

        if (isUsernameTaken) {
            return res.status(401).json({ message: "Username already registered" });
        }

        const encryptedPassword = await encryptPassword(password);

        const user = await prisma.users.create({
            data: {
                username,
                password: encryptedPassword,
            },
        });

        const token = await generateToken({ userId: user.id, refresh: false });
        const refreshToken = await generateToken({ userId: user.id, refresh: true });

        res
            .cookie("accessToken", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production", // só https em prod
                sameSite: "lax",
                maxAge: 60 * 60 * 1000, // 1 hora
            })
            .cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
            })
            .status(201)
            .json({ message: "User created successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating user" });
    }
});

router.post("/sign-in", limiter, async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username or password is missing" });
        }

        const user = await prisma.users.findUnique({
            where: { username },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const verifyPassword = await checkEncryptedPassword(password, user.password);
        if (!verifyPassword) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = await generateToken({ userId: user.id, refresh: false });
        const refreshToken = await generateToken({ userId: user.id, refresh: true });

        res
            .cookie("accessToken", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 1000, // 1 hour
            })
            .cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            })
            .status(200)
            .json({ message: "Login successful" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error signing in" });
    }
});

router.post("/refresh-token", limiter, async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token is required" });
        }

        const isTokenRevoked = await prisma.revokedTokens.findUnique({
            where: { token: refreshToken },
        });

        if (isTokenRevoked) {
            return res.status(401).json({ message: "Token revoked" });
        }

        const verifiedToken = await verifyToken(refreshToken);
        if (!verifiedToken || verifiedToken.data == null) {
            return res.status(401).json({ message: "Invalid token" });
        }

        await prisma.revokedTokens.create({
            data: { token: refreshToken },
        });

        const token = await generateToken({ userId: verifiedToken.data.userId, refresh: false });
        const newRefreshToken = await generateToken({ userId: verifiedToken.data.userId, refresh: true });

        res
            .cookie("accessToken", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 1000, // 1 hour
            })
            .cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            })
            .status(200)
            .json({ message: "Token refreshed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error refreshing token" });
    }
});

router.post("/password-recovery", limiter, async (req: Request, res: Response) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ message: "Nome de usuário é obrigatório" });
        }

        const user = await prisma.users.findUnique({
            where: { username },
        });

        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }

        await prisma.passwordRecoveries.create({
            data: {
                token: uuidv4(),
                userId: user.id,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });

        res.status(201).json({ message: "Token de recuperação criado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao recuperar senha" });
    }
});

export default router;