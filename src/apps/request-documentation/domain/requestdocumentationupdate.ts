import RequestedDocumentation from '../data-access/RequestDocumentation';
import logger from '../../../libraries/loggers/logger';
import { RequestDocumentationUpdateModel } from './models/RequestDocumentationUpdate';
import crypto from 'crypto';
import dotenv from "dotenv";
import { sendWelcomeEmail } from '../../../libraries/email/nodemail'; // Use nodemailer version
import fs from "fs";
import path from "path";

// Load environment variables from .env file
dotenv.config();

export async function requestDocumentationUpdateStatus(tenant_id: string, request_id: string, status: string) {

  // Set the expiry date to today + number of days in environment
  const expiryDays = parseInt(process.env.EXPIRY_DAYS || '30', 10);
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);

  let finalStatus: string;
  let finalExpiryDate: Date;

  switch (status) {
    case "extend":
      finalStatus = "ACTIVE";
      finalExpiryDate = expiryDate; // Set to today + expiry days
      break;

    case "reactivate":
      finalStatus = "ACTIVE";
      finalExpiryDate = expiryDate; // Set to today + expiry days
      break;

    case "cancel":
      finalStatus = "EXPIRED";
      finalExpiryDate = new Date(); // Set to today
      break;

    default:
      logger.error(`Invalid status provided: ${status}`);
      throw new Error(`Invalid status: ${status}`);
  }

  // Update database
  await RequestedDocumentation.update(
    {
      status: finalStatus,
      expiry_date: finalExpiryDate
    },
    {
      where: {
        request_id: request_id,
        tenant_id: tenant_id
      }
    }
  );

  // Return the updated values as JSON object
  return {
    finalStatus,
    finalExpiryDate: finalExpiryDate.toISOString(),
    request_id,
    action: status
  };

}
