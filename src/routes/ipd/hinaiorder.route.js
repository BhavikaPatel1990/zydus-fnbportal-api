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

router.post('/patient-order/form', hinaiOrderController.getPatientOrderFormData);

router.post('/patient-order', hinaiOrderController.createPatientOrder);

router.post('/patient-order-liquid/form', hinaiOrderController.getPatientLiquidOrderFormData);

router.post('/patient-order-liquid/timings', hinaiOrderController.getPatientLiquidOrderTimings);

router.post('/patient-order-liquid', hinaiOrderController.createPatientLiquidOrder);

router.post('/check-lock', hinaiOrderController.checkPageLock);

router.post('/release-lock', hinaiOrderController.releasePageLock);

export default router;
