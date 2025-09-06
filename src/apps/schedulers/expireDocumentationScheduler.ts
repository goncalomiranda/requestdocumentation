import * as cron from 'node-cron';
import { Op } from 'sequelize';
import RequestedDocumentation from '../request-documentation/data-access/RequestDocumentation';
import logger from '../../libraries/loggers/logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Scheduler that runs every night at midnight (Lisbon timezone) 
 * to update expired documentation requests
 */
export class ExpireDocumentationScheduler {
    private static instance: ExpireDocumentationScheduler;
    private task: cron.ScheduledTask | null = null;
    private readonly schedule: string;
    private readonly timezone: string;

    private constructor() {
        // Get schedule and timezone from environment variables with defaults
        const rawSchedule = process.env.EXPIRE_DOCS_SCHEDULE || 'MCAwICogKiAq';
        const rawTimezone = process.env.EXPIRE_DOCS_TIMEZONE || 'Europe/Lisbon';

        // Log the raw values for debugging
        logger.info(`Raw EXPIRE_DOCS_SCHEDULE: "${rawSchedule}"`);
        logger.info(`Raw EXPIRE_DOCS_TIMEZONE: "${rawTimezone}"`);

        // Try to decode if it looks like base64, otherwise use as-is
        this.schedule = this.decodeCronExpression(rawSchedule);
        this.timezone = rawTimezone.trim();

        logger.info(`Final schedule: "${this.schedule}"`);
        logger.info(`Timezone: "${this.timezone}"`);
    }

    /**
     * Decode Base64 encoded cron expression or use regular expression
     */
    private decodeCronExpression(rawSchedule: string): string {
        const cleaned = rawSchedule.replace(/['"]/g, '').trim();

        // Check if it looks like Base64 (no spaces, typical base64 characters)
        const base64Pattern = /^[A-Za-z0-9+/]+=*$/;

        if (base64Pattern.test(cleaned) && cleaned.length > 10) {
            try {
                // Try to decode as Base64
                const decoded = Buffer.from(cleaned, 'base64').toString('utf-8');
                logger.info(`Decoded Base64 cron expression: "${decoded}"`);
                return decoded;
            } catch (error) {
                logger.warn(`Failed to decode Base64: ${error}. Treating as regular expression.`);
                // Fall through to return regular expression
            }
        }

        // Not Base64 or decoding failed, return as-is
        return cleaned;
    }

    public static getInstance(): ExpireDocumentationScheduler {
        if (!ExpireDocumentationScheduler.instance) {
            ExpireDocumentationScheduler.instance = new ExpireDocumentationScheduler();
        }
        return ExpireDocumentationScheduler.instance;
    }

    /**
     * Start the scheduler
     */
    public start(): void {
        // Validate cron expression
        if (!cron.validate(this.schedule)) {
            logger.error(`❌ Invalid cron expression: ${this.schedule}`);
            throw new Error(`Invalid cron expression: ${this.schedule}`);
        }

        // Stop any existing task first
        if (this.task) {
            this.task.stop();
            this.task.destroy();
        }

        // Create scheduled task with environment variables - bind the method to preserve 'this' context
        this.task = cron.schedule(this.schedule, () => {
            logger.info(`🕐 Cron trigger fired at ${new Date().toISOString()}`);
            this.expireDocumentationTask().catch(error => {
                logger.error('❌ Error in scheduled task:', error);
            });
        }, {
            timezone: this.timezone
        });

        // Start the task explicitly
        this.task.start();

        logger.info(`📅 ExpireDocumentationScheduler started - Schedule: ${this.schedule}, Timezone: ${this.timezone}`);
        logger.info(`📅 Task scheduled: ${this.task.getStatus()}, Next execution should be within 30 seconds`);
    }

    /**
     * Stop the scheduler
     */
    public stop(): void {
        if (this.task) {
            this.task.stop();
            logger.info('📅 ExpireDocumentationScheduler stopped');
        }
    }

    /**
     * The actual task that expires documentation requests
     */
    private async expireDocumentationTask(): Promise<void> {
        try {
            logger.info('🔄 Starting documentation expiration task...');

            const now = new Date();

            // Find all records where expiry_date is less than today and status is ACTIVE
            const [updatedCount] = await RequestedDocumentation.update(
                { status: 'EXPIRED' },
                {
                    where: {
                        expiry_date: {
                            [Op.lt]: now // Less than current date/time
                        },
                        status: 'ACTIVE'
                    }
                }
            );

            logger.info(`✅ Documentation expiration task completed. ${updatedCount} records updated to EXPIRED status`);

        } catch (error) {
            logger.error('❌ Error in documentation expiration task:', error);
            // Don't throw the error to prevent the scheduler from stopping
        }
    }

    /**
     * Manual trigger for testing purposes
     */
    public async triggerManually(): Promise<void> {
        logger.info('🔧 Manually triggering documentation expiration task...');
        await this.expireDocumentationTask();
    }

    /**
     * Get current scheduler configuration
     */
    public getConfig(): { schedule: string; timezone: string } {
        return {
            schedule: this.schedule,
            timezone: this.timezone
        };
    }
}

export default ExpireDocumentationScheduler;