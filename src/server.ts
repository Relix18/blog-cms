import { app, envMode } from "./app.js";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import http from "http";
import { initSocketServer } from "./socketServer.js";
const socketServer = http.createServer(app);

dotenv.config({ path: "./.env" });

const port = process.env.PORT || 3000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Uncaught Exception`);
  process.exit(1);
});

initSocketServer(socketServer);

const server = socketServer.listen(port, () =>
  console.log("Server is working on Port:" + port + " in " + envMode + " Mode.")
);

process.on("unhandledRejection", (err: any) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Unhandled Promise Rejection`);
  server.close(() => {
    process.exit(1);
  });
});
