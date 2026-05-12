import { Router } from 'express';
import { fetchInpatients } from '../../controllers/ipd/inpatient.controller.js';
import checkPermission from '../../middleware/checkPermission.js';

const router = Router();

router.get('/', checkPermission('FNB_PORTAL', 'READ'), fetchInpatients);

export default router;
