import { Router } from 'express';
import * as hinaiOrderController from '../../controllers/ipd/hinaiorder.controller.js';

const router = Router();

router.post('/', hinaiOrderController.createHinaiOrder);
router.put('/transfer', hinaiOrderController.updateHinaiOrderTransfer);
router.put('/discharge', hinaiOrderController.updateHinaiOrderDischarge);
router.post('/list', hinaiOrderController.getHinaiOrders);

router.post('/refresh-orders', hinaiOrderController.refreshHinaiOrders);

router.post('/order-summary', hinaiOrderController.getHinaiOrderSummary);

router.post('/menu-details', hinaiOrderController.getMenuDetails);

router.post('/order-details', hinaiOrderController.getHinaiOrderDetails);

router.post('/nursing-remarks', hinaiOrderController.getNursingRemarks);

router.post('/patient-order/form', hinaiOrderController.getPatientOrderFormData);

router.post('/patient-order', hinaiOrderController.createPatientOrder);

router.post('/patient-order-liquid/form', hinaiOrderController.getPatientLiquidOrderFormData);

router.post('/patient-order-liquid/timings', hinaiOrderController.getPatientLiquidOrderTimings);

router.post('/patient-order-liquid', hinaiOrderController.createPatientLiquidOrder);

router.post('/check-lock', hinaiOrderController.checkPageLock);

router.post('/release-lock', hinaiOrderController.releasePageLock);

export default router;
