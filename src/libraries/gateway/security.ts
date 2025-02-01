import cors from 'cors';
import helmet from 'helmet';
import { Express } from 'express';

/**
 * Security middleware to configure CORS and security headers.
 */
export default function applySecurityMiddleware(app: Express) {
    app.use(
      cors({
        origin: (origin, callback) => {
          const allowedOrigins = ['https://ts.goncalomiranda.dev', 'http://localhost:3000'];
  
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            console.log(`🚫 Blocked origin: ${origin}`);
            callback(new Error('CORS policy violation'));
          }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'], // Fix: Added 'Authorization'
        credentials: true, // Ensure cookies & auth headers work
      })
    );
  
    app.use(helmet());
  
    console.log('✅ Security middleware applied (CORS & Helmet)');
  }