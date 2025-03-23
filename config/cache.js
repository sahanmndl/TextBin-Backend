import {createClient} from 'redis';
import dotenv from "dotenv";
import {logger} from "./logger.js";

dotenv.config();

export const redisClient = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

export const connectToCacheDB = async () => {
    try {
        await redisClient
            .on('error', (err) => logger.error("Error connecting to cache database", err))
            .on('ready', () => logger.info("Redis is ready"))
            .connect()
            .then(() => logger.info("Connected to Redis"));
    } catch (e) {
        logger.error("Error connecting to cache db " + e);
        throw e;
    }
}

export const getDataFromCache = async ({cacheKey}) => {
    try {
        logger.info("Getting data from cache " + cacheKey);
        const cachedData = await redisClient.get(cacheKey);
        return JSON.parse(cachedData);
    } catch (e) {
        logger.error("Error in getDataFromCache " + e);
        throw e;
    }
}

export const setDataInCache = async ({cacheKey, expiry, data}) => {
    try {
        logger.info("Setting data in cache " + cacheKey);
        return await redisClient.setEx(cacheKey, expiry, JSON.stringify(data));
    } catch (e) {
        logger.error("Error in setDataInCache " + e);
        throw e;
    }
}