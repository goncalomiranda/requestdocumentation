import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import myRoute from './apps/request-documentation/api/routes';
import { exec } from 'child_process';

const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(bodyParser.json());

// Routes
app.use('/document-requests', myRoute);

// Define a simple route
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
