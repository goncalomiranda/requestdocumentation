import { Request, Response, NextFunction } from "express";
import TenantApikey from '../data-access/TenantApiKey';
import { sendWelcomeEmail } from '../../../email/nodemail';
import logger from '../../../loggers/logger';

export async function validateApiKey(apiKey: string): Promise<{ isValid: boolean; tenantId?: string }> {
  const foundKey = await TenantApikey.findOne({
    where: { apiKey },
    attributes: ["tenantId"], // Fetch only tenantId to optimize query
  });

  if (!foundKey) {
    return { isValid: false };
  }

  return { isValid: true, tenantId: foundKey.getDataValue("tenantId") };
}

async function sendSecurityAlert(req: Request, apiKey: string): Promise<void> {
  try {
    const alertEmail = process.env.SECURITY_ALERT_EMAIL || 'gm@goncalomiranda.dev';
    const appName = process.env.APP_NAME || 'Application';

    // Get real IP address (handle proxies and IPv6)
    const getClientIp = () => {
      // Check X-Forwarded-For header (when behind proxy/load balancer)
      const forwarded = req.get('x-forwarded-for');
      if (forwarded) {
        // X-Forwarded-For can be a comma-separated list, get the first one
        return forwarded.split(',')[0].trim();
      }

      // Check X-Real-IP header (alternative proxy header)
      const realIp = req.get('x-real-ip');
      if (realIp) {
        return realIp;
      }

      // Fall back to request IP
      let ip = req.ip || req.socket.remoteAddress || 'Unknown';

      // Convert IPv6 localhost to IPv4 for readability
      if (ip === '::1') {
        ip = '127.0.0.1 (localhost)';
      } else if (ip.startsWith('::ffff:')) {
        // Strip IPv6 prefix from IPv4-mapped addresses
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
          .header { background-color: #d32f2f; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .app-name { background-color: #b71c1c; padding: 10px; text-align: center; font-size: 18px; font-weight: bold; }
          .content { background-color: #f5f5f5; padding: 20px; border-radius: 0 0 5px 5px; }
          .info-block { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #d32f2f; }
          .label { font-weight: bold; color: #d32f2f; }
          .value { margin-left: 10px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🚨 Security Alert: Invalid API Key Attempt</h2>
          </div>
          <div class="app-name">
            ${appName}
          </div>
          <div class="content">
            <p>An invalid API key was used to attempt access to your application.</p>
            
            <div class="info-block">
              <div><span class="label">Timestamp:</span><span class="value">${new Date().toISOString()}</span></div>
              <div><span class="label">Method:</span><span class="value">${req.method}</span></div>
              <div><span class="label">URL:</span><span class="value">${req.originalUrl}</span></div>
              <div><span class="label">API Key:</span><span class="value">${apiKey}</span></div>
            </div>

            <div class="info-block">
              <div><span class="label">IP Address:</span><span class="value">${clientIp}</span></div>
              <div><span class="label">User-Agent:</span><span class="value">${req.get('user-agent') || 'Unknown'}</span></div>
              <div><span class="label">Origin:</span><span class="value">${req.get('origin') || 'None'}</span></div>
              <div><span class="label">Referer:</span><span class="value">${req.get('referer') || 'None'}</span></div>
            </div>

            <div class="info-block">
              <div><span class="label">Headers:</span></div>
              <pre style="background: #f9f9f9; padding: 10px; border-radius: 3px; overflow-x: auto;">${JSON.stringify(req.headers, null, 2)}</pre>
            </div>

            ${req.body && Object.keys(req.body).length > 0 ? `
            <div class="info-block">
              <div><span class="label">Body:</span></div>
              <pre style="background: #f9f9f9; padding: 10px; border-radius: 3px; overflow-x: auto;">${JSON.stringify(req.body, null, 2)}</pre>
            </div>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `;

    await sendWelcomeEmail({
      to: alertEmail,
      from: process.env.SMTP_USER,
      subject: `🚨 [${appName}] Security Alert: Invalid API Key Attempt`,
      emailHtml,
    });

    logger.info(`Security alert email sent to ${alertEmail} for invalid API key attempt`);
  } catch (error) {
    logger.error('Failed to send security alert email:', error);
    // Don't throw - we don't want email failures to affect the API response
  }
}

export function apiKeyMiddleware() {
  return (req: Request & { tenantId?: string }, res: Response, next: NextFunction): void => {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      res.status(401).json({ error: "API key is required" });
      return;
    }

    validateApiKey(apiKey)
      .then(({ isValid, tenantId }) => {
        if (!isValid) {
          // Send security alert email asynchronously (don't await)
          sendSecurityAlert(req, apiKey).catch(err => {
            logger.error('Error in sendSecurityAlert:', err);
          });

          res.status(403).json({ error: "Invalid API key" });
          return;
        }

        // Attach tenantId to request for later use
        req.tenantId = tenantId;

        next(); // Proceed to the next middleware/route
      })
      .catch((error) => {
        console.error("Error in API key validation:", error);
        res.status(500).json({ error: "Internal server error" });
      });
  };
}