import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import path from "path";
import documentation from './apps/request-documentation/api/routes';
import uploadDocuments from './apps/request-documentation/api/getdocumentuploadroute';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './libraries/gateway/swagger'; // Path to your swagger specification
import applySecurityMiddleware from './libraries/gateway/security';
import sequelize from "./libraries/data-access/db-config"; // Sequelize instance
import SchedulerManager from './apps/schedulers/schedulerManager'; // Import scheduler manager


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
    console.log("Database synchronized successfully!");

    // Start all schedulers after database sync
    try {
      const schedulerManager = SchedulerManager.getInstance();
      await schedulerManager.startAll();
    } catch (error) {
      console.error("Error starting schedulers:", error);
      // Continue with server startup even if schedulers fail
    }

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error syncing database:", err);
  });

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  const schedulerManager = SchedulerManager.getInstance();
  schedulerManager.stopAll();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  const schedulerManager = SchedulerManager.getInstance();
  schedulerManager.stopAll();
  process.exit(0);
});