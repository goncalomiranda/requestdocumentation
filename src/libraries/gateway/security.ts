import cors from 'cors';
import helmet from 'helmet';
import { Express } from 'express';
import logger from '../loggers/logger';

/**
 * Security middleware to configure CORS and security headers.
 */
export default function applySecurityMiddleware(app: Express) {
    app.use(
      cors({
        origin: (origin, callback) => {
          const allowedOrigins = ['https://ts.goncalomiranda.dev', 'http://localhost:3000','http://localhost:5173'];
  
          
          if (!origin || allowedOrigins.includes(origin) || origin === "null") {
            callback(null, true);
          } else {
            logger.error(`🚫 Blocked origin: ${origin}`);
            callback(new Error('CORS policy violation'));
          }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization','x-api-key'], // Fix: Added 'Authorization'
        credentials: true, // Ensure cookies & auth headers work
      })
    );

    // Explicitly handle preflight requests
    app.options('*', cors());
  
    app.use(helmet());
  
    logger.info('✅ Security middleware applied (CORS & Helmet)');
  }