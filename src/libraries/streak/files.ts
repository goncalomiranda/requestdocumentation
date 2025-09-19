import axios from "axios";
import dotenv from "dotenv";
import logger from '../loggers/logger';

dotenv.config(); // Load environment variables from .env file

const authorizationToken = process.env.CRM_AUTHORIZATION_TOKEN;

interface FileData {
  driveBoxKey: string;
  driveFileId: string;
}

export default class File {
  fileType?: string;
  fileOwner?: string;
  creationTimestamp: Date;
  size?: number;
  mimeType?: string;
  fileName?: string;
  driveUrl?: string;
  driveFileId: string;
  boxKey: string;
  driveIconUrl?: string;

  constructor(data: {
    fileType?: string;
    fileOwner?: string;
    creationTimestamp: string | number | Date;
    size?: number;
    mimeType?: string;
    fileName?: string;
    driveUrl?: string;
    driveFileId: string;
    boxKey: string;
    driveIconUrl?: string;
  }) {
    this.fileType = data.fileType;
    this.fileOwner = data.fileOwner;
    this.creationTimestamp = new Date(data.creationTimestamp);
    this.size = data.size;
    this.mimeType = data.mimeType;
    this.fileName = data.fileName;
    this.driveUrl = data.driveUrl;
    this.driveFileId = data.driveFileId;
    this.boxKey = data.boxKey;
    this.driveIconUrl = data.driveIconUrl;
  }

  /**
   * Add files to a box in Streak CRM.
   * @param {FileData[]} files - Array of objects containing driveBoxKey and driveFileId.
   * @returns {Promise<Object>} - Response data from the Streak API.
   */
  static async addFilesToBox(files: FileData[]): Promise<any> {
    logger.debug("Adding files to box");
    const apiUrl = "https://www.streak.com/api/v2/files/";

    if (!Array.isArray(files) || files.length === 0) {
      throw new Error("Files must be a non-empty array.");
    }

    try {
      const response = await axios.post(apiUrl, files, {
        headers: {
          "Content-Type": "application/json",
          Authorization: authorizationToken!,
        },
      });
      logger.info("Successfully added files to box: " + JSON.stringify(files, null, 2));
      return response.data;
    } catch (error: any) {
      logger.error("Error adding files to box:", error.response?.data || error);
      throw new Error("Failed to add files to box.");
    }
  }


}

