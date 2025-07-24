import nodemailer from "nodemailer";
import dotenv from "dotenv";
import logger from '../loggers/logger';

// Load environment variables from .env file
dotenv.config();

interface SendEmailOptions {
  to: string;
  from?: string;
  subject: string;
  emailHtml: string;
}

const sendWelcomeEmail = async ({
  to,
  from,
  subject,
  emailHtml,
}: SendEmailOptions): Promise<any> => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: from || process.env.SMTP_USER,
      to,
      subject,
      html: emailHtml,
    });

    logger.info(`Email sent via Nodemailer: ${info.messageId}`);
    return info;
  } catch (error: any) {
    logger.error("Error sending email via Nodemailer:", error);
    throw error;
  }
};

export { sendWelcomeEmail };
