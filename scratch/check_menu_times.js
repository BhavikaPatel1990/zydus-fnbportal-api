import prisma from '../src/config/db.js';

async function checkMenuTimes() {
    try {
        const menuTimes = await prisma.menuTime.findMany();
        console.log('MenuTimes:', JSON.stringify(menuTimes, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkMenuTimes();
