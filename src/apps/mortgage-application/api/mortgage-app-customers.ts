import express, { Request, Response } from "express";
import { getApplicationForm, submitApplicationForm } from "../domain/ApplicationFormService";

import apiRateLimiter from "../../../libraries/gateway/rate-limiter"; // Import rate limiter
import logger from '../../../libraries/loggers/logger';
import { log } from "console";

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


router.post("/submit", async (req: Request, res: Response) => {
  logger.info('submitting application form...');

  const token: string = req.body.request_id || req.query.request_id || "";
  if (!token) {
    logger.error('Missing request_id token in body or query');
    res.status(400).json({ error: 'Missing request_id' });
    return;
  }

  try {
    const applicationFormData = req.body?.application_form ?? req.body;
    logger.info('Application form data: ' + JSON.stringify(applicationFormData));
    const consentData = {
      consentGiven: req.body?.consentGiven,
      consentVersion: req.body?.consentVersion,
      givenAt: req.body?.givenAt ? new Date(req.body.givenAt) : undefined,
      consentTimezone: req.body?.consentTimezone,
      userAgent: req.headers['user-agent'] as string | undefined,
      browserLanguage: req.headers['accept-language'] as string | undefined,
    };
    logger.info('Consent data: ' + JSON.stringify(consentData));

    //const result = await submitApplicationForm(token, applicationFormData, consentData);
    res.status(200).json({ message: "Application form submitted successfully" });
    return;
  } catch (error: any) {
    logger.error('Error submitting application form: ' + error.message);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});



export default router;
