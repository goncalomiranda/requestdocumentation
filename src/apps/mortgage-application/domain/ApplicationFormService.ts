import MortgageApplicationRepository from '../data-access/MortgageApplicationRepository';
import logger from '../../../libraries/loggers/logger';
import fs from 'fs';
import { AppError } from '../../../libraries/appError';
import { getDocumentsByLanguage } from "../../request-documentation/domain/documentService";



export async function getApplicationForm(token: string = "") {

  const mortgageApplication = await MortgageApplicationRepository.findOne({
    where: {
      request_id: token,
      application_type: "MORTGAGE"
    },

  });

  if (mortgageApplication) {
    logger.info("Mortage Application found.");
    logger.debug("Mortage Application found: " + JSON.stringify(mortgageApplication));
    const documentTypes = await getDocumentsByLanguage(mortgageApplication.get("lang") as string);
    logger.info("documentTypes: " + JSON.stringify(documentTypes));

    //check if documentation request is expired
    if (isRequestExpired(mortgageApplication.dataValues.expiry_date)) {
      logger.info("expiring Mortage Application...");
      mortgageApplication.update(
        { status: "EXPIRED" },
        {
          where: {
            request_id: token,
          },
        }
      ).then((result) => {
        logger.debug("fetching Mortage Application");
      })
        .catch((err) => {
          logger.error("Error updating Mortage Application status to EXPIRED");
          logger.error(err);
          throw new AppError("G1", "Error updating Mortage Application status to EXPIRED", true);
        });

      throw new AppError("G1", "Error", true);
    }


    //check if documentation request is alreay done or expired
    if (
      mortgageApplication.dataValues.status === "DONE" ||
      mortgageApplication.dataValues.status === "EXPIRED"
    ) {
      logger.error("Status not available to request:");
      throw new AppError("G2", "Mortage Application not available", true);
    }

    const parsedDocuments = JSON.parse(mortgageApplication.dataValues.requested_documents.trim());

    const finalDocuments = parsedDocuments.map((doc: any) => {
      const description = documentTypes.documents.find(d => d.key === doc.key);
      return {
        key: doc.key,
        value: description ? description.value : "", // Default to empty string if not found
        quantity: doc.quantity
      };
    });


    // Transform the JSON string field into an object
    const { requested_documents, tenant_id, ...rest } = mortgageApplication.dataValues;

    const transformedDocumentation = {
      ...rest, // Includes all other fields except requested_documents
      documents: finalDocuments // Parse and add as "documents"
    };

    //throw new AppError("G12", "Error", true);

    return transformedDocumentation;


  } else {
    logger.warn("Mortage Application not found.");
    throw new AppError("G3", "Mortage Application not found.", true);
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

// Persist submitted application form for a given token and mark as DONE
export async function submitApplicationForm(
  token: string,
  applicationFormData: any,
  consentData?: {
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
  }
) {
  if (!token) {
    logger.error("submitApplicationForm: Missing token");
    throw new AppError("S1", "Bad Request", true);
  }

  const application = await MortgageApplicationRepository.findOne({
    where: { request_id: token, application_type: "MORTGAGE" },
  });

  if (!application) {
    logger.warn("submitApplicationForm: Mortgage Application not found.");
    throw new AppError("G3", "Mortage Application not found.", true);
  }

  // Expiry check
  if (isRequestExpired(application.dataValues.expiry_date)) {
    await MortgageApplicationRepository.update(
      { status: "EXPIRED" },
      { where: { request_id: token } }
    );
    logger.error("submitApplicationForm: Request has expired");
    throw new AppError("G1", "Bad Request", true);
  }

  // Not available if already DONE or EXPIRED
  if (
    application.dataValues.status === "DONE" ||
    application.dataValues.status === "EXPIRED"
  ) {
    logger.error("submitApplicationForm: Status not available to submit");
    throw new AppError("G2", "Mortage Application not available", true);
  }

  const updateFields: any = {
    application_form: applicationFormData,
    status: "DONE",
  };

  // Optionally persist consent metadata if provided
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

  await MortgageApplicationRepository.update(updateFields, { where: { request_id: token } });

  logger.info("submitApplicationForm: Application form saved and marked as DONE");

  return { request_id: token, status: "DONE" };
}