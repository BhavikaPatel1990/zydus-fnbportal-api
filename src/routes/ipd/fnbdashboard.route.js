import { Router } from 'express';
import * as fnbDashboardController from '../../controllers/ipd/fnbdashboard.controller.js';
import checkPermission from '../../middleware/checkPermission.js';

const router = Router();

/* ==========================================================================
   DIET ORDER REPORTS
   ========================================================================== */

// Get Ward Wise Diet Orders
router.post('/diet-order', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.getDietOrder);

// Download Ward Wise Diet Orders CSV
router.post('/diet-order/download', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.downloadWardDietOrderCsv);

/* ==========================================================================
   DIET SHEET REPORTS
   ========================================================================== */

// Get Diet Sheet Data
router.post('/diet-sheet', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.getDietSheet);

// Download Diet Sheet CSV
router.post('/diet-sheet/download', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.downloadDietSheetCsv);

// Get Liquid Diet Sheet Data
router.post('/diet-sheet-liquids', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.getDietSheetLiquids);

// Download Liquid Diet Sheet CSV
router.post('/diet-sheet-liquids/download', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.downloadDietSheetLiquidsCsv);

/* ==========================================================================
   LIVE HINAI ORDER DASHBOARD
   ========================================================================== */

// Get Pending Diet Orders from HINAI
router.post('/pending-diet-orders', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.getPendingDietOrders);

/* ==========================================================================
   EXTRA ORDERS REPORTS
   ========================================================================== */

// Get Extra Orders List
router.post('/extra-orders', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.getExtraOrders);

// Download Extra Orders CSV
router.post('/extra-orders/download', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.downloadExtraOrdersCsv);

/* ==========================================================================
   LIQUID DIET REPORTS
   ========================================================================== */

// Get Liquid Diet Data
router.post('/liquid-data', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.getLiquidData);

// Download Liquid Diet Data CSV
router.post('/liquid-data/download', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.downloadLiquidDataCsv);

/* ==========================================================================
   PATIENT SEARCH & ORDER HISTORY
   ========================================================================== */

// Search Patient Details
router.post('/search-patient', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.searchPatient);

// Get Patient Order Ledger History
router.post('/patient-order-ledger', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.getPatientOrderLedger);

// Download Patient Order Ledger CSV
router.post('/patient-order-ledger/download', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.downloadPatientOrderLedgerCsv);

/* ==========================================================================
   MASTER DATA
   ========================================================================== */

// Get Available Diet Types
router.get('/diet-types', checkPermission('FNB_PORTAL', 'READ'), fnbDashboardController.getDietTypes);

export default router;