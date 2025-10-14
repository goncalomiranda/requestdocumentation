import express, { Request, Response } from "express";
import { getApplicationForm } from "../domain/ApplicationFormService";

import apiRateLimiter from "../../../libraries/gateway/rate-limiter"; // Import rate limiter
import logger from '../../../libraries/loggers/logger';

const router = express.Router();


router.use(apiRateLimiter);

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
