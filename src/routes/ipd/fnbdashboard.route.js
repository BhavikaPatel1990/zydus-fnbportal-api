import { Router } from 'express';
import * as fnbDashboardController from '../../controllers/ipd/fnbdashboard.controller.js';
import checkPermission from '../../middleware/checkPermission.js';

const router = Router();

router.post('/diet-order', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.getDietOrder);
router.post('/diet-order/download', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.downloadWardDietOrderCsv);

router.post('/diet-sheet', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.getDietSheet);
router.post('/diet-sheet/download', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.downloadDietSheetCsv);

router.post('/diet-sheet-liquids', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.getDietSheetLiquids);
router.post('/diet-sheet-liquids/download', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.downloadDietSheetLiquidsCsv);

// Geting Live HINAI Query Data Display
router.post('/pending-diet-orders', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.getPendingDietOrders);

router.post('/extra-orders', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.getExtraOrders);
router.post('/extra-orders/download', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.downloadExtraOrdersCsv);

router.post('/liquid-data', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.getLiquidData);
router.post('/liquid-data/download', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.downloadLiquidDataCsv);

router.post("/search-patient", checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.searchPatient);
router.post("/patient-order-ledger", checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.getPatientOrderLedger);

export default router;
