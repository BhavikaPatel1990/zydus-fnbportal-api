import { Router } from 'express';
import { authorize } from '../../middleware/authorize.js';
import { getProfile } from '../../controllers/profile/profile.controller.js';

const router = Router();

router.get('/', authorize, getProfile);

export default router;
