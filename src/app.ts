import express from "express";
import cors from "cors";
import { errorMiddleware } from "./middlewares/error.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import user from "./routes/user.route.js";
import post from "./routes/post.route.js";
import feature from "./routes/feature.route.js";
import analytics from "./routes/analytics.route.js";
import site from "./routes/site.route.js";

dotenv.config({ path: "./.env" });

export const envMode = process.env.NODE_ENV?.trim() || "DEVELOPMENT";

export const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(cors({ origin: " http://localhost:3000 ", credentials: true }));

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// your routes here
app.use("/api/v1", user);
app.use("/api/v1", post);
app.use("/api/v1", feature);
app.use("/api/v1", analytics);
app.use("/api/v1", site);

app.get("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Page not found",
  });
});

app.use(errorMiddleware);
