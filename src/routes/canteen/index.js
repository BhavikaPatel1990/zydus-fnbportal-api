import { Router } from 'express';
import { authorize } from '../../middleware/authorize.js';
import attachUserProfile from '../../middleware/attachUserProfile.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import orderRoutes from './order.route.js';

const router = Router();

router.use(authorize);
router.use(attachUserProfile);
router.use(activityLogger('CANTEEN'));

router.use('/orders', orderRoutes);

export default router;
