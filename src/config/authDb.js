import { PrismaClient } from '@prisma/client';

const authPrisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.AUTH_DATABASE_URL,
        },
    },
});

export default authPrisma;
