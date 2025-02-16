import express, { Request, Response } from "express";
import { getDocumentsByLanguage } from "../domain/documentService";
import { getDocumentsToUpload, uploadDocuments } from "../domain/documentUploadService";
import { DocumentationRequest } from '../domain/models/RequestDocumentationModel'; 
import apiRateLimiter from "../../../libraries/gateway/rate-limiter"; // Import rate limiter
import logger from '../../../libraries/loggers/logger';
import upload from '../../../libraries/multer';


const router = express.Router();


// Apply rate limiter to all routes
router.use(apiRateLimiter);

// Define the route to fetch documents
router.post("/upload", upload.any(), async (req: Request, res: Response) => {
  logger.info('Uploading docs...');

  const token: string = req.body.request_id || req.query.request_id || "";

  // Extract uploaded files
  const files: Express.Multer.File[] = req.files as Express.Multer.File[];

  // Call uploadDocuments with extracted values
  const response = await uploadDocuments(token, files);

  try {
    await uploadDocuments(token, files);
    res.status(200).json({ message: "Your documents have been uploaded successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }

});

// Define the route to fetch documents
router.get("/upload", async (req: Request, res: Response) => {
  logger.info('Fetching document upload page...');
  const token = req.query.token as string | undefined;

  if (token) {
    try {
      const documents = await getDocumentsToUpload(token);
      res.json(documents);
    } catch (error:any) {
      logger.error('Error fetching documents: ' + error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.status(500).json({ error: "Internal server error" });
  }
});


export default router;
