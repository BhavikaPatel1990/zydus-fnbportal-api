import { Router } from 'express';
import {
    getDietOrder,
    downloadWardDietOrderCsv,
    getDietSheet,
    downloadDietSheetCsv,
    getDietSheetLiquids,
    downloadDietSheetLiquidsCsv,
    getPendingDietOrders,
} from '../../controllers/ipd/fnbdashboard.controller.js';

const router = Router();

router.post('/diet-order', getDietOrder);
router.post('/diet-order/download', downloadWardDietOrderCsv);
router.post('/diet-sheet', getDietSheet);
router.post('/diet-sheet/download', downloadDietSheetCsv);
router.post('/diet-sheet-liquids', getDietSheetLiquids);
router.post('/diet-sheet-liquids/download', downloadDietSheetLiquidsCsv);

router.post('/pending-diet-orders', getPendingDietOrders);
export default router;
