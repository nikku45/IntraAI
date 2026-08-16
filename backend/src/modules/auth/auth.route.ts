// backend/src/modules/auth/auth.route.ts
import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();

// Endpoint: POST /api/v1/auth/register
router.post('/register', AuthController.register);

// Endpoint: POST /api/v1/auth/login
router.post('/login', AuthController.login);

export default router;
