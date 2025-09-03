import winston from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import dotenv from "dotenv";

// Get environment for logging
const environment = process.env.NODE_ENV || 'development';

// Define log format for file logs (plain text)
const logFormat = winston.format.printf(({ timestamp, level, message, service }) => {
  return `${timestamp} [${environment.toUpperCase()}] [${service}] [${level.toUpperCase()}]: ${message}`;
});

// Check if required environment variables are set
const logToken = process.env.LOG_TOKEN;
const logHost = process.env.LOG_HOST;

if (!logToken) {
  throw new Error('LOG_TOKEN environment variable is required');
}

if (!logHost) {
  throw new Error('LOG_HOST environment variable is required');
}

const logtail = new Logtail(logToken, {
  endpoint: `https://${logHost}`,
});

// Create Winston Logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: 'requestdocumentation-service',
    environment: environment,
  },
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Standard timestamp format
    winston.format.printf(({ timestamp, level, message, service }) => `${timestamp} [${environment.toUpperCase()}] [${service}] [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    // Console logs (with colors)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.printf(({ timestamp, level, message, service }) => `${timestamp} [${environment.toUpperCase()}] [${service}] [${level.toUpperCase()}]: ${message}`)
      ),
    }),

    // File logs (plain text, no colors)
    new winston.transports.File({
      filename: 'logs/app.log',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat // Plain text format for file logs
      ),
    }),
    new LogtailTransport(logtail),
  ],
});

export default logger;
