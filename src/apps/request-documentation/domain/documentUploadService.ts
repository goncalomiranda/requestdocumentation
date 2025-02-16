import Document from '../data-access/Document';
import Translation  from '../data-access/DocumentTranslation';
import RequestedDocumentation from '../data-access/RequestDocumentation';
import logger from '../../../libraries/loggers/logger';
import fs from 'fs';
import { AppError }  from '../../../libraries/appError';
import { getDocumentsByLanguage } from "./documentService";

export async function uploadDocuments(token: string, files: Express.Multer.File[]) {

  if (!token) {
    logger.error("Request ID is missing");
    deleteFiles(files); // Ensure files are deleted
    throw new AppError("U1", "Bad Request", true);
  }

  const requestedDocumentation = await RequestedDocumentation.findOne({
    where: {
      request_id: token,
    },
    //attributes: ["request_id", "lang"], // Explicitly select 'lang'
  });

  console.log("requestedDocumentation", requestedDocumentation);
  
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
    const documentTypes = await getDocumentsByLanguage(requestedDocumentation.get("lang") as string);

    //check if documentation request is expired
    if (isRequestExpired(requestedDocumentation.dataValues.expiry_date)) {
      RequestedDocumentation.update(
        { status: "EXPIRED" },
        {
          where: {
            request_id: token+"merda",
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

    const finalDocuments = parsedDocuments.map((doc : any) => {
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

const deleteFiles = (files : any) => {
  files.forEach((file : any) => {
    fs.unlink(file.path, (err) => {
      if (err) {
        logger.error(`Error deleting file ${file.path}:`, err);
      } else {
        logger.info(`Successfully deleted file ${file.path}`);
      }
    });
  });
};