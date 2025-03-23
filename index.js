import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import {logger} from "./config/logger.js";
import {rateLimiter} from "./config/rateLimiter.js";
import {connectToCacheDB} from "./config/cache.js";
import {connectToDatabase} from "./config/database.js";
import documentRoutes from "./routes/DocumentRoute.js";

dotenv.config()

const app = express();
app.set('trust proxy', 1)
app.use(cors());
app.use(helmet());
app.use(rateLimiter);
app.use(express.json({limit: "30mb", extended: true}));

app.use("/api/v1/documents", documentRoutes);

app.listen((process.env.PORT || 8008), async () => {
    logger.info("Server is running on port " + process.env.PORT);
    await connectToDatabase();
    await connectToCacheDB();
})