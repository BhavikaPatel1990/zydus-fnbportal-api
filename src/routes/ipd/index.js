import { Router } from 'express';
import hinaiOrderRoutes from './hinaiorder.route.js';
import inpatientRoutes from './inpatient.route.js';
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
    router.use('/hinaiorders', hinaiOrderRoutes);
    router.use('/inpatients', inpatientRoutes);

    export default router;