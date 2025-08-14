import ExpireDocumentationScheduler from './expireDocumentationScheduler';
import logger from '../../libraries/loggers/logger';

/**
 * Manager class to handle all schedulers in the application
 */
export class SchedulerManager {
    private static instance: SchedulerManager;
    private schedulers: Map<string, any> = new Map();

    private constructor() { }

    public static getInstance(): SchedulerManager {
        if (!SchedulerManager.instance) {
            SchedulerManager.instance = new SchedulerManager();
        }
        return SchedulerManager.instance;
    }

    /**
     * Initialize and start all schedulers
     */
    public async startAll(): Promise<void> {
        try {
            logger.info('🚀 Starting all schedulers...');

            // Initialize and start the documentation expiration scheduler
            const expireDocScheduler = ExpireDocumentationScheduler.getInstance();
            expireDocScheduler.start();
            this.schedulers.set('expireDocumentation', expireDocScheduler);

            logger.info(`✅ Successfully started ${this.schedulers.size} scheduler(s)`);
        } catch (error) {
            logger.error('❌ Error starting schedulers:', error);
            throw error;
        }
    }

    /**
     * Stop all schedulers
     */
    public stopAll(): void {
        logger.info('🛑 Stopping all schedulers...');

        this.schedulers.forEach((scheduler, name) => {
            try {
                if (scheduler.stop) {
                    scheduler.stop();
                    logger.info(`✅ Stopped scheduler: ${name}`);
                }
            } catch (error) {
                logger.error(`❌ Error stopping scheduler ${name}:`, error);
            }
        });

        this.schedulers.clear();
        logger.info('🛑 All schedulers stopped');
    }

    /**
     * Get a specific scheduler instance
     */
    public getScheduler(name: string): any {
        return this.schedulers.get(name);
    }

    /**
     * Manual trigger for specific scheduler (useful for testing)
     */
    public async triggerScheduler(name: string): Promise<void> {
        const scheduler = this.schedulers.get(name);
        if (scheduler && scheduler.triggerManually) {
            await scheduler.triggerManually();
        } else {
            throw new Error(`Scheduler ${name} not found or does not support manual trigger`);
        }
    }
}

export default SchedulerManager;