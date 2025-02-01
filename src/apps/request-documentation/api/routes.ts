import express, { Request, Response } from "express";
import { getDocumentsByLanguage } from "../domain/documentService";
import { apiKeyMiddleware } from "../../../libraries/gateway/authenticators/api/authenticator";
import apiRateLimiter from "../../../libraries/gateway/rate-limiter"; // Import rate limiter
import logger from '../../../libraries/loggers/logger';


const router = express.Router();

// Apply the API key validation middleware to all routes in this router
router.use(apiKeyMiddleware());

// Apply rate limiter to all routes
router.use(apiRateLimiter);


/**
 * @swagger
 * /document-requests/documents:
 *   get:
 *     summary: Retrieve a list of documents by language
 *     description: Fetch all documents that have translations in the specified language.
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *         required: false
 *         description: Language code (e.g., "en", "pt").
 *     responses:
 *       200:
 *         description: A list of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 language:
 *                   type: string
 *                 documents:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       key:
 *                         type: string
 *                       value:
 *                         type: string
 */
// Route to fetch documents by language (optional)
router.get("/documents", async (req: Request, res: Response) => {
  logger.info('Fetching documents...');
  try {
    const language = req.query.lang as string | undefined;
    const documents = await getDocumentsByLanguage(language);
    res.json(documents);
  } catch (error:any) {
    logger.error('Error fetching documents: ' + error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
