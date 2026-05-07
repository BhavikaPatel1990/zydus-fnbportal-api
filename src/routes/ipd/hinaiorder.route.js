import { Router } from 'express';
import {
    createHinaiOrder,
    updateHinaiOrderDischarge,
    updateHinaiOrderTransfer,
    getHinaiOrders,
    refreshHinaiOrders,
    getHinaiOrderSummary,
    getMenuDetails,
    getHinaiOrderDetails
} from '../../controllers/ipd/hinaiorder.controller.js';

const router = Router();

router.post('/', createHinaiOrder);
router.put('/transfer', updateHinaiOrderTransfer);
router.put('/discharge', updateHinaiOrderDischarge);
router.post('/list', getHinaiOrders);

router.post('/refresh-orders', refreshHinaiOrders);

router.post('/order-summary', getHinaiOrderSummary);

router.post('/menu-details', getMenuDetails);

router.post('/order-details', getHinaiOrderDetails);

export default router;
