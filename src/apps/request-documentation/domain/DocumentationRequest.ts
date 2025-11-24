import logger from "../../../libraries/loggers/logger";
import RequestedDocumentation from "../data-access/RequestDocumentation";

export async function getRequestedDocumentation(tenantId: string, customerId: string) {

  const requestedDocumentation = await RequestedDocumentation.findAll({
    where: {
      tenant_id: tenantId,
      customer_id: customerId,
    },
    attributes: [
      "request_id",
      "customer_id",
      "requested_documents",
      "created_at",
      "expiry_date",
      "status",
      "lang",
      // RGPD consent fields
      "consentGiven",
      "consentVersion",
      "givenAt",
      "consentTimezone",
      "userAgent",
      "browserLanguage",
      "consentA",
      "consentB",
      "consentC",
      "consentD",
    ],
    order: [["created_at", "DESC"]],
    raw: true, // Ensure Sequelize returns plain objects
  });

  logger.debug(`Requested documentation for tenant ${tenantId} and customer ${customerId}:`);

  const result = requestedDocumentation.map((doc: any) => {
    // Build the base response object
    const response: any = {
      request_id: doc.request_id,
      customer_id: doc.customer_id,
      requested_documents: JSON.parse(doc.requested_documents),
      created_at: doc.created_at,
      expiry_date: doc.expiry_date,
      status: doc.status,
      lang: doc.lang,
    };

    // Add RGPD consent data if it exists and was given (stored as 0/1 in DB)
    if (doc.consentGiven && doc.consentA && doc.consentB && doc.consentC && doc.consentD) {
      response.rgpd_consent = {
        consentGiven: !!doc.consentGiven,
        consentVersion: doc.consentVersion,
        givenAt: doc.givenAt,
        consentTimezone: doc.consentTimezone,
        userAgent: doc.userAgent,
        browserLanguage: doc.browserLanguage,
        consents: {
          A: !!doc.consentA,
          B: !!doc.consentB,
          C: !!doc.consentC,
          D: !!doc.consentD,
        },
      };
    }

    return response;
  });

  return result;
}
