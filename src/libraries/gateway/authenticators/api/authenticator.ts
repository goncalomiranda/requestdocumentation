import { Request, Response, NextFunction } from "express";
import TenantApikey from '../data-access/TenantApiKey';

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