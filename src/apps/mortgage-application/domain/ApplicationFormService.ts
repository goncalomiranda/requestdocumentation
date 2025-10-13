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