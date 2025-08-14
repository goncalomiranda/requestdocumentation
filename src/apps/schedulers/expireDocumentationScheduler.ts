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
        this.schedule = process.env.EXPIRE_DOCS_SCHEDULE || '0 0 * * *'; // Default: midnight daily
        this.timezone = process.env.EXPIRE_DOCS_TIMEZONE || 'Europe/Lisbon'; // Default: Lisbon timezone
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
        // Validate cron expressionTIVE 
        if (!cron.validate(this.schedule)) {
            logger.error(`❌ Invalid cron expression: ${this.schedule}`);
            throw new Error(`Invalid cron expression: ${this.schedule}`);
        }

        // Create scheduled task with environment variables
        this.task = cron.schedule(this.schedule, this.expireDocumentationTask, {
            timezone: this.timezone
        });

        logger.info(`📅 ExpireDocumentationScheduler started - Schedule: ${this.schedule}, Timezone: ${this.timezone}`);
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