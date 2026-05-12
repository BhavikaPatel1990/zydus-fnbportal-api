-- CreateTable
CREATE TABLE "CurrentlyEditing" (
    "id" TEXT NOT NULL,
    "page_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "po_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CurrentlyEditing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietType" (
    "id" TEXT NOT NULL,
    "diet_type_id" INTEGER NOT NULL,
    "diet_name" TEXT NOT NULL,
    "from_time" TIMESTAMP(3) NOT NULL,
    "to_time" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DietType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HinaiOrder" (
    "id" TEXT NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "mr_no" BIGINT NOT NULL,
    "patient_name" TEXT NOT NULL,
    "admission_no" TEXT NOT NULL,
    "admission_at" TIMESTAMP(3) NOT NULL,
    "bed_no" TEXT NOT NULL,
    "ward" TEXT NOT NULL,
    "doctor" TEXT NOT NULL,
    "menu" TEXT NOT NULL,
    "menu_detail" TEXT NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL,
    "time_diff" INTEGER NOT NULL,
    "diet_type" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL,
    "nurse_remark" TEXT,
    "is_discharge" BOOLEAN NOT NULL,
    "nursing_user" TEXT NOT NULL,
    "is_diet_change" BOOLEAN NOT NULL,
    "is_transfer" BOOLEAN NOT NULL,
    "age_gender" TEXT NOT NULL,
    "mobile_no" TEXT,
    "email" TEXT,
    "mst_id" BIGINT,
    "clearance" BOOLEAN,
    "out_time" TEXT,
    "out_by" TEXT,
    "remarks" TEXT,
    "clearance_time" TEXT,
    "clearance_by" BIGINT,
    "diagnosis" TEXT,
    "approved_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HinaiOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "service_center_id" INTEGER NOT NULL,
    "display_order" INTEGER NOT NULL,
    "is_active_flag" TEXT NOT NULL,
    "mst_id" INTEGER,
    "wing_id" INTEGER NOT NULL,
    "floor_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuTime" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MenuTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientOrder" (
    "id" TEXT NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "diet_type" INTEGER NOT NULL,
    "nursing_remark" TEXT NOT NULL,
    "diet_remark" TEXT NOT NULL,
    "dispatched" BOOLEAN,
    "dispatched_by" INTEGER,
    "dispatched_at" TIMESTAMP(3),
    "hinai_order_id" INTEGER NOT NULL,
    "is_cancelled" BOOLEAN,
    "liquid_hours" INTEGER NOT NULL,
    "mst_id" BIGINT,
    "mail_flag" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PatientOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientOrderDetail" (
    "id" TEXT NOT NULL,
    "po_id" TEXT NOT NULL,
    "ptm_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "remarks" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PatientOrderDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientOrderLiquid" (
    "id" TEXT NOT NULL,
    "po_id" TEXT NOT NULL,
    "ptm_id" INTEGER NOT NULL,
    "liquid_time" INTEGER NOT NULL,
    "remarks" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PatientOrderLiquid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientDiagnosis" (
    "id" TEXT NOT NULL,
    "mr_no" TEXT NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "hinai_order_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PatientDiagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StickerPrintStatus" (
    "id" TEXT NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "po_id" INTEGER NOT NULL,
    "menu_time_id" INTEGER NOT NULL,
    "print_done" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StickerPrintStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CurrentlyEditing_page_id_idx" ON "CurrentlyEditing"("page_id");

-- CreateIndex
CREATE UNIQUE INDEX "HinaiOrder_order_id_key" ON "HinaiOrder"("order_id");

-- CreateIndex
CREATE INDEX "HinaiOrder_patient_id_idx" ON "HinaiOrder"("patient_id");

-- CreateIndex
CREATE INDEX "HinaiOrder_mst_id_idx" ON "HinaiOrder"("mst_id");

-- CreateIndex
CREATE INDEX "Location_mst_id_idx" ON "Location"("mst_id");

-- CreateIndex
CREATE UNIQUE INDEX "MenuTime_description_key" ON "MenuTime"("description");

-- CreateIndex
CREATE INDEX "PatientOrder_patient_id_idx" ON "PatientOrder"("patient_id");

-- CreateIndex
CREATE INDEX "PatientOrder_hinai_order_id_idx" ON "PatientOrder"("hinai_order_id");

-- CreateIndex
CREATE INDEX "PatientOrderDetail_po_id_idx" ON "PatientOrderDetail"("po_id");

-- CreateIndex
CREATE INDEX "PatientOrderLiquid_po_id_idx" ON "PatientOrderLiquid"("po_id");

-- CreateIndex
CREATE INDEX "PatientDiagnosis_patient_id_idx" ON "PatientDiagnosis"("patient_id");

-- CreateIndex
CREATE INDEX "StickerPrintStatus_patient_id_idx" ON "StickerPrintStatus"("patient_id");

-- CreateIndex
CREATE INDEX "StickerPrintStatus_po_id_idx" ON "StickerPrintStatus"("po_id");
