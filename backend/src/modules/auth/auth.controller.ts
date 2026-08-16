// backend/src/modules/auth/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
    /**
     * Handles the request to create a new Company and Admin
     */
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password, companyName } = req.body;

            // 1. Basic validation (we'll make this better later!)
            if (!email || !password || !companyName) {
                const error: any = new Error('Please provide email, password, and company name');
                error.statusCode = 400;
                throw error;
            }

            // 2. Call the service to do the heavy lifting
            const result = await AuthService.registerUser({ email, password, companyName });

            // 3. Send back a beautiful success response
            res.status(201).json({
                success: true,
                message: 'Company and Admin created successfully!',
                data: result,
            });
        } catch (error) {
            // 4. IMPORTANT: If anything crashes, "next(error)" sends it 
            // straight down to our Global Error Handler!
            next(error);
        }
    }
    /**
     * Handles the request to verify credentials and login
     */
    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                const error: any = new Error('Please provide email and password');
                error.statusCode = 400;
                throw error;
            }

            const result = await AuthService.loginUser({ email, password });

            res.status(200).json({
                success: true,
                message: 'Login successful!',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}
