import fs from 'fs';
import csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/* ===============================
   MENU TIME SEED
=============================== */
async function seedMenuTime() {
  const menuTimes = [
    { description: "EM" },
    { description: "Breakfast" },
    { description: "MM" },
    { description: "Lunch" },
    { description: "2PM" },
    { description: "EveTea" },
    { description: "6PM" },
    { description: "Dinner" },
    { description: "BT" }
  ];

  await Promise.all(
    menuTimes.map(item =>
      prisma.menuTime.upsert({
        where: { description: item.description }, // ✅ use unique field
        update: { is_active: true },
        create: item
      })
    )
  );

  console.log("✅ MenuTime seeded");
}
/* ===============================
   DIET TYPE SEED
=============================== */
async function seedDietType() {
  const dietTypes = [
    { diet_type_id: 17154031, diet_name: "NBM", from_time: new Date("1970-01-01T00:00:00"), to_time: new Date("1970-01-01T23:59:00") },
    { diet_type_id: 17129481, diet_name: "SOFT DIET", from_time: new Date("1970-01-01T00:00:00"), to_time: new Date("1970-01-01T23:59:00") },
    { diet_type_id: 17129492, diet_name: "LIQUIDS ORALLY", from_time: new Date("1970-01-01T00:00:00"), to_time: new Date("1970-01-01T23:59:00") },
    { diet_type_id: 17129493, diet_name: "TUBE FEEDING", from_time: new Date("1970-01-01T00:00:00"), to_time: new Date("1970-01-01T23:59:00") },
    { diet_type_id: 17129494, diet_name: "FULL DIET", from_time: new Date("1970-01-01T00:00:00"), to_time: new Date("1970-01-01T23:59:00") },
    { diet_type_id: 17129495, diet_name: "CLEAR LIQUIDS", from_time: new Date("1970-01-01T15:30:00"), to_time: new Date("1970-01-01T16:30:00") },
    { diet_type_id: 17129496, diet_name: "SOUP/JUICE", from_time: new Date("1970-01-01T17:30:00"), to_time: new Date("1970-01-01T18:30:00") },
    { diet_type_id: 17129501, diet_name: "D/N", from_time: new Date("1970-01-01T19:30:00"), to_time: new Date("1970-01-01T21:30:00") },
    { diet_type_id: 17129503, diet_name: "HEALTH DRINK", from_time: new Date("1970-01-01T21:30:00"), to_time: new Date("1970-01-01T22:30:00") },
    { diet_type_id: 18894123, diet_name: "EXTRA ORDER", from_time: new Date("1970-01-01T00:00:00"), to_time: new Date("1970-01-01T23:59:00") },
    { diet_type_id: 18476586, diet_name: "AllDay", from_time: new Date("1970-01-01T00:00:00"), to_time: new Date("1970-01-01T00:00:00") }
  ];

  await prisma.dietType.createMany({
    data: dietTypes,
    skipDuplicates: true
  });

  console.log("✅ DietType seeded");
}

/* ===============================
   LOCATIONS SEED
=============================== */
async function seedLocationsFromCSV() {
  const results = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream('prisma/data/locations.csv')
      .pipe(csv())
      .on('data', (row) => {
        // Clean + map CSV fields
        results.push({
          name: row.location_name || row.name,
          service_center_id: parseInt(row.hinai_service_center_id || 0),
          display_order: parseInt(row.display_order || 0),
          is_active_flag: row.is_active || "1",
          site_id: parseInt(row.site_id || 0),
          wing_id: parseInt(row.wing_id || 0),
          floor_id: parseInt(row.floor_id || 0)
        });
      })
      .on('end', async () => {
        try {
          await prisma.location.createMany({
            data: results,
            skipDuplicates: true
          });

          console.log(`✅ ${results.length} locations inserted`);
          resolve();
        } catch (err) {
          reject(err);
        }
      })
      .on('error', reject);
  });
}

/* ===============================
   MAIN SEED RUNNER
=============================== */
async function main() {
  console.log("🌱 Seeding started...");

  await seedMenuTime();
  await seedDietType();
  await seedLocationsFromCSV();

  console.log("🎉 All seeds completed successfully");
}

/* ===============================
   EXECUTION
=============================== */
main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });