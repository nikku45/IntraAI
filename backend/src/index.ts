// backend/src/index.ts
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';

// Load our .env file containing our DATABASE_URL and secret keys
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(helmet()); // Secures the app by setting various HTTP headers
app.use(cors()); // Allows our Next.js frontend to talk to this backend
app.use(express.json()); // Allows us to read JSON bodies in POST requests

// A simple test route to make sure it works!
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'IntraAI API is running smoothly!' });
});

// Start listening for internet traffic
app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
