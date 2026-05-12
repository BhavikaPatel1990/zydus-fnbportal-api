import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const patientId = 1340059;
    const hinaiOrderId = 62271949;

    const hinaiOrder = await prisma.hinaiOrder.findFirst({
        where: {
            patient_id: patientId,
            order_id: hinaiOrderId,
        },
    });

    console.log('HinaiOrder found:', hinaiOrder);

    if (hinaiOrder) {
        console.log('is_active status:', hinaiOrder.is_active);
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
