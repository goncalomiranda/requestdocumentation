import { createClient } from "redis";
import logger from "../loggers/logger";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
const redisPassword = process.env.REDIS_PASSWORD;
const redisUser = process.env.REDIS_USER;
const redisScheme = process.env.URL_SCHEME;

const redisUrl = `${redisScheme}://${redisUser}:${redisPassword}@${redisHost}:${redisPort}`;

logger.debug(`Attempting to connect to Redis at ${redisScheme}://${redisHost}:${redisPort}`);
logger.info("Attempting to connect to Redis");

const client = createClient({
    url: redisUrl,
    socket: {
        reconnectStrategy: function (retries: number): number | Error {
            const maxRetries = parseInt(process.env.REDIS_RETRIES || "10", 10);
            if (retries > maxRetries) {
                logger.error(
                    "Too many attempts to reconnect. Redis connection was terminated"
                );
                return new Error("Too many retries.");
            } else {
                logger.warn(`Redis reconnection attempt ${retries}/${maxRetries}`);
                return retries * 500;
            }
        },
    },
});

client.on("connect", () => {
    logger.info("Redis client connected successfully");
});

client.on("ready", () => {
    logger.info("Redis client is ready to accept commands");
});

client.on("error", (err: Error) => {
    logger.error("Redis client error:", err);
});

client.on("reconnecting", () => {
    logger.info("Redis client is reconnecting...");
});

client.on("end", () => {
    logger.warn("Redis client connection ended");
});

client.connect()
    .then(() => {
        logger.info("Redis connection established successfully");
    })
    .catch((err: Error) => {
        logger.error("Failed to connect to Redis:", err);
    });

export default client;