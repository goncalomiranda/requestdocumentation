import express, { Request, Response } from "express";
import { getDocumentsByLanguage } from "../domain/documentService";
import { requestDocumentation } from "../domain/requestdocumentation";
import { DocumentationRequest } from '../domain/models/RequestDocumentationModel'; // Adjust path accordingly

import { apiKeyMiddleware } from "../../../libraries/gateway/authenticators/api/authenticator";
import apiRateLimiter from "../../../libraries/gateway/rate-limiter"; // Import rate limiter
import logger from '../../../libraries/loggers/logger';


const router = express.Router();

// Apply the API key validation middleware to all routes in this router
router.use(apiKeyMiddleware());

// Apply rate limiter to all routes
router.use(apiRateLimiter);

// Define the route to fetch documents
router.get("/documents", async (req: Request & { tenantId?: string }, res: Response) => {
  logger.info('Fetching document types...');
  try {
    const language = req.query.lang as string | undefined;
    const documents = await getDocumentsByLanguage(language);
    res.json(documents);
  } catch (error:any) {
    logger.error('Error fetching documents: ' + error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: Request & { tenantId?: string }, res: Response) => {
  logger.info('Request documentatiom...');

  const requestBody: DocumentationRequest = req.body;

  // Now you can safely access `requestBody.customer`, `requestBody.documents`, etc.
  console.log(requestBody.customer.name);

  try {
    // Create document here
    if (!req.tenantId) {
      throw new Error("Tenant ID is required");
    }
    const requested_documentation = await requestDocumentation(requestBody, req.tenantId);
    res.status(201).json({ requested_documentation });
  } catch (error:any) {
    logger.error('Error creating document: ' + error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
