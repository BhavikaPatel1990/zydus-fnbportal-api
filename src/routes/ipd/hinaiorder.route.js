import { Router } from 'express';
import * as hinaiOrderController from '../../controllers/ipd/hinaiorder.controller.js';
import checkPermission from '../../middleware/checkPermission.js';

const router = Router();

router.post('/', checkPermission('FNB_PORTAL', 'CREATE'), hinaiOrderController.createHinaiOrder);

router.put('/transfer', checkPermission('FNB_PORTAL', 'UPDATE'), hinaiOrderController.updateHinaiOrderTransfer);

router.put('/discharge', checkPermission('FNB_PORTAL', 'UPDATE'), hinaiOrderController.updateHinaiOrderDischarge);

router.post('/list', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.getHinaiOrders);

router.post('/refresh-orders', checkPermission('FNB_PORTAL', 'UPDATE'), hinaiOrderController.refreshHinaiOrders);

router.post('/order-summary', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.getHinaiOrderSummary);

router.post('/menu-details', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.getMenuDetails);

router.post('/order-details', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.getHinaiOrderDetails);

router.post('/nursing-remarks', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.getNursingRemarks);

router.post('/patient-order/form', checkPermission('FNB_PORTAL', 'READ'),hinaiOrderController.getPatientOrderFormData);

router.post('/patient-order', checkPermission('FNB_PORTAL', 'READ'),hinaiOrderController.createPatientOrder);

router.post('/patient-order-liquid/form',checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.getPatientLiquidOrderFormData);

router.post('/patient-order-liquid/timings',checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.getPatientLiquidOrderTimings);

router.post('/patient-order-liquid',checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.createPatientLiquidOrder);

router.post('/check-lock', checkPermission('FNB_PORTAL', 'READ'),hinaiOrderController.checkPageLock);

router.post('/release-lock',checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.releasePageLock);

router.post('/update-diagnosis', checkPermission('FNB_PORTAL', 'UPDATE'), hinaiOrderController.updateDiagnosis);

router.post('/dispatch', checkPermission('FNB_PORTAL', 'UPDATE'), hinaiOrderController.dispatchPatientOrder);

router.post('/out', checkPermission('FNB_PORTAL', 'UPDATE'), hinaiOrderController.outPatientOrder);

router.post('/clearance', checkPermission('FNB_PORTAL', 'UPDATE'), hinaiOrderController.clearPatientOrders);

router.post('/wards', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.getWards);

router.post('/order-menu-list', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.getOrderMenuListWithPrintStatus);

router.post('/cancel', checkPermission('FNB_PORTAL', 'UPDATE'), hinaiOrderController.cancelPatientOrder);

router.post('/export/orders', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.downloadOrdersCsv);

router.post('/export/out-all', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.downloadOutAllOrdersCsv);

router.post('/print/sticker', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.printPatientSticker);
router.post('/print/bulk-stickers', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.printBulkStickers);
router.post('/print/liquid-stickers', checkPermission('FNB_PORTAL', 'READ'), hinaiOrderController.printLiquidStickers);

export default router;

