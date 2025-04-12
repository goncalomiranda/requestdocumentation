import RequestedDocumentation from '../data-access/RequestDocumentation';
import logger from '../../../libraries/loggers/logger';
import { DocumentationRequest } from './models/RequestDocumentationModel';
import crypto from 'crypto';
import dotenv from "dotenv";
import { sendEmailWithTemplate } from '../../../libraries/email/email'; // Adjust path 

// Load environment variables from .env file
dotenv.config();

export async function requestDocumentation(DocumentationRequest: DocumentationRequest, tenant_id : string) {

    // Generate a unique encrypted token for the link
    const token = crypto.randomBytes(20).toString("hex");

    // Set the expiry date to today + number of days in environment
    const expiryDays = parseInt(process.env.EXPIRY_DAYS || '30', 10);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
  
    const baseUrl = process.env.MY_BASE_URL;

    // Construct the unique link, conditionally adding the port in development
    const uniqueLink =
      process.env.NODE_ENV === "production"
        ? `https://${baseUrl}/upload?token=${token}`
        : `http://${baseUrl}:3001/document/upload?token=${token}`;

    // Prepare data to be saved
    const requestData = {
      request_id: token, // or `crypto.randomUUID()` for a UUID
      customer_id: DocumentationRequest.customer.id,
      unique_link: uniqueLink,
      requested_documents: DocumentationRequest.documents,
      tenant_id: tenant_id,
      created_at: new Date(),
      expiry_date: expiryDate,
      lang: DocumentationRequest.customer.languagePreference,
      status: "ACTIVE",
    };

  // Save to the database
  await RequestedDocumentation.create(requestData);

    //send email to customer with generated link
    try {
      // Call the sendEmailWithTemplate method
      await sendEmailWithTemplate({
        to: DocumentationRequest.customer.email,
        from: process.env.SENDGRID_SENDER || '',
        templateId: process.env.SENDGRID_REQUESTDOCUMENTATION_TEMPLATE_ID || '',
        dynamicTemplateData: {
          name: DocumentationRequest.customer.name, // Template variable: {{firstName}}
          expiryDate: formatDate(expiryDate), // Template variable: {{appName}}
          uniquelink: uniqueLink, // Template variable: {{appUrl}}
        },
      });
  
      // Respond with success
    } catch (error) {
      // Handle errors
      console.error(error);
    }

  return {
    id: token,
    expiry_date: formatDate(expiryDate),

  };
}


interface FormatDate {
  (date: Date): string;
}

const formatDate: FormatDate = (date: Date): string => {
  const isoString = date.toISOString(); // Converts to ISO format: 2024-12-23T00:30:23.000Z
  return isoString.split("T")[0]; // Splits at 'T' and takes the date portion
};
