import { Router } from 'express';
import {
    getDietOrder,
    downloadWardDietOrderCsv,
} from '../../controllers/ipd/fnbdashboard.controller.js';

const router = Router();

router.post('/diet-order', getDietOrder);
router.post('/diet-order/download', downloadWardDietOrderCsv);

export default router;
