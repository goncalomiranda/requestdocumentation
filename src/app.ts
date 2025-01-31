import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import myRoute from './apps/request-documentation/api/routes';
import { exec } from 'child_process';

const app = express();
const PORT = process.env.PORT || 3000;

// Function to run `prisma db push` to sync the schema
const runPrismaDbPush = () => {
  exec('npx prisma db push', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error pushing Prisma schema: ${stderr}`);
    } else {
      console.log(`Prisma schema pushed: ${stdout}`);
    }
  });
};

// Run the Prisma schema sync before starting the app
runPrismaDbPush();

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
