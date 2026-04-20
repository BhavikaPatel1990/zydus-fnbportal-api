import { Router } from 'express';
import orderRoutes from './order.route.js';

const router = Router();

router.use('/orders', orderRoutes);

export default router;
