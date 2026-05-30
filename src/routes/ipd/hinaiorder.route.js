import { Router } from 'express';
import * as hinaiOrderController from '../../controllers/ipd/hinaiorder.controller.js';
import checkPermission from '../../middleware/checkPermission.js';

const router = Router();

// Merge params, query and body into req.body
router.use((req, res, next) => {
    req.body = { ...req.params, ...req.query, ...req.body };
    next();
});

/* ==========================================================================
   HINAI ORDER MANAGEMENT
   ========================================================================== */

// Create New HINAI Order
router.post('/', checkPermission('FNB_PORTAL', 'CREATE'), hinaiOrderController.createHinaiOrder);

// Update Patient Transfer Details
router.put('/transfer', checkPermission('FNB_PORTAL', 'UPDATE'), hinaiOrderController.updateHinaiOrderTransfer);

// Update Patient Discharge Details
router.put('/discharge', checkPermission('FNB_PORTAL', 'UPDATE'), hinaiOrderController.updateHinaiOrderDischarge);

// Get HINAI Orders List
router.post('/list', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.getHinaiOrders);

// Check for New Orders
router.post('/has-new-order', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.hasNewOrder);

// Get Order Summary
router.post('/order-summary', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.getHinaiOrderSummary);

// Get Menu Details
router.post('/menu-details', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.getMenuDetails);

// Get Order Details
router.post('/order-details', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.getHinaiOrderDetails);

/* ==========================================================================
   LIVE HINAI ORDER DATA GET FROM HINAI
   ========================================================================== */

// Refresh Orders from HINAI
router.post('/refresh-orders', checkPermission('FNB_PORTAL', 'UPDATE'), hinaiOrderController.refreshHinaiOrders);

// Get Nursing Remarks
router.post('/nursing-remarks', checkPermission('FNB_PORTAL', 'NURSING_MENU'), hinaiOrderController.getNursingRemarks);

/* ==========================================================================
   PATIENT ORDER MANAGEMENT
   ========================================================================== */

// Get Patient Order Form Data
router.post('/patient-order/form', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.getPatientOrderFormData);

// Create/Update Patient Food Order
router.post('/patient-order', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.createPatientOrder);

// Get Liquid Diet Form Data
router.post('/patient-order-liquid/form', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.getPatientLiquidOrderFormData);

// Get Liquid Diet Timing Details
router.post('/patient-order-liquid/timings', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.getPatientLiquidOrderTimings);

// Create Liquid Diet Order
router.post('/patient-order-liquid', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.createPatientLiquidOrder);

/* ==========================================================================
   PAGE LOCK MANAGEMENT
   ========================================================================== */

// Check Edit Page Lock Status
router.post('/check-lock', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.checkPageLock);

// Release Edit Page Lock
router.post('/release-lock', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.releasePageLock);

/* ==========================================================================
   ORDER OPERATIONS
   ========================================================================== */

// Update Diagnosis
router.post('/update-diagnosis', checkPermission('FNB_PORTAL', 'UPDATE'), hinaiOrderController.updateDiagnosis);

// Get Ward List
router.post('/wards', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.getWards);

// Get Menu List with Sticker Print Status
router.post('/order-menu-list', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.getOrderMenuListWithPrintStatus);

// Cancel Patient Order
router.post('/cancel', checkPermission('FNB_PORTAL', 'UPDATE'), hinaiOrderController.cancelPatientOrder);

// Dispatch Order
router.post('/dispatch', checkPermission('FNB_PORTAL', 'UPDATE'), hinaiOrderController.dispatchPatientOrder);

// Mark Order as Out
router.post('/out', checkPermission('FNB_PORTAL', 'UPDATE'), hinaiOrderController.outPatientOrder);

// Clear Completed Orders
router.post('/clearance', checkPermission('FNB_PORTAL', 'UPDATE'), hinaiOrderController.clearPatientOrders);

/* ==========================================================================
   STICKER PRINTING
   ========================================================================== */

// Print Single Sticker
router.post('/print/sticker', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.printPatientSticker);

// Print Selected Bulk Stickers
router.post('/print/bulk-stickers', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.printBulkStickers);

// Print All Stickers
router.post('/print/all-stickers', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.printBulkStickers);

// Print Liquid Diet Stickers
router.post('/print/liquid-stickers', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.printLiquidStickers);

/* ==========================================================================
   EXPORTS & REPORTS
   ========================================================================== */

// Export Orders CSV
router.post('/export/orders', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.downloadOrdersCsv);

// Export Out Orders CSV
router.post('/export/out-all', checkPermission('REPORTS_READ', 'READ'), hinaiOrderController.downloadOutAllOrdersCsv);

// Get Out Orders Report
router.post('/out-all-list', checkPermission('REPORTS_READ', 'READ'), hinaiOrderController.getOutAllList);

// Get Clearance Report
router.post('/clearance-list', checkPermission('REPORTS_READ', 'READ'), hinaiOrderController.getClearanceList);

// Export Clearance CSV
router.post('/export/clearance', checkPermission('REPORTS_READ', 'READ'), hinaiOrderController.downloadClearanceCsv);

/* ==========================================================================
   MASTER MENU CONFIGURATION
   ========================================================================== */

// Get Last Imported Order
router.post('/last-order', checkPermission('FNB_PORTAL', 'MASTER_MENU'), hinaiOrderController.getLastOrder);

// Update Site ID Mapping
router.post('/update-site-id', checkPermission('FNB_PORTAL', 'MASTER_MENU'), hinaiOrderController.updateSiteId);

// Get Last Punch Order
router.post('/last-punch-order', checkPermission('FNB_PORTAL', 'MASTER_MENU'), hinaiOrderController.getLastPunchOrder);

// Update Purchase Order Site ID Mapping
router.post('/update-po-site-id', checkPermission('FNB_PORTAL', 'MASTER_MENU'), hinaiOrderController.updatePOSiteId);

/* ==========================================================================
   NURSING DESK
   ========================================================================== */

// Get Diet Details for Nursing Desk
router.post('/nursing-desk/diet-details', checkPermission('FNB_PORTAL', 'NURSING_DESK'), hinaiOrderController.getNursingDeskDietDetails);

export default router;