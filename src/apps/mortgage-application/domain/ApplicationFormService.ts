import MortgageApplicationRepository from '../data-access/MortgageApplicationRepository';
import logger from '../../../libraries/loggers/logger';
import fs from 'fs';
import { AppError } from '../../../libraries/appError';
import { getDocumentsByLanguage } from "../../request-documentation/domain/documentService";
import pubSubService from '../../../libraries/pubsub/pubsubService';



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


    //check if mortgageApplication request is alreay done or expired
    if (
      mortgageApplication.dataValues.status === "DONE" ||
      mortgageApplication.dataValues.status === "EXPIRED"
    ) {
      logger.error("Status not available");
      throw new AppError("G2", "Mortage Application not available", true);
    }



    // Transform the JSON string field into an object
    const { tenant_id, ...rest } = mortgageApplication.dataValues;

    const transformedDocumentation = {
      ...rest
    };

    //throw new AppError("G12", "Error", true);

    logger.debug("Transformed Documentation: " + JSON.stringify(transformedDocumentation));

    return transformedDocumentation;


  } else {
    logger.warn("Mortage Application not found.");
    throw new AppError("G3", "Mortage Application not found.", true);
  }

}


export async function getApplicationFormByUser(customerId: string = "") {

  const mortgageApplication = await MortgageApplicationRepository.findAll({
    where: {
      customer_id: customerId,
      application_type: "MORTGAGE"
    },
    attributes: [
      'application_type',
      'request_id',
      'customer_id',
      'application_form_version',
      'created_at',
      'expiry_date',
      'status',
      'lang',
      'consentGiven',
      'consentVersion',
      'givenAt',
      'consentTimezone',
      'userAgent',
      'browserLanguage'
    ]
  });

  if (mortgageApplication) {
    logger.info("Mortage Application found.");
    logger.debug("Mortage Application found: " + JSON.stringify(mortgageApplication));

    return mortgageApplication;


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
    logger.error("submitApplicationForm: Mortgage Application not found.");
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
  }

  await MortgageApplicationRepository.update(updateFields, { where: { request_id: token } });

  // Publish event to Google Cloud Pub/Sub after successful database update
  try {
    const mortgageApplicationEvent = {
      eventType: 'MORTGAGE_APPLICATION_SUBMITTED',
      timestamp: new Date().toISOString(),
      requestId: token,
      customerId: application.dataValues.customer_id,
      status: 'DONE',
      applicationData: applicationFormData,
      consentGiven: consentData?.consentGiven || false,
      metadata: {
        language: application.dataValues.lang,
        userAgent: consentData?.userAgent || undefined,
        browserLanguage: consentData?.browserLanguage || undefined,
        applicationType: application.dataValues.application_type,
        expiryDate: application.dataValues.expiry_date,
      }
    };

    await pubSubService.publishMortgageApplicationEvent(mortgageApplicationEvent);
    logger.info(`Published mortgage application event for request ${token} to Pub/Sub`);
  } catch (pubSubError) {
    logger.error('Failed to publish mortgage application event to Pub/Sub:', pubSubError);
    // Don't throw error here as the main application submission was successful
  }

  logger.info("submitApplicationForm: Application form saved and marked as DONE");

  return { request_id: token, status: "DONE" };
}