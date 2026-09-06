import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/error.middleware';
import authrouter from './modules/auth/auth.route';
import documentRouter from './modules/documents/document.route';
import chatRouter from './modules/chat/chat.route';
import './lib/worker';

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

app.use('/api/v1/auth', authrouter);
app.use('/api/v1/documents', documentRouter);
app.use('/api/v1/chat', chatRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  (error as any).statusCode = 404;
  next(error); // This "sends" the error to the errorHandler below
});

app.use(errorHandler);
// Start listening for internet traffic
app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
