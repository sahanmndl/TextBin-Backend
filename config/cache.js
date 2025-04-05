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
    }
}

export const setDataInCache = async ({cacheKey, expiry, data}) => {
    try {
        logger.info("Setting data in cache " + cacheKey);
        return await redisClient.setEx(cacheKey, expiry, JSON.stringify(data));
    } catch (e) {
        logger.error("Error in setDataInCache " + e);
    }
}

export const deleteDataFromCache = async ({cacheKey}) => {
    try {
        logger.info(`Deleting cache key: ${cacheKey}`);

        const result = await redisClient.del(cacheKey);

        if (result === 1) {
            logger.info(`Successfully deleted cache key: ${cacheKey}`);
            return true;
        } else {
            logger.warn(`Cache key not found: ${cacheKey}`);
            return false;
        }
    } catch (e) {
        logger.error("Error in deleteDataFromCache " + e);
    }
}

export const increaseCacheTTL = async ({cacheKey, increaseBy}) => {
    try {
        logger.info(`Increasing TTL of cache key: ${cacheKey} by ${increaseBy} seconds`);

        const currentTTL = await redisClient.ttl(cacheKey);

        if (currentTTL === -2) {
            logger.warn(`Key ${cacheKey} does not exist`);
            return null;
        }

        if (currentTTL === -1) {
            logger.warn(`Key ${cacheKey} exists but has no expiration set`);
            return null;
        }

        const newTTL = currentTTL + increaseBy;
        await redisClient.expire(cacheKey, newTTL);

        logger.info(`TTL of key ${cacheKey} is now ${newTTL} seconds`);
    } catch (e) {
        logger.error("Error in increaseCacheTTL " + e);
    }
}
