import { Router } from 'express';
import canteenRoutes from './canteen/index.js';
import ipdRoutes from './ipd/index.js';
import profileRoutes from './profile/profile.route.js';
import { authorize } from '../middleware/authorize.js';
import attachUserProfile from '../middleware/attachUserProfile.js';

const router = Router();

router.get('/', (req, res) => {
    res.send('FNB API running');
});

// Session verification route
router.get('/auth/me', authorize, attachUserProfile, (req, res) => {
    res.json({
        success: true,
        user: req.userProfile,
        permissions: req.permissions,
        siteId: req.siteId
    });
});

router.use('/profile', profileRoutes);
router.use('/canteen', canteenRoutes);
router.use('/ipd', ipdRoutes);

export default router;
