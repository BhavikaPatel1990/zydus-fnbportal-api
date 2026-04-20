import { PrismaClient } from '../../prisma-auth/generated/auth-client/index.js';

const authPrisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.AUTH_DATABASE_URL,
        },
    },
});

export default authPrisma;
