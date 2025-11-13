import express, { Request, Response } from "express";
import { requestDocumentationUpdateStatus } from "../domain/requestdocumentationupdate";
import { RequestDocumentationUpdateModel } from '../domain/models/RequestDocumentationUpdate'; // Adjust path accordingly

import { apiKeyMiddleware } from "../../../libraries/gateway/authenticators/api/authenticator";
import apiRateLimiter from "../../../libraries/gateway/rate-limiter"; // Import rate limiter
import logger from '../../../libraries/loggers/logger';


const router = express.Router();

// Apply the API key validation middleware to all routes in this router
router.use(apiKeyMiddleware());

// Apply rate limiter to all routes
router.use(apiRateLimiter);


router.patch("/", async (req: Request & { tenantId?: string }, res: Response) => {
  logger.info('Updating Request documentation status...');

  const requestBody: RequestDocumentationUpdateModel = req.body;
  logger.debug(requestBody.request_id);
  logger.debug(requestBody.status);

  try {
    // Create document here
    if (!req.tenantId) {
      throw new Error("Tenant ID is required");
    }
    const requested_documentation = await requestDocumentationUpdateStatus(req.tenantId, requestBody.request_id, requestBody.status);
    res.status(200).json({ requested_documentation });

  } catch (error: any) {
    logger.error('Error updating request documentation status: ' + error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
