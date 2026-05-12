import { Router } from 'express';
import * as fnbDashboardController from '../../controllers/ipd/fnbdashboard.controller.js';

const router = Router();

router.post('/diet-order', fnbDashboardController.getDietOrder);
router.post('/diet-order/download', fnbDashboardController.downloadWardDietOrderCsv);

router.post('/diet-sheet', fnbDashboardController.getDietSheet);
router.post('/diet-sheet/download', fnbDashboardController.downloadDietSheetCsv);

router.post('/diet-sheet-liquids', fnbDashboardController.getDietSheetLiquids);
router.post('/diet-sheet-liquids/download', fnbDashboardController.downloadDietSheetLiquidsCsv);

router.post('/pending-diet-orders', fnbDashboardController.getPendingDietOrders);

router.post('/extra-orders', fnbDashboardController.getExtraOrders);
router.post('/extra-orders/download', fnbDashboardController.downloadExtraOrdersCsv);

router.post('/liquid-data', fnbDashboardController.getLiquidData);
router.post('/liquid-data/download', fnbDashboardController.downloadLiquidDataCsv);

router.post("/search-patient", fnbDashboardController.searchPatient);
router.post("/patient-order-ledger", fnbDashboardController.getPatientOrderLedger);

export default router;
