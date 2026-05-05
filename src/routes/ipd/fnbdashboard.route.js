import { Router } from 'express';
import {
    getDietOrder,
    downloadWardDietOrderCsv,
    getDietSheet,
    downloadDietSheetCsv,
    getDietSheetLiquids,
    downloadDietSheetLiquidsCsv,
    getPendingDietOrders,
    getExtraOrders,
    downloadExtraOrdersCsv,
    getLiquidData,
    downloadLiquidDataCsv
} from '../../controllers/ipd/fnbdashboard.controller.js';

const router = Router();

router.post('/diet-order', getDietOrder);
router.post('/diet-order/download', downloadWardDietOrderCsv);

router.post('/diet-sheet', getDietSheet);
router.post('/diet-sheet/download', downloadDietSheetCsv);

router.post('/diet-sheet-liquids', getDietSheetLiquids);
router.post('/diet-sheet-liquids/download', downloadDietSheetLiquidsCsv);

router.post('/pending-diet-orders', getPendingDietOrders);

router.post('/extra-orders', getExtraOrders);
router.post('/extra-orders/download', downloadExtraOrdersCsv);

router.post('/liquid-data', getLiquidData);
router.post('/liquid-data/download', downloadLiquidDataCsv);
export default router;
