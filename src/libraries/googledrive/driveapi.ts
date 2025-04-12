import { google } from "googleapis";
import { Readable } from "stream";

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
    const fileMetadata: FileMetadata = {
      name: fileName,
      parents: folderName ? [folderName] : [process.env.GOOGLE_DEFAULT_FOLDER || ""],
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
    });

    console.log("File Id: ", file.data.id);
    return {
      message: "File created successfully!",
      fileId: file.data.id || "",
    };
  } catch (error) {
    console.error("Error creating file", error);
    throw new Error("Failed to create file.");
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
    console.error("Error fetching files", error);
    throw new Error("Failed to fetch files.");
  }
};
