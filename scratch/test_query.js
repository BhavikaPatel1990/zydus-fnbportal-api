import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const activePOs = await prisma.patientOrder.findMany({
    where: { is_active: true },
    include: {
      hinaiOrder: true,
      dietTypeData: true
    }
  });

  console.log(`Found ${activePOs.length} active PatientOrder records:`);
  for (const po of activePOs) {
    console.log(`- PO ID: ${po.id}`);
    console.log(`  Patient Name: ${po.hinaiOrder?.patient_name}`);
    console.log(`  Hinai Order ID: ${po.hinai_order_id}`);
    console.log(`  Diet Type (PO): ${po.diet_type} (${po.dietTypeData?.diet_name})`);
    console.log(`  mst_id (PO): ${po.mst_id}`);
    console.log(`  created_at (PO): ${po.created_at}`);
    console.log(`  is_discharge (HO): ${po.hinaiOrder?.is_discharge}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
