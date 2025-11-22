import { Sequelize } from "sequelize";
import logger from "../loggers/logger";

/**
 * Shared database connection for OAuth tokens and preferences
 * This database is accessed by multiple applications (gm-frontend, requestdocumentation, etc.)
 */
const sharedSequelize = new Sequelize(
    process.env.SHARED_DB_NAME as string,
    process.env.SHARED_DB_USER as string,
    process.env.SHARED_DB_PASSWORD as string,
    {
        host: process.env.SHARED_DB_HOST,
        dialect: "mysql",
        logging: false, // Disable SQL query logging
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        dialectOptions: {
            connectTimeout: 60000,
        },
    }
);

export default sharedSequelize;
