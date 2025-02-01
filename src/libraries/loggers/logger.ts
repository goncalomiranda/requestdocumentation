import winston from 'winston';

// Define log format for file logs (plain text)
const logFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Create Winston Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Standard timestamp format
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    // Console logs (with colors)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
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
  ],
});

export default logger;
