import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import path from "path";
import documentation from './apps/request-documentation/api/routes';
import documentationUpdate from './apps/request-documentation/api/requestdocumentationupdate';
import uploadDocuments from './apps/request-documentation/api/getdocumentuploadroute';
import applicationForm from './apps/mortgage-application/api/mortgage-app-routes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './libraries/gateway/swagger'; // Path to your swagger specification
import applySecurityMiddleware from './libraries/gateway/security';
import logger from './libraries/loggers/logger'; // Logger
import sequelize from "./libraries/data-access/db-config"; // Sequelize instance
import SchedulerManager from './apps/schedulers/schedulerManager'; // Import scheduler manager
import './libraries/redis/redis'; // Initialize Redis connection

// Import all models to ensure they are defined before sync
import './libraries/gateway/authenticators/data-access/Tenant'; // Import Tenant model
import './apps/mortgage-application/data-access/MortgageApplicationRepository'; // Import ApplicationForm model
import './apps/request-documentation/data-access/RequestDocumentation'; // Import other models if needed

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1); // Trust the first proxy

// Apply security middleware (CORS & Helmet)
applySecurityMiddleware(app);

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/document-requests', documentation);
app.use('/request-documentation', uploadDocuments);
app.use('/request-documentation/status', documentationUpdate);
app.use('/mortgage-application', applicationForm);

// Serve Swagger UI globally at /docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.use(express.static(path.join(__dirname, "public")));

// ✅ Handle all other routes and serve frontend "index.html"
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔹 Sync DB and start schedulers before starting the server
sequelize
  .sync()
  .then(async () => {
    logger.info("Database synchronized successfully!");

    // Start all schedulers after database sync
    try {
      const schedulerManager = SchedulerManager.getInstance();
      await schedulerManager.startAll();
    } catch (error) {
      logger.error("Error starting schedulers:", error);
      // Continue with server startup even if schedulers fail
    }

    app.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("Error syncing database:", err);
  });

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  const schedulerManager = SchedulerManager.getInstance();
  schedulerManager.stopAll();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  const schedulerManager = SchedulerManager.getInstance();
  schedulerManager.stopAll();
  process.exit(0);
});