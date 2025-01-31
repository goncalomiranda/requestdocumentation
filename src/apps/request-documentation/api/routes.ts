import express, { Request, Response } from "express";
import { getDocumentsByLanguage } from "../domain/documentService";
import { apiKeyMiddleware } from "../../../libraries/authenticator";
import apiRateLimiter from "../../../libraries/gateway/rate-limiter"; // Import rate limiter


const router = express.Router();

// Apply the API key validation middleware to all routes in this router
router.use(apiKeyMiddleware());

// Apply rate limiter to all routes
router.use(apiRateLimiter);

// Route to fetch documents by language (optional)
router.get("/documents", async (req: Request, res: Response) => {
  try {
    const language = req.query.lang as string | undefined;
    const documents = await getDocumentsByLanguage(language);
    res.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
