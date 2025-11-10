import { PubSub } from '@google-cloud/pubsub';
import logger from '../loggers/logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Pub/Sub client using the same service account as Google Drive
const pubSubClient = new PubSub({
    projectId: process.env.GOOGLE_PROJECT_ID,
    keyFilename: undefined, // We'll use the service account key directly
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_PROJECT_ID,
    },
});

export interface MortgageApplicationEvent {
    eventType: string;
    timestamp: string;
    requestId: string;
    customerId?: string;
    status: string;
    applicationData?: any;
    consentGiven?: boolean;
    metadata?: {
        language?: string;
        userAgent?: string;
        browserLanguage?: string;
        [key: string]: any;
    };
}

export class PubSubService {
    private static instance: PubSubService;

    private constructor() { }

    public static getInstance(): PubSubService {
        if (!PubSubService.instance) {
            PubSubService.instance = new PubSubService();
        }
        return PubSubService.instance;
    }

    /**
     * Publishes an event to a Google Cloud Pub/Sub topic (topic must already exist)
     * @param topicName - The name or full path of the Pub/Sub topic
     * @param eventData - The event data to publish
     */
    public async publishEvent(topicName: string, eventData: MortgageApplicationEvent): Promise<void> {
        try {
            // Handle both full topic paths and simple topic names
            const topic = topicName.startsWith('projects/')
                ? pubSubClient.topic(topicName.split('/topics/')[1])
                : pubSubClient.topic(topicName);

            // Convert event data to Buffer
            const dataBuffer = Buffer.from(JSON.stringify(eventData));

            // Publish the message (assumes topic already exists in Google Cloud)
            const messageId = await topic.publishMessage({
                data: dataBuffer,
                attributes: {
                    eventType: eventData.eventType,
                    timestamp: eventData.timestamp,
                    requestId: eventData.requestId,
                },
            });

            logger.info(`Published event to topic ${topicName} with message ID: ${messageId}`);
        } catch (error) {
            logger.error(`Failed to publish event to topic ${topicName}:`, error);
            if (error instanceof Error && (error.message?.includes('does not exist') || error.message?.includes('not found'))) {
                logger.error(`Topic ${topicName} does not exist in Google Cloud. Please create it manually.`);
            }
            throw error;
        }
    }

    /**
     * Publishes a mortgage application submission event
     * @param eventData - The mortgage application event data
     */
    public async publishMortgageApplicationEvent(eventData: MortgageApplicationEvent): Promise<void> {
        const topicName = process.env.PUBSUB_MORTGAGE_APPLICATION_TOPIC || 'mortgage-application-events';
        logger.info(`Publishing mortgage application event to topic: ${topicName}`);
        await this.publishEvent(topicName, eventData);
    }

    /**
     * Publishes a document upload completion event
     * @param eventData - The document upload event data
     */
    public async publishDocumentUploadEvent(eventData: MortgageApplicationEvent): Promise<void> {
        const topicName = process.env.PUBSUB_DOCUMENT_UPLOAD_TOPIC || 'document-upload-events';
        await this.publishEvent(topicName, eventData);
    }

    /**
     * Publishes an event to a custom topic
     * @param customTopicName - The name of the custom topic
     * @param eventData - The event data to publish
     */
    public async publishToCustomTopic(customTopicName: string, eventData: MortgageApplicationEvent): Promise<void> {
        await this.publishEvent(customTopicName, eventData);
    }

    /**
     * Gets the configured topic and subscription names for mortgage applications
     * @returns Object with topic and subscription names
     */
    public getMortgageApplicationConfig() {
        return {
            topicName: process.env.PUBSUB_MORTGAGE_APPLICATION_TOPIC || 'mortgage-application-events',
            subscriptionName: process.env.PUBSUB_MORTGAGE_APPLICATION_SUBSCRIPTION || 'application-form-processor',
            projectId: process.env.GOOGLE_PROJECT_ID
        };
    }

    /**
     * Checks if the mortgage application subscription exists
     * @returns Promise<boolean> - True if subscription exists
     */
    public async checkMortgageApplicationSubscription(): Promise<boolean> {
        try {
            const config = this.getMortgageApplicationConfig();
            const subscription = pubSubClient.subscription(config.subscriptionName);
            const [exists] = await subscription.exists();

            if (exists) {
                logger.info(`Subscription ${config.subscriptionName} exists and is ready to process messages`);
            } else {
                logger.warn(`Subscription ${config.subscriptionName} does not exist`);
            }

            return exists;
        } catch (error) {
            logger.error('Failed to check subscription status:', error);
            return false;
        }
    }
}

export default PubSubService.getInstance();