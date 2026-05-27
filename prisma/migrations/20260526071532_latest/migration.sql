/*
  Warnings:

  - A unique constraint covering the columns `[diet_type_id]` on the table `DietType` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "MenuTime_description_key";

-- AlterTable
ALTER TABLE "HinaiOrder" ALTER COLUMN "clearance_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "PatientOrder" ALTER COLUMN "dispatched_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "PatientOrderDetail" ALTER COLUMN "ptm_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "PatientOrderLiquid" ALTER COLUMN "ptm_id" DROP NOT NULL,
ALTER COLUMN "ptm_id" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DietType_diet_type_id_key" ON "DietType"("diet_type_id");

-- CreateIndex
CREATE INDEX "DietType_diet_type_id_idx" ON "DietType"("diet_type_id");

-- CreateIndex
CREATE INDEX "HinaiOrder_mst_id_is_discharge_patient_id_order_id_idx" ON "HinaiOrder"("mst_id", "is_discharge", "patient_id", "order_id" DESC);

-- CreateIndex
CREATE INDEX "HinaiOrder_mst_id_diet_type_idx" ON "HinaiOrder"("mst_id", "diet_type");

-- CreateIndex
CREATE INDEX "HinaiOrder_order_date_idx" ON "HinaiOrder"("order_date");

-- CreateIndex
CREATE INDEX "PatientOrder_diet_type_idx" ON "PatientOrder"("diet_type");

-- CreateIndex
CREATE INDEX "PatientOrderDetail_ptm_id_idx" ON "PatientOrderDetail"("ptm_id");

-- CreateIndex
CREATE INDEX "PatientOrderLiquid_ptm_id_idx" ON "PatientOrderLiquid"("ptm_id");

-- AddForeignKey
ALTER TABLE "PatientOrder" ADD CONSTRAINT "PatientOrder_hinai_order_id_fkey" FOREIGN KEY ("hinai_order_id") REFERENCES "HinaiOrder"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientOrder" ADD CONSTRAINT "PatientOrder_diet_type_fkey" FOREIGN KEY ("diet_type") REFERENCES "DietType"("diet_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientOrderDetail" ADD CONSTRAINT "PatientOrderDetail_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "PatientOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientOrderDetail" ADD CONSTRAINT "PatientOrderDetail_ptm_id_fkey" FOREIGN KEY ("ptm_id") REFERENCES "MenuTime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientOrderLiquid" ADD CONSTRAINT "PatientOrderLiquid_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "PatientOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientOrderLiquid" ADD CONSTRAINT "PatientOrderLiquid_ptm_id_fkey" FOREIGN KEY ("ptm_id") REFERENCES "MenuTime"("id") ON DELETE SET NULL ON UPDATE CASCADE;
