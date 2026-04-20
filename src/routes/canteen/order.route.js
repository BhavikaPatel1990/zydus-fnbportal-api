import { Router } from 'express';
import { authorize } from '../../middleware/authorize.js';
import checkPermission from '../../middleware/checkPermission.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrder,
    deleteOrder
} from '../../controllers/canteen/order.controller.js';

const router = Router();

router.use(authorize, activityLogger("FNB_PORTAL"));

router.get('/', checkPermission('FNB_PORTAL', 'READ'), getAllOrders);
router.get('/:id', checkPermission('FNB_PORTAL', 'READ'), getOrderById);
router.post('/', checkPermission('FNB_PORTAL', 'CREATE'), createOrder);
router.put('/:id', checkPermission('FNB_PORTAL', 'UPDATE'), updateOrder);
router.delete('/:id', checkPermission('FNB_PORTAL', 'DELETE'), deleteOrder);

export default router;
