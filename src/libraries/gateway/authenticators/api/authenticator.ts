import { Request, Response, NextFunction } from "express";
const TenantApikey = require('../data-access/TenantApiKey'); // Adjust path as needed

export async function validateApiKey(apiKey: string): Promise<boolean> {
  const foundKey = await TenantApikey.findOne({
    where: { apiKey },
  });
  return !!foundKey;
}


export function apiKeyMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.headers["x-api-key"] as string;

    //console.log("API key:", apiKey);

    if (!apiKey) {
      res.status(401).json({ error: "API key is required" });
      return;
    }

    validateApiKey(apiKey)
      .then((isValid) => {
        if (!isValid) {
          res.status(403).json({ error: "Invalid API key" });
          return;
        }
        next(); // Only call `next()` if everything is valid
      })
      .catch((error) => {
        console.error("Error in API key validation:", error);
        res.status(500).json({ error: "Internal server error" });
      });
  };
}