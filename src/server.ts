import express from "express";
import dotenv from "dotenv";
import usersRoutes from "./routes/users";
import reviewsRoutes from "./routes/reviews";
import transactionsRoutes from "./routes/transactions";
import productsRoutes from "./routes/products";
import productImagesRoutes from "./routes/product_images";
import discountsRoutes from "./routes/discounts";
import paymentsRoutes from "./routes/payments";
import authRoutes from "./routes/auth";
import { log } from "./middleware/log";
import "./jobs/cleanupRevokedTokens.ts";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(log);

app.use("/api/users", usersRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/product/images", productImagesRoutes);
app.use("/api/discounts", discountsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API running!");
});

app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});