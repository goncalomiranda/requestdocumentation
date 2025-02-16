import fs from "fs";
import path from "path";
import multer, { StorageEngine, DiskStorageOptions, FileFilterCallback } from "multer";
import { Request } from "express";

// Ensure the uploads directory exists
const uploadDirectory: string = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Define storage configuration
const storage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadDirectory); // Use the dynamically created directory
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Save with a unique name
  },
});

// Create the multer instance
const upload = multer({ storage });

export default upload;
