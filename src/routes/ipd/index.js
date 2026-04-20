import { Router } from 'express';
import hinaiOrderRoutes from './hinaiorder.route.js';

const router = Router();

// router.use(authorize, activityLogger("IPD"));

router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'IPD module is ready',
    });
});
router.use('/hinaiorders', hinaiOrderRoutes);

export default router;