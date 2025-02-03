import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

// Define the types for the function parameters
interface EmailTemplateData {
  to: string;
  from: string;
  templateId: string;
  dynamicTemplateData: Record<string, any>; // Use Record to allow any dynamic data to be passed
}

const sendEmailWithTemplate = async ({
  to,
  from,
  templateId,
  dynamicTemplateData,
}: EmailTemplateData): Promise<void> => {
  const msg = {
    to,
    from,
    templateId,
    dynamicTemplateData, // Pass variables for the template here
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent to ${to} using template ${templateId}`);
  } catch (error:any) {
    console.error("Error sending email:", error.response?.body || error);
    throw error; // Propagate the error so the controller can handle it
  }
};

// Export the sendEmailWithTemplate function
export { sendEmailWithTemplate };
