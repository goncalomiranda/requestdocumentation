import RequestedDocumentation from '../data-access/RequestDocumentation';
import logger from '../../../libraries/loggers/logger';
import fs from 'fs';
import { AppError } from '../../../libraries/appError';
import { getDocumentsByLanguage } from "./documentService";

import { createFile } from '../../../libraries/googledrive/driveapi';
import streakFiles from '../../../libraries/streak/files';

export async function uploadDocuments(token: string, files: Express.Multer.File[], consentData?: {
  consentGiven?: boolean;
  consentVersion?: string | null;
  givenAt?: Date | null;
  consentTimezone?: string | null;
}) {

  console.log("uploading....");
  if (!token) {
    logger.error("Request ID is missing");
    deleteFiles(files); // Ensure files are deleted
    throw new AppError("U1", "Bad Request", true);
  }

  logger.info("token: " + token);

  const requestedDocumentation = await RequestedDocumentation.findOne({
    where: {
      request_id: token,
    },
    //attributes: ["request_id", "lang"], // Explicitly select 'lang'
  });

  if (requestedDocumentation) {

    if (isRequestExpired(requestedDocumentation.dataValues.expiry_date)) {
      await RequestedDocumentation.update(
        { status: "EXPIRED" },
        { where: { request_id: token } }
      );
      deleteFiles(files); // Ensure files are deleted
      logger.error("Request has expired");
      throw new AppError("U2", "Bad Request", true);
    }

    // Save documents to Google Drive
    const docIds = [];
    for (const file of files) {
      const matches = file.fieldname.match(/documents\[([^\]]+)\]/);
      const documentType = matches ? matches[1] : null;

      if (!documentType) {
        logger.error(
          `Document type could not be extracted from fieldname: ${file.fieldname}`
        );
        continue; // Skip this file
      }

      const customMetadata = { documentType: documentType };
      const fileStream = fs.createReadStream(file.path);
      const driveDoc = await createFile(
        file.originalname,
        requestedDocumentation.dataValues.folder, // Use folder from requestedDocumentation
        file.mimetype,
        fileStream,
        customMetadata
      );

      docIds.push({
        driveBoxKey: requestedDocumentation.dataValues.customer_id,
        driveFileId: driveDoc.fileId,
      });

      //console.log("File uploaded to Google Drive: ", requestedDocumentation.dataValues.customer_id);

      logger.info("files to be added in streak: " + JSON.stringify(docIds));


      streakFiles.addFilesToBox(docIds);

      // Build update fields for status and GDPR consent
      const updateFields: any = { status: "DONE" };
      if (consentData) {
        if (consentData.consentGiven !== undefined) updateFields.consentGiven = consentData.consentGiven;
        if (consentData.consentVersion) updateFields.consentVersion = consentData.consentVersion;
        if (consentData.givenAt) updateFields.givenAt = consentData.givenAt;
        if (consentData.consentTimezone) updateFields.consentTimezone = consentData.consentTimezone;
      }

      await RequestedDocumentation.update(
        updateFields,
        { where: { request_id: token } }
      );

    }

  }

  logger.info("deleting....");
  deleteFiles(files); // Ensure files are deleted


}

export async function getDocumentsToUpload(token: string = "") {

  const requestedDocumentation = await RequestedDocumentation.findOne({
    where: {
      request_id: token,
    },
    //attributes: ["request_id", "lang"], // Explicitly select 'lang'
  });

  if (requestedDocumentation) {
    logger.info("Requested documentation found.");
    logger.debug("Requested documentation found: " + JSON.stringify(requestedDocumentation));
    const documentTypes = await getDocumentsByLanguage(requestedDocumentation.get("lang") as string);
    logger.info("Requested documentation documentTypes: " + JSON.stringify(documentTypes));

    //check if documentation request is expired
    if (isRequestExpired(requestedDocumentation.dataValues.expiry_date)) {
      logger.info("expiring documentation");
      RequestedDocumentation.update(
        { status: "EXPIRED" },
        {
          where: {
            request_id: token,
          },
        }
      ).then((result) => {
        console.log("fetching documentation");
      })
        .catch((err) => {
          logger.error("Error updating documentation status to EXPIRED");
          logger.error(err);
          throw new AppError("G1", "Error updating documentation status to EXPIRED", true);
        });

      throw new AppError("G1", "Error", true);
    }


    //check if documentation request is alreay done or expired
    if (
      requestedDocumentation.dataValues.status === "DONE" ||
      requestedDocumentation.dataValues.status === "EXPIRED"
    ) {
      logger.error("Status not available to request:");
      throw new AppError("G2", "Documentatio Request not available", true);
    }

    const parsedDocuments = JSON.parse(requestedDocumentation.dataValues.requested_documents.trim());

    const finalDocuments = parsedDocuments.map((doc: any) => {
      const description = documentTypes.documents.find(d => d.key === doc.key);
      return {
        key: doc.key,
        value: description ? description.value : "", // Default to empty string if not found
        quantity: doc.quantity
      };
    });


    // Transform the JSON string field into an object
    const { requested_documents, tenant_id, ...rest } = requestedDocumentation.dataValues;

    const transformedDocumentation = {
      ...rest, // Includes all other fields except requested_documents
      documents: finalDocuments // Parse and add as "documents"
    };

    //throw new AppError("G12", "Error", true);

    return transformedDocumentation;


  } else {
    console.log("Requested documentation not found.");
    throw new AppError("G3", "Requested documentation not found.", true);
  }

}

function isRequestExpired(expiry_date: string) {
  // Check if the documentation is valid
  const newExpiryDate = new Date(expiry_date); // Parse expiry_date into a Date object
  const now = new Date();
  return newExpiryDate < now;
}

const deleteFiles = (files: any) => {
  files.forEach((file: any) => {
    console.log(file.path);
    fs.unlink(file.path, (err) => {
      if (err) {
        logger.error(`Error deleting file ${file.path}:`, err);
      } else {
        logger.info(`Successfully deleted file ${file.path}`);
      }
    });
  });
};