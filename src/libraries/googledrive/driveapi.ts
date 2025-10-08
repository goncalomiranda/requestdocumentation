import { google } from "googleapis";
import { Readable } from "stream";
import logger from '../loggers/logger';

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // Handle newline characters in private key
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
  },
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

interface FileMetadata {
  name: string;
  parents?: string[];
  properties?: Record<string, any>;
}

interface CreateFileResponse {
  message: string;
  fileId: string;
}

// Function to list available shared drives
export const listSharedDrives = async () => {
  try {
    const response = await drive.drives.list({
      fields: "drives(id, name)"
    });

    logger.debug("Available shared drives:", response.data.drives);
    return response.data.drives || [];
  } catch (error) {
    logger.error("Error listing shared drives:", error);
    throw new Error("Failed to list shared drives.");
  }
};

// Function to create a folder in a shared drive
export const createFolderInSharedDrive = async (
  folderName: string,
  sharedDriveId: string,
  parentFolderId?: string
) => {
  try {
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined,
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      supportsAllDrives: true,
      fields: "id, name"
    });

    logger.debug("Created folder:", folder.data);
    return folder.data;
  } catch (error) {
    logger.error("Error creating folder in shared drive:", error);
    throw new Error("Failed to create folder in shared drive.");
  }
};

// Function to find a shared folder that's accessible to the service account
export const findAccessibleFolder = async (folderName?: string): Promise<string> => {
  try {
    // First, try to find shared drives
    const sharedDrives = await listSharedDrives();

    if (sharedDrives.length > 0) {
      logger.debug("Using shared drive:", sharedDrives[0]);
      return sharedDrives[0].id || "";
    }

    // If no shared drives, look for folders shared with the service account
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and 'me' in readers",
      fields: "files(id, name, owners)",
      pageSize: 10
    });

    if (response.data.files && response.data.files.length > 0) {
      const folder = folderName
        ? response.data.files.find(f => f.name === folderName)
        : response.data.files[0];

      if (folder) {
        logger.debug("Using shared folder:", folder);
        return folder.id || "";
      }
    }

    throw new Error("No accessible shared drives or folders found. Please create a shared drive or share a folder with the service account.");
  } catch (error) {
    logger.error("Error finding accessible folder:", error);
    throw error;
  }
};

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
    let parentFolderId: string;

    if (folderName) {
      parentFolderId = folderName;

      // Debug: Check if we can access this folder
      logger.debug(`Attempting to use provided folder: ${parentFolderId}`);
      try {
        // Test folder accessibility
        const folderInfo = await drive.files.get({
          fileId: parentFolderId,
          fields: "id, name, permissions, capabilities",
          supportsAllDrives: true
        });
        logger.debug(`Folder accessible: ${folderInfo.data.name} (${folderInfo.data.id})`);
      } catch (folderError: any) {
        logger.error(`Cannot access folder ${parentFolderId}:`, folderError);
        // If folder is not accessible, fall back to finding an accessible one
        logger.info("Falling back to finding accessible folder...");
        parentFolderId = await findAccessibleFolder();
      }
    } else if (process.env.GOOGLE_DEFAULT_FOLDER) {
      parentFolderId = process.env.GOOGLE_DEFAULT_FOLDER;
    } else {
      // Try to find an accessible folder/shared drive
      parentFolderId = await findAccessibleFolder();
    }

    logger.debug(`Using parent folder ID: ${parentFolderId}`);

    const fileMetadata: FileMetadata = {
      name: fileName,
      parents: [parentFolderId],
      properties: customMetadata || {},
    };

    const media = {
      mimeType,
      body,
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id",
      supportsAllDrives: true, // Important for shared drives
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
      if (error?.errors?.[0]?.reason === 'storageQuotaExceeded') {
        throw new Error(
          "Service account storage quota exceeded. " +
          "Please use a shared drive or share a folder with the service account. " +
          "See: https://developers.google.com/workspace/drive/api/guides/about-shareddrives"
        );
      } else if (error?.errors?.[0]?.reason === 'insufficientPermissions') {
        throw new Error(
          "Insufficient permissions to create files in the specified folder. " +
          "Please ensure the service account has Editor permissions on the folder or use a shared drive."
        );
      } else {
        throw new Error(
          `Access denied (403): ${error?.message || 'Unknown permission error'}. ` +
          "Please check folder permissions or use a shared drive."
        );
      }
    }

    throw new Error(`Failed to create file: ${error?.message || 'Unknown error'}`);
  }
};

export const fetchFilesByIds = async (
  driveIds: string[]
): Promise<{ id: string; name: string; properties?: Record<string, any> }[]> => {
  if (!Array.isArray(driveIds) || driveIds.length === 0) {
    throw new Error("A non-empty array of Drive IDs is required.");
  }

  try {
    const fileDetails = [];

    for (const driveId of driveIds) {
      const file = await drive.files.get({
        fileId: driveId,
        fields: "id, name, properties",
      });

      fileDetails.push({
        id: file.data.id || "",
        name: file.data.name || "",
        properties: file.data.properties || {},
      });
    }

    return fileDetails;
  } catch (error) {
    logger.error("Error fetching files", error);
    throw new Error("Failed to fetch files.");
  }
};
