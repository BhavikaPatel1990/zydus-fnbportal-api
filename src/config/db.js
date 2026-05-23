import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

const isDev = process.env.NODE_ENV === 'development';

const prisma = new PrismaClient({
    log: isDev
        ? [
            {
                emit: 'event',
                level: 'query',
            },
            'error',
            'warn',
        ]
        : ['error'],
});

if (isDev) {
    prisma.$on('query', (e) => {
        console.log('\n========================');
        console.log('QUERY : ', e.query);
        console.log('PARAMS:', e.params);
        console.log('TIME  : ', e.duration, 'ms');
        console.log('========================\n');
    });
}
export default prisma;
