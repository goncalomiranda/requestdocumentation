import { google } from "googleapis";
import { Readable } from "stream";
import logger from '../loggers/logger';
import SharedPreference from '../data-access/models/SharedPreference';
import { encryptObject, decryptObject } from '../utils/encryption';

// OAuth2 client configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI // Not used by requestdocumentation, but required for OAuth2Client
);

/**
 * Get OAuth client with valid token
 * This function retrieves the OAuth token from the shared database,
 * decrypts it, and refreshes it if expired.
 */
async function getAuthenticatedClient() {
  try {
    // Retrieve the stored token from shared database
    const tokenPref = await SharedPreference.findOne({
      where: { key: "google_oauth_token" },
    });

    if (!tokenPref || !tokenPref.value) {
      throw new Error(
        "No Google OAuth token found in shared database. Please authorize the application first using gm-frontend."
      );
    }

    // Decrypt the stored tokens
    const tokens = decryptObject(tokenPref.value);
    oauth2Client.setCredentials(tokens);

    // Check if token is expired and refresh if needed
    if (tokens.expiry_date && tokens.expiry_date <= Date.now()) {
      logger.info("Token expired, refreshing...");
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update the stored token (encrypted) in shared database
      await SharedPreference.update(
        {
          value: encryptObject(credentials),
          updatedBy: "requestdocumentation_auto_refresh",
        },
        { where: { key: "google_oauth_token" } }
      );

      oauth2Client.setCredentials(credentials);
      logger.info("Token refreshed successfully");
    }

    return oauth2Client;
  } catch (error) {
    logger.error("Error getting authenticated client:", error);
    throw error;
  }
}

interface FileMetadata {
  name: string;
  parents?: string[];
  appProperties?: Record<string, any>;
}

interface CreateFileResponse {
  message: string;
  fileId: string;
}

export const createFile = async (
  fileName: string,
  folderName: string | null,
  mimeType: string,
  body: Readable | string,
  customMetadata?: Record<string, any>
): Promise<CreateFileResponse> => {
  if (!fileName) throw new Error("fileName is required");
  if (!mimeType) throw new Error("mimeType is required");
  if (!body) throw new Error("body is required");

  try {
    // Get authenticated client
    const auth = await getAuthenticatedClient();
    const drive = google.drive({ version: "v3", auth });

    const parentFolderId = folderName || process.env.GOOGLE_DEFAULT_FOLDER;

    if (!parentFolderId) {
      throw new Error("No folder ID provided and GOOGLE_DEFAULT_FOLDER is not set");
    }

    logger.debug(`Using parent folder ID: ${parentFolderId}`);

    const fileMetadata: FileMetadata = {
      name: fileName,
      parents: [parentFolderId],
      appProperties: customMetadata || {},
    };

    const media = {
      mimeType,
      body,
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id",
    });

    logger.debug("File Id: ", file.data.id);
    return {
      message: "File created successfully!",
      fileId: file.data.id || "",
    };
  } catch (error: any) {
    logger.error("Error creating file", error);
    logger.error("Full error details:", JSON.stringify(error, null, 2));

    // Provide specific error messages for common issues
    if (error?.code === 403) {
      if (error?.errors?.[0]?.reason === 'insufficientPermissions') {
        throw new Error(
          "Insufficient permissions to create files in the specified folder. " +
          "Please ensure the authorized Google account has Editor permissions on the folder."
        );
      } else {
        throw new Error(
          `Access denied (403): ${error?.message || 'Unknown permission error'}. ` +
          "Please check folder permissions."
        );
      }
    }

    throw new Error(`Failed to create file: ${error?.message || 'Unknown error'}`);
  }
};