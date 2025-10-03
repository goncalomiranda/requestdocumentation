import logger from "../../../libraries/loggers/logger";
import Newsfeed from "../data-access/Newsfeed";

// Helper function to generate human-readable messages
function generateMessage(item: any): { message: string; messageVariables: any } {
    const messageVariables: any = {
        CUSTOMER_ID: item.customer_id,
        REQUEST_ID: item.request_id,
    };

    let message = "";

    switch (item.operation) {
        case "INSERT":
            message = "New documentation request created for customer <CUSTOMER_ID> with request ID <REQUEST_ID>";
            break;

        case "UPDATE":
            if (item.old_status && item.new_status) {
                messageVariables.OLD_STATUS = item.old_status;
                messageVariables.NEW_STATUS = item.new_status;
                message = "Customer <CUSTOMER_ID> changed request documentation status from <OLD_STATUS> to <NEW_STATUS>";
            } else {
                message = "Documentation request <REQUEST_ID> was updated for customer <CUSTOMER_ID>";
            }
            break;

        case "DELETE":
            message = "Documentation request <REQUEST_ID> was deleted for customer <CUSTOMER_ID>";
            break;

        default:
            message = "Documentation request <REQUEST_ID> was modified for customer <CUSTOMER_ID>";
    }

    return { message, messageVariables };
}

export async function getNewsfeed(tenantId: string, customerId?: string) {
    const whereClause: any = {
        tenant_id: tenantId,
    };

    // If customerId is provided, filter by it
    if (customerId) {
        whereClause.customer_id = customerId;
    }

    // Get max results from environment variable, default to 50
    const maxResults = parseInt(process.env.NEWSFEED_MAX_RESULTS || '50', 10);

    const newsfeedData = await Newsfeed.findAll({
        where: whereClause,
        attributes: [
            "id",
            "tenant_id",
            "customer_id",
            "request_id",
            "operation",
            "old_status",
            "new_status",
            "changed_at",
        ],
        order: [["changed_at", "DESC"]],
        limit: maxResults,
        raw: true, // Ensure Sequelize returns plain objects
    });

    logger.debug(`Newsfeed data for tenant ${tenantId}${customerId ? ` and customer ${customerId}` : ''} (limit: ${maxResults}):`);

    return newsfeedData.map((item: any) => {
        const { message, messageVariables } = generateMessage(item);

        return {
            customerId: item.customer_id,
            createdDate: item.changed_at,
            scope: "STATUS", // Based on your example, this seems to be status-related
            operation: item.operation === "UPDATE" ? "EDIT" : item.operation,
            feedKey: item.tenant_id,
            requestId: item.request_id,
            messageVariables,
            message,
            // Include original fields for backward compatibility
            id: item.id,
            tenant_id: item.tenant_id,
            old_status: item.old_status,
            new_status: item.new_status,
            changed_at: item.changed_at,
        };
    })
        .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()); // Additional sort by createdDate DESC
}