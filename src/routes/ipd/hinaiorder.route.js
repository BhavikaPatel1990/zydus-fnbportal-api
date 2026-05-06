import { Router } from 'express';
import {
    createHinaiOrder,
    updateHinaiOrderDischarge,
    updateHinaiOrderTransfer,
    getHinaiOrders,
    refreshHinaiOrders,
} from '../../controllers/ipd/hinaiorder.controller.js';

const router = Router();

router.post('/', createHinaiOrder);
router.put('/transfer', updateHinaiOrderTransfer);
router.put('/discharge', updateHinaiOrderDischarge);
router.post('/list', getHinaiOrders);

router.post('/refresh-orders', refreshHinaiOrders);

export default router;
