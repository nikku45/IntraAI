// backend/src/modules/auth/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export class AuthService {
    /**
     * Registers a NEW Company and its FIRST Admin User
     */
    static async registerUser(data: any) {
        const { email, password, companyName } = data;

        // 1. Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            const error: any = new Error('User already exists');
            error.statusCode = 400;
            throw error;
        }

        // 2. Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // 3. Create Company and User in ONE Transaction
        const result = await prisma.$transaction(async (tx: any) => {
            // Create Company
            const company = await tx.company.create({
                data: {
                    name: companyName,
                    slug: companyName.toLowerCase().replace(/ /g, '-'), // Basic slug logic
                },
            });

            // Create User as Admin
            const user = await tx.user.create({
                data: {
                    email,
                    password_hash: hashedPassword,
                    role: 'admin',
                    company_id: company.id,
                },
            });

            return { user, company };
        });

        // 4. Generate JWT
        const token = jwt.sign(
            { userId: result.user.id, companyId: result.company.id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return { user: result.user, token };
    }

    /**
     * Verifies credentials and returns a JWT token
     */
    static async loginUser(data: any) {
        const { email, password } = data;

        // 1. Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            include: { company: true },
        });

        if (!user || !user.password_hash) {
            const error: any = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        // 2. Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            const error: any = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        // 3. Generate JWT
        const token = jwt.sign(
            { userId: user.id, companyId: user.company_id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return { user, token };
    }
}
