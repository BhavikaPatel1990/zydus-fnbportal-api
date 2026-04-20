import { Router } from 'express';
import { authorize } from '../../middleware/authorize.js';
import { activityLogger } from '../../middleware/activityLogger.js';

const router = Router();

router.use(authorize, activityLogger("IPD"));

router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'IPD module is ready',
    });
});

export default router;