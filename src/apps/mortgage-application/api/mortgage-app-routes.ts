import express, { Request, Response } from "express";
import { ApplicationForm } from '../domain/models/MortgageAppModel';
import { requestApplicationForm } from "../domain/MortgageApplicationForm";
import { getApplicationForm } from "../domain/ApplicationFormService";
import { apiKeyMiddleware } from "../../../libraries/gateway/authenticators/api/authenticator";
import apiRateLimiter from "../../../libraries/gateway/rate-limiter"; // Import rate limiter
import logger from '../../../libraries/loggers/logger';

const router = express.Router();

// Apply the API key validation middleware to all routes in this router
router.use(apiKeyMiddleware());

// Apply rate limiter to all routes
router.use(apiRateLimiter);

router.post("/", async (req: Request & { tenantId?: string }, res: Response) => {
  logger.info('Request mortgage application...');

  const requestBody: ApplicationForm = req.body;

  // Now you can safely access `requestBody.customer`, `requestBody.documents`, etc.
  logger.debug(requestBody.customer.name);

  try {
    // Create document here
    if (!req.tenantId) {
      throw new Error("Tenant ID is required");
    }
    const application_form = await requestApplicationForm(requestBody, req.tenantId);

    res.status(201).json({ application_form });
  } catch (error: any) {
    logger.error('Error creating document: ' + error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Define the route to fetch documents
router.get("/", async (req: Request, res: Response) => {
  logger.info('Fetching application form page...');
  const token = req.query.token as string | undefined;

  if (token) {
    try {
      const documents = await getApplicationForm(token);
      res.json(documents);
    } catch (error: any) {
      logger.error('Error fetching documents: ' + error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.status(500).json({ error: "Internal server error" });
  }
});




export default router;
