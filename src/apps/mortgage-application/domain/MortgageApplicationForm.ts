import MortageApplicationRepository from '../data-access/MortgageApplicationRepository';
import logger from '../../../libraries/loggers/logger';
import { ApplicationForm } from '../domain/models/MortgageAppModel';
import crypto from 'crypto';
import dotenv from "dotenv";
import { sendWelcomeEmail } from '../../../libraries/email/nodemail'; // Use nodemailer version
import fs from "fs";
import path from "path";
import { application } from 'express';

// Load environment variables from .env file
dotenv.config();

export async function requestApplicationForm(applicationForm: ApplicationForm, tenant_id: string) {

    // Generate a unique encrypted token for the link
    const token = crypto.randomBytes(20).toString("hex");

    // Set the expiry date to today + number of days in environment
    const expiryDays = parseInt(process.env.MORTGAGE_EXPIRY_DAYS || '30', 10);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    const baseUrl = process.env.MY_BASE_URL;

    // Construct the unique link, conditionally adding the port in development
    const uniqueLink =
        process.env.NODE_ENV === "production"
            ? `https://${baseUrl}/mortgage-application?token=${token}`
            : `http://${baseUrl}:3001/mortgage-application?token=${token}`;

    // Prepare data to be saved
    const requestData = {
        application_type: applicationForm.type || "MORTGAGE",
        request_id: token, // or `crypto.randomUUID()` for a UUID
        customer_id: applicationForm.customer.id,
        unique_link: uniqueLink,
        requested_documents: applicationForm.documents,
        application_form_version: "1.0",
        tenant_id: tenant_id,
        created_at: new Date(),
        expiry_date: expiryDate,
        lang: applicationForm.customer.languagePreference,
        folder: applicationForm.customer.folder,
        status: "ACTIVE",
    };

    // Save to the database
    await MortageApplicationRepository.create(requestData);


    // Prepare email template data
    try {
        // Determine language and load template data
        const lang = (applicationForm.customer.languagePreference || "EN").toUpperCase();
        const templateDataPath = path.join(
            __dirname,
            "../../../libraries/email/templates/application_form/application_form_data.json"
        );

        const templateDataRaw = fs.readFileSync(templateDataPath, "utf8");
        const templateDataJson = JSON.parse(templateDataRaw);
        const templateData = templateDataJson[lang];

        // Replace {{name}} in the title with the customer's name
        const processedTitle = templateData.title.replace(/{{name}}/g, applicationForm.customer.name);
        // Replace {{expiryDate}} in the body with the formatted expiry date
        const processedBody = templateData.body.replace(/{{expiryDate}}/g, formatDate(expiryDate));

        // Load HTML template
        const templateHtmlPath = path.join(
            __dirname,
            "../../../libraries/email/templates/application_form/application_form_template.html"
        );

        let emailHtml = fs.readFileSync(templateHtmlPath, "utf8");


        // Replace placeholders in HTML 
        emailHtml = emailHtml
            .replace(/{{subject}}/g, templateData.subject)
            .replace(/{{title}}/g, processedTitle)
            .replace(/{{greeting}}/g, templateData.greeting)
            .replace(/{{customerName}}/g, applicationForm.customer.name)
            .replace(/{{body}}/g, processedBody)
            .replace(/{{expiryDate}}/g, formatDate(expiryDate))
            .replace(/{{uniquelink}}/g, uniqueLink)
            .replace(/{{buttonLabel}}/g, templateData.buttonLabel)
            .replace(/{{footer}}/g, templateData.footer);

        // Send email
        await sendWelcomeEmail({
            to: applicationForm.customer.email,
            from: process.env.SMTP_USER || '',
            subject: templateData.subject,
            emailHtml: emailHtml,
        });

        // Respond with success
    } catch (error) {
        // Handle errors
        logger.error(error);
    }

    return {
        id: token,
        expiry_date: formatDate(expiryDate),
        unique_link: uniqueLink
    };
}


interface FormatDate {
    (date: Date): string;
}

const formatDate: FormatDate = (date: Date): string => {
    const isoString = date.toISOString(); // Converts to ISO format: 2024-12-23T00:30:23.000Z
    return isoString.split("T")[0]; // Splits at 'T' and takes the date portion
};
