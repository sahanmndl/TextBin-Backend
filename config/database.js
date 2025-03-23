import mongoose from 'mongoose';
import {logger} from "./logger.js";

export const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
            .then(() => logger.info("Connected to MongoDB"))
    } catch (e) {
        logger.error("Error connecting to MongoDB", e);
        process.exit(1);
    }
}