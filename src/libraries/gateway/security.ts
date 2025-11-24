import cors from 'cors';
import helmet from 'helmet';
import { Express, Request } from 'express';
import logger from '../loggers/logger';
import { sendWelcomeEmail } from '../email/nodemail';

/**
 * Send security alert email for CORS policy violations
 */
async function sendCorsSecurityAlert(origin: string, req: Request): Promise<void> {
  try {
    const alertEmail = process.env.SECURITY_ALERT_EMAIL || 'gm@goncalomiranda.dev';
    const appName = process.env.APP_NAME || 'Application';

    // Get real IP address (handle proxies and IPv6)
    const getClientIp = () => {
      const forwarded = req.get('x-forwarded-for');
      if (forwarded) {
        return forwarded.split(',')[0].trim();
      }

      const realIp = req.get('x-real-ip');
      if (realIp) {
        return realIp;
      }

      let ip = req.ip || req.socket.remoteAddress || 'Unknown';

      if (ip === '::1') {
        ip = '127.0.0.1 (localhost)';
      } else if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
      }

      return ip;
    };

    const clientIp = getClientIp();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ff6f00; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .app-name { background-color: #e65100; padding: 10px; text-align: center; font-size: 18px; font-weight: bold; }
          .content { background-color: #f5f5f5; padding: 20px; border-radius: 0 0 5px 5px; }
          .info-block { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #ff6f00; }
          .label { font-weight: bold; color: #ff6f00; }
          .value { margin-left: 10px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🚫 Security Alert: CORS Policy Violation</h2>
          </div>
          <div class="app-name">
            ${appName}
          </div>
          <div class="content">
            <p>An unauthorized origin attempted to access your application.</p>
            
            <div class="info-block">
              <div><span class="label">Timestamp:</span><span class="value">${new Date().toISOString()}</span></div>
              <div><span class="label">Blocked Origin:</span><span class="value">${origin}</span></div>
              <div><span class="label">Method:</span><span class="value">${req.method}</span></div>
              <div><span class="label">URL:</span><span class="value">${req.originalUrl}</span></div>
            </div>

            <div class="info-block">
              <div><span class="label">IP Address:</span><span class="value">${clientIp}</span></div>
              <div><span class="label">User-Agent:</span><span class="value">${req.get('user-agent') || 'Unknown'}</span></div>
              <div><span class="label">Referer:</span><span class="value">${req.get('referer') || 'None'}</span></div>
            </div>

            <div class="info-block">
              <div><span class="label">Headers:</span></div>
              <pre style="background: #f9f9f9; padding: 10px; border-radius: 3px; overflow-x: auto;">${JSON.stringify(req.headers, null, 2)}</pre>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendWelcomeEmail({
      to: alertEmail,
      from: process.env.SMTP_USER,
      subject: `🚫 [${appName}] Security Alert: CORS Violation from ${origin}`,
      emailHtml,
    });

    logger.info(`CORS security alert email sent to ${alertEmail} for origin: ${origin}`);
  } catch (error) {
    logger.error('Failed to send CORS security alert email:', error);
    // Don't throw - we don't want email failures to affect the response
  }
}

/**
 * Security middleware to configure CORS and security headers.
 */
export default function applySecurityMiddleware(app: Express) {
  // Get allowed origins from environment variable
  const allowedOriginsEnv = process.env.CORS_ALLOWED_ORIGINS || 'https://ts.goncalomiranda.dev';
  const allowedOrigins = allowedOriginsEnv.split(',').map(origin => origin.trim());

  logger.info(`CORS allowed origins: ${allowedOrigins.join(', ')}`);

  // Custom middleware to detect and alert on CORS violations BEFORE cors() blocks the request
  app.use((req, res, next) => {
    const origin = req.get('origin');

    if (origin && !allowedOrigins.includes(origin) && origin !== "null") {
      logger.error(`🚫 Blocked origin: ${origin}`);

      // Send alert asynchronously (before CORS blocks the request)
      sendCorsSecurityAlert(origin, req).catch(err => {
        logger.error('Error in sendCorsSecurityAlert:', err);
      });
    }

    next();
  });

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin === "null") {
          callback(null, true);
        } else {
          // Error is logged and email sent in middleware above
          callback(new Error('CORS policy violation'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
      credentials: true,
    })
  );

  // Explicitly handle preflight requests
  app.options('*', cors());

  app.use(helmet());

  logger.info('✅ Security middleware applied (CORS & Helmet)');
}