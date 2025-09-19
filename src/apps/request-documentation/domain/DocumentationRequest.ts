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
    ],
    order: [["created_at", "DESC"]],
    raw: true, // Ensure Sequelize returns plain objects
  });

  logger.debug(`Requested documentation for tenant ${tenantId} and customer ${customerId}:`);

  const result = requestedDocumentation.map((doc: any) => {
    return {
      request_id: doc.request_id, // Manually setting request_id
      customer_id: doc.customer_id,
      requested_documents: JSON.parse(doc.requested_documents), // Parse JSON if needed
      created_at: doc.created_at,
      expiry_date: doc.expiry_date,
      status: doc.status,
      lang: doc.lang,
    };
  });

  return result;
}
