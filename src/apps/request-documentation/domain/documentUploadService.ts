import RequestedDocumentation from '../data-access/RequestDocumentation';
import logger from '../../../libraries/loggers/logger';
import fs from 'fs';
import { AppError } from '../../../libraries/appError';
import { getDocumentsByLanguage } from "./documentService";

import { createFile } from '../../../libraries/googledrive/driveapi';
import streakFiles from '../../../libraries/streak/files';
import redisClient from '../../../libraries/redis/redis';

type UploadedDocumentEntry = {
  documentKey: string;
  slotIndex: number;
  driveFileId: string;
  originalName: string;
  mimeType: string;
  uploadedAt: string;
};

type UploadedDocumentsMap = Record<string, UploadedDocumentEntry>;

/**
 * Publish RGPD consent event to Redis pub/sub
 * This function handles errors gracefully and doesn't interrupt the main flow
 */
async function publishRgpdConsentEvent(data: {
  customerId: string;
  requestId: string;
  allConsentsGiven: boolean;
}) {
  try {
    const channel = 'rgpd-consent-events';
    const message = JSON.stringify({
      event: 'rgpd_consent_given',
      timestamp: new Date().toISOString(),
      customerId: data.customerId,
      requestId: data.requestId,
      allConsentsGiven: data.allConsentsGiven,
    });

    await redisClient.publish(channel, message);
    logger.info(`✅ RGPD consent event published to ${channel} for customer ${data.customerId}`);
  } catch (error) {
    // Log error but don't throw - this should not interrupt the main flow
    logger.error('❌ Failed to publish RGPD consent event to Redis:', error);
    logger.error('Event details:', {
      customerId: data.customerId,
      requestId: data.requestId,
    });
  }
}

export async function uploadDocuments(token: string, files: Express.Multer.File[], consentData?: {
  consentGiven?: boolean;
  consentVersion?: string | null;
  givenAt?: Date | null;
  consentTimezone?: string | null;
  userAgent?: string | null;
  browserLanguage?: string | null;
  consentA?: boolean;
  consentB?: boolean;
  consentC?: boolean;
  consentD?: boolean;
}) {
  logger.info("uploading....");
  try {
    if (!token) {
      logger.error("Request ID is missing");
      throw new AppError("U1", "Bad Request", true);
    }

    logger.debug("token: " + token);

    const requestedDocumentation = await RequestedDocumentation.findOne({
      where: {
        request_id: token,
      },
    });

    if (!requestedDocumentation) {
      logger.warn("Requested documentation not found for token");
      throw new AppError("G3", "Requested documentation not found.", true);
    }

    if (isRequestExpired(requestedDocumentation.dataValues.expiry_date)) {
      await RequestedDocumentation.update(
        { status: "EXPIRED" },
        { where: { request_id: token } }
      );
      logger.error("Request has expired");
      throw new AppError("U2", "Bad Request", true);
    }

    if (
      requestedDocumentation.dataValues.status === "DONE" ||
      requestedDocumentation.dataValues.status === "EXPIRED"
    ) {
      logger.error("Status not available to upload");
      throw new AppError("G2", "Documentatio Request not available", true);
    }

    const parsedRequestedDocuments = parseRequestedDocuments(
      requestedDocumentation.dataValues.requested_documents
    );

    const uploadedDocuments = normalizeUploadedDocuments(
      requestedDocumentation.dataValues.uploaded_documents
    );

    const hasRgpdDocument = parsedRequestedDocuments.some((doc: any) => doc.key === "rgpd");
    const hasAnyPreviouslyUploadedDocument = Object.keys(uploadedDocuments).length > 0;
    const hasAnyIncomingFiles = (files || []).length > 0;

    const finalConsentValues = {
      consentGiven: consentData?.consentGiven ?? requestedDocumentation.dataValues.consentGiven,
      consentA: consentData?.consentA ?? requestedDocumentation.dataValues.consentA,
      consentB: consentData?.consentB ?? requestedDocumentation.dataValues.consentB,
      consentC: consentData?.consentC ?? requestedDocumentation.dataValues.consentC,
      consentD: consentData?.consentD ?? requestedDocumentation.dataValues.consentD,
    };

    const hasAllConsentsNow = (
      finalConsentValues.consentGiven === true &&
      finalConsentValues.consentA === true &&
      finalConsentValues.consentB === true &&
      finalConsentValues.consentC === true &&
      finalConsentValues.consentD === true
    );

    // First upload with actual files requires RGPD consent to guarantee no stored file lacks consent.
    if (hasRgpdDocument && !hasAnyPreviouslyUploadedDocument && hasAnyIncomingFiles && !hasAllConsentsNow) {
      logger.error("First document upload requires full RGPD consent");
      throw new AppError("U4", "RGPD consent is mandatory before the first document upload", true);
    }

    // Save any provided files to Google Drive and merge into persisted progress map.
    const docIds = [];
    for (const file of files || []) {
      const matches = file.fieldname.match(/documents\[([^\]]+)\](?:\[(\d+)\])?/);
      const documentType = matches ? matches[1] : null;
      const slotIndex = matches && matches[2] ? Number(matches[2]) : 0;

      if (!documentType) {
        logger.error(
          `Document type could not be extracted from fieldname: ${file.fieldname}`
        );
        continue;
      }

      // Skip already uploaded slots to avoid duplicate uploads for the same document slot.
      if (uploadedDocuments[buildUploadSlotKey(documentType, slotIndex)]) {
        logger.info(`Skipping already uploaded slot ${documentType}[${slotIndex}]`);
        continue;
      }

      const customMetadata = { documentType };
      const fileStream = fs.createReadStream(file.path);
      const driveDoc = await createFile(
        file.filename || file.originalname,
        requestedDocumentation.dataValues.folder,
        file.mimetype,
        fileStream,
        customMetadata
      );

      docIds.push({
        driveBoxKey: requestedDocumentation.dataValues.customer_id,
        driveFileId: driveDoc.fileId,
      });

      uploadedDocuments[buildUploadSlotKey(documentType, slotIndex)] = {
        documentKey: documentType,
        slotIndex,
        driveFileId: driveDoc.fileId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        uploadedAt: new Date().toISOString(),
      };
    }

    if (docIds.length > 0) {
      streakFiles.addFilesToBox(docIds);
    }

    const updateFields: any = {
      uploaded_documents: uploadedDocuments,
    };

    if (consentData) {
      if (consentData.consentGiven !== undefined) updateFields.consentGiven = consentData.consentGiven;
      if (consentData.consentVersion) updateFields.consentVersion = consentData.consentVersion;
      if (consentData.givenAt) updateFields.givenAt = consentData.givenAt;
      if (consentData.consentTimezone) updateFields.consentTimezone = consentData.consentTimezone;
      if (consentData.userAgent) updateFields.userAgent = consentData.userAgent;
      if (consentData.browserLanguage) updateFields.browserLanguage = consentData.browserLanguage;
      if (consentData.consentA !== undefined) updateFields.consentA = consentData.consentA;
      if (consentData.consentB !== undefined) updateFields.consentB = consentData.consentB;
      if (consentData.consentC !== undefined) updateFields.consentC = consentData.consentC;
      if (consentData.consentD !== undefined) updateFields.consentD = consentData.consentD;
    }

    const filesComplete = areAllRequiredFilesUploaded(parsedRequestedDocuments, uploadedDocuments);

    const consentsComplete = !hasRgpdDocument || (
      finalConsentValues.consentGiven === true &&
      finalConsentValues.consentA === true &&
      finalConsentValues.consentB === true &&
      finalConsentValues.consentC === true &&
      finalConsentValues.consentD === true
    );

    const requiredDocuments = parsedRequestedDocuments.filter((doc: any) => doc.key !== "rgpd");
    const totalUploadedFiles = requiredDocuments.reduce(
      (sum: number, doc: any) => sum + countUploadedSlotsForDocument(uploadedDocuments, doc.key),
      0
    );

    const isRequestCompleted = filesComplete && consentsComplete;
    updateFields.status = isRequestCompleted
      ? "DONE"
      : totalUploadedFiles > 0
        ? "IN_PROGRESS"
        : "ACTIVE";
    updateFields.completed_at = isRequestCompleted ? new Date() : null;

    await RequestedDocumentation.update(
      updateFields,
      { where: { request_id: token } }
    );

    const hadAllConsentsBefore = (
      requestedDocumentation.dataValues.consentGiven === true &&
      requestedDocumentation.dataValues.consentA === true &&
      requestedDocumentation.dataValues.consentB === true &&
      requestedDocumentation.dataValues.consentC === true &&
      requestedDocumentation.dataValues.consentD === true
    );

    if (!hadAllConsentsBefore && hasAllConsentsNow) {
      logger.info('🛡️ All RGPD consents given - publishing event to Redis');
      await publishRgpdConsentEvent({
        customerId: requestedDocumentation.dataValues.customer_id,
        requestId: token,
        allConsentsGiven: true,
      });
    }
  } finally {
    logger.info("deleting....");
    deleteFiles(files);
  }
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
        logger.debug("fetching documentation");
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

    const parsedDocuments = parseRequestedDocuments(requestedDocumentation.dataValues.requested_documents);
    const uploadedDocuments = normalizeUploadedDocuments(requestedDocumentation.dataValues.uploaded_documents);

    const finalDocuments = parsedDocuments.map((doc: any) => {
      const description = documentTypes.documents.find(d => d.key === doc.key);
      const requestedQuantity = Number(doc.quantity || 0);
      const uploadedQuantity = countUploadedSlotsForDocument(uploadedDocuments, doc.key);
      const uploadedSlots = getUploadedSlotsForDocument(uploadedDocuments, doc.key);
      return {
        key: doc.key,
        value: description ? description.value : "", // Default to empty string if not found
        quantity: requestedQuantity,
        uploadedQuantity,
        uploadedSlots,
        missingQuantity: Math.max(requestedQuantity - uploadedQuantity, 0),
        completed: uploadedQuantity >= requestedQuantity,
        notes: doc.notes ?? null,
      };
    });

    const requiredDocuments = parsedDocuments.filter((doc: any) => doc.key !== "rgpd");
    const totalRequiredFiles = requiredDocuments.reduce(
      (sum: number, doc: any) => sum + Number(doc.quantity || 0),
      0
    );
    const totalUploadedFiles = requiredDocuments.reduce(
      (sum: number, doc: any) => sum + countUploadedSlotsForDocument(uploadedDocuments, doc.key),
      0
    );


    // Transform the JSON string field into an object
    const { requested_documents, tenant_id, ...rest } = requestedDocumentation.dataValues;

    const transformedDocumentation = {
      ...rest, // Includes all other fields except requested_documents
      documents: finalDocuments, // Parse and add as "documents"
      progress: {
        totalRequiredFiles,
        totalUploadedFiles,
        allFilesUploaded: totalUploadedFiles >= totalRequiredFiles,
      },
    };

    //throw new AppError("G12", "Error", true);

    return transformedDocumentation;


  } else {
    logger.warn("Requested documentation not found.");
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
  (files || []).forEach((file: any) => {
    logger.debug(file.path);
    fs.unlink(file.path, (err) => {
      if (err) {
        logger.error(`Error deleting file ${file.path}:`, err);
      } else {
        logger.info(`Successfully deleted file ${file.path}`);
      }
    });
  });
};

function buildUploadSlotKey(documentKey: string, slotIndex: number): string {
  return `${documentKey}#${slotIndex}`;
}

function normalizeUploadedDocuments(raw: any): UploadedDocumentsMap {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw as UploadedDocumentsMap;
}

function parseRequestedDocuments(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw.trim());
    } catch {
      return [];
    }
  }
  return [];
}

function countUploadedSlotsForDocument(uploadedDocuments: UploadedDocumentsMap, documentKey: string): number {
  const slots = new Set<number>();
  for (const entry of Object.values(uploadedDocuments)) {
    if (entry.documentKey === documentKey) {
      slots.add(Number(entry.slotIndex));
    }
  }
  return slots.size;
}

function getUploadedSlotsForDocument(uploadedDocuments: UploadedDocumentsMap, documentKey: string): number[] {
  const slots = new Set<number>();
  for (const entry of Object.values(uploadedDocuments)) {
    if (entry.documentKey === documentKey) {
      slots.add(Number(entry.slotIndex));
    }
  }
  return Array.from(slots).sort((a, b) => a - b);
}

function areAllRequiredFilesUploaded(requestedDocuments: any[], uploadedDocuments: UploadedDocumentsMap): boolean {
  const requiredDocuments = requestedDocuments.filter((doc: any) => doc.key !== "rgpd");
  for (const doc of requiredDocuments) {
    const requiredQuantity = Number(doc.quantity || 0);
    const uploadedQuantity = countUploadedSlotsForDocument(uploadedDocuments, doc.key);
    if (uploadedQuantity < requiredQuantity) {
      return false;
    }
  }
  return true;
}