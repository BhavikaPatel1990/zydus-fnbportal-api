import { Router } from 'express';
import { fetchInpatientsListCensus } from '../../controllers/ipd/inpatientsListCensus.controller.js';
import checkPermission from '../../middleware/checkPermission.js';

const router = Router();
/* ==========================================================================
   LIVE HINAI IPD Census List
   ========================================================================== */
router.get('/', checkPermission('FNB_PORTAL', 'READ'), fetchInpatientsListCensus);

export default router;
