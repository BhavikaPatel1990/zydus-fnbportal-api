import { Router } from 'express';

import hinaiOrderRoutes from './hinaiorder.route.js';
import inpatientsListCensusRoutes from './inpatientsListCensusRoutes.route.js';
import fnbDashboardRoutes from './fnbdashboard.route.js';

import { authorize } from '../../middleware/authorize.js';
import attachUserProfile from '../../middleware/attachUserProfile.js';
import { activityLogger } from '../../middleware/activityLogger.js';

const router = Router();

/* HEALTH */
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'IPD module is ready',
    });
});

/* MIDDLEWARE */
router.use(authorize);
router.use(attachUserProfile);
router.use(activityLogger('IPD'));

/* ROUTES */
router.use('/hinaiorders', hinaiOrderRoutes);
router.use('/fnbdashboard', fnbDashboardRoutes);
router.use('/inpatient-list-census', inpatientsListCensusRoutes);

export default router;