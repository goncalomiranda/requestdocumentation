import fs from "fs";
import path from "path";
import multer, { StorageEngine, DiskStorageOptions, FileFilterCallback } from "multer";
import { Request } from "express";

// Ensure the uploads directory exists
const uploadDirectory: string = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const sanitizeDocumentType = (documentType: string): string => {
  return documentType
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "document";
};

const getDocumentTypeFromFieldname = (fieldname: string): string => {
  const matches = fieldname.match(/documents\[([^\]]+)\]/);
  return sanitizeDocumentType(matches ? matches[1] : "document");
};

const buildFilename = (req: Request, file: Express.Multer.File): string => {
  const requestWithCounters = req as Request & { _documentTypeCounters?: Record<string, number> };
  const documentType = getDocumentTypeFromFieldname(file.fieldname);
  const extension = path.extname(file.originalname);

  if (!requestWithCounters._documentTypeCounters) {
    requestWithCounters._documentTypeCounters = {};
  }

  const currentCount = requestWithCounters._documentTypeCounters[documentType] || 0;
  requestWithCounters._documentTypeCounters[documentType] = currentCount + 1;

  const duplicateSuffix = currentCount === 0 ? "" : `_${currentCount}`;
  return `${documentType}${duplicateSuffix}${extension}`;
};

// Define storage configuration
const storage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadDirectory); // Use the dynamically created directory
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    cb(null, buildFilename(req, file));
  },
});

// Create the multer instance
const upload = multer({ storage });

export default upload;
