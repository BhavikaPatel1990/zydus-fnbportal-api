import { Router } from 'express';
import canteenRoutes from './canteen/index.js';
import ipdRoutes from './ipd/index.js';
import profileRoutes from './profile/profile.route.js';

const router = Router();

router.get('/', (req, res) => {
    res.send('FNB API running');
});

router.use('/profile', profileRoutes);
router.use('/canteen', canteenRoutes);
router.use('/ipd', ipdRoutes);

export default router;
