import express, { type Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import "./jobs/cleanupRevokedTokens.js";
import { xssSanitizerMiddleware } from "./middleware/xss.js";

import usersRoutes from "./routes/users.js";
import authRoutes from "./routes/auth.js";
import reviewsRoutes from "./routes/reviews.js";
import transactionsRoutes from "./routes/transactions.js";
import productsRoutes from "./routes/products.js";
import productImagesRoutes from "./routes/product_images.js";
import discountsRoutes from "./routes/discounts.js";
import paymentsRoutes from "./routes/payments.js";

dotenv.config();

const app = express();

// CORS setup
const corsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: false
};
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: "Too many requests, please try again later."
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", true);
app.use(xssSanitizerMiddleware);

app.use("/api/users", usersRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/product/images", productImagesRoutes);
app.use("/api/discounts", discountsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res: Response) => {
    return res.status(200).send("Alright!");
});

if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log("Server running on PORT", PORT);
    });
}

export default app;