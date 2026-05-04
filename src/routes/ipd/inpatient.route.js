import { Router } from 'express';
import { fetchInpatients } from '../../controllers/ipd/inpatient.controller.js';

const router = Router();

router.get('/', fetchInpatients);

export default router;
