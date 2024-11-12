import { app, envMode } from "./app.js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
const port = process.env.PORT || 3000;
process.on("uncaughtException", (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to Uncaught Exception`);
    process.exit(1);
});
const server = app.listen(port, () => console.log("Server is working on Port:" + port + " in " + envMode + " Mode."));
process.on("unhandledRejection", (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to Unhandled Promise Rejection`);
    server.close(() => {
        process.exit(1);
    });
});
