import { Router } from 'express';
import {
    createHinaiOrder,
    updateHinaiOrderDischarge,
    updateHinaiOrderTransfer,
    getHinaiOrders,
} from '../../controllers/ipd/hinaiorder.controller.js';

const router = Router();

router.post('/', createHinaiOrder);
router.put('/transfer', updateHinaiOrderTransfer);
router.put('/discharge', updateHinaiOrderDischarge);
router.post('/list', getHinaiOrders);

router.post('/patient-order/form', hinaiOrderController.getPatientOrderFormData);

router.post('/patient-order', hinaiOrderController.createPatientOrder);

router.post('/patient-order-liquid/form', hinaiOrderController.getPatientLiquidOrderFormData);

router.post('/patient-order-liquid/timings', hinaiOrderController.getPatientLiquidOrderTimings);

router.post('/patient-order-liquid', hinaiOrderController.createPatientLiquidOrder);

router.post('/check-lock', hinaiOrderController.checkPageLock);

router.post('/release-lock', hinaiOrderController.releasePageLock);

export default router;
