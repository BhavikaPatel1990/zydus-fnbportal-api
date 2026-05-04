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

export default router;
