import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import myRoute from './apps/request-documentation/api/routes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './libraries/gateway/swagger'; // Path to your swagger specification

import applySecurityMiddleware from './libraries/gateway/security';


const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1); // Trust the first proxy

// Apply security middleware (CORS & Helmet)
applySecurityMiddleware(app);



// Middleware
app.use(bodyParser.json());

// Routes
app.use('/document-requests', myRoute);

// Serve Swagger UI globally at /docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Define a simple route
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
