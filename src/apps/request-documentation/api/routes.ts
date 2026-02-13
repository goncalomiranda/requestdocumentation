import express, { Request, Response, RequestHandler } from "express";
import { getDocumentsByLanguage, createDocumentType, deleteDocumentType } from "../domain/documentService";
import { getRequestedDocumentation } from "../domain/DocumentationRequest";
import { requestDocumentation } from "../domain/requestdocumentation";
import { getNewsfeed } from "../domain/newsfeedService";
import { DocumentationRequest } from '../domain/models/RequestDocumentationModel'; // Adjust path accordingly

import { apiKeyMiddleware } from "../../../libraries/gateway/authenticators/api/authenticator";
import apiRateLimiter from "../../../libraries/gateway/rate-limiter"; // Import rate limiter
import logger from '../../../libraries/loggers/logger';
import SchedulerManager from '../../schedulers/schedulerManager';


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
  } catch (error: any) {
    logger.error('Error fetching documents: ' + error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Define the route to create a new document type
router.post("/documents", async (req: Request & { tenantId?: string }, res: Response) => {
  logger.info('Creating new document type...');
  try {
    const { doc_key, translations } = req.body;

    // Validate required fields
    if (!doc_key || !translations || !translations.en || !translations.pt) {
      res.status(400).json({
        error: "Bad request",
        message: "doc_key and translations (en, pt) are required"
      });
      return;
    }

    const newDocument = await createDocumentType(doc_key, translations);
    res.status(201).json(newDocument);
  } catch (error: any) {
    logger.error('Error creating document type: ' + error.message);

    if (error.message.includes('already exists')) {
      res.status(409).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: "Internal server error" });
  }
});

// Define the route to delete a document type
router.delete("/documents/:doc_key", async (req: Request & { tenantId?: string }, res: Response) => {
  logger.info('Deleting document type...');
  try {
    const { doc_key } = req.params;

    if (!doc_key) {
      res.status(400).json({
        error: "Bad request",
        message: "doc_key is required"
      });
      return;
    }

    const result = await deleteDocumentType(doc_key);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error deleting document type: ' + error.message);

    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: Request & { tenantId?: string }, res: Response) => {
  logger.info('Request documentatiom...');

  const requestBody: DocumentationRequest = req.body;

  // Now you can safely access `requestBody.customer`, `requestBody.documents`, etc.
  logger.debug(requestBody.customer.name);

  try {
    // Create document here
    if (!req.tenantId) {
      throw new Error("Tenant ID is required");
    }
    const requested_documentation = await requestDocumentation(requestBody, req.tenantId);
    res.status(201).json({ requested_documentation });
  } catch (error: any) {
    logger.error('Error creating document: ' + error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Define the route to fetch documents
router.get("/", async (req: Request & { tenantId?: string }, res: Response) => {
  logger.info('Fetching requested documentation...');

  const customerId = req.headers.customer as string;
  const tenantId = req.tenantId as string;

  // Log the full request
  // logger.info(`Full Request:
  //   Method: ${req.method}
  //   URL: ${req.originalUrl}
  //   Headers: ${JSON.stringify(req.headers, null, 2)}
  //   Query: ${JSON.stringify(req.query, null, 2)}
  //   Body: ${JSON.stringify(req.body, null, 2)}
  // `);


  try {

    if (!customerId) {
      throw new Error("Customer id is required");
    }

    const documents = await getRequestedDocumentation(tenantId, customerId);
    res.status(200).json(documents);

  } catch (error: any) {
    logger.error('Error fetching documents: ' + error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Define the route to fetch newsfeed data
router.get("/newsfeed", async (req: Request & { tenantId?: string }, res: Response) => {
  logger.info('Fetching newsfeed data...');

  const customerId = req.headers.customer as string;
  const tenantId = req.tenantId as string;

  try {
    if (!tenantId) {
      throw new Error("Tenant ID is required");
    }

    // Fetch newsfeed data, optionally filtered by customer
    const newsfeedData = await getNewsfeed(tenantId, customerId);
    res.status(200).json(newsfeedData);

  } catch (error: any) {
    logger.error('Error fetching newsfeed data: ' + error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Manual trigger endpoint for scheduler testing
router.post("/trigger-expire-scheduler", async (req: Request & { tenantId?: string }, res: Response) => {
  logger.info('Manually triggering expire documentation scheduler...');

  try {
    const schedulerManager = SchedulerManager.getInstance();
    const scheduler = schedulerManager.getScheduler('expireDocumentation');

    // Get current configuration
    const config = scheduler?.getConfig ? scheduler.getConfig() : null;

    await schedulerManager.triggerScheduler('expireDocumentation');

    res.status(200).json({
      message: "Documentation expiration scheduler triggered successfully",
      configuration: config
    });
  } catch (error: any) {
    logger.error('Error triggering scheduler: ' + error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
