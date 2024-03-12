import { Router } from 'express';

const AppController = require('../controllers/AppController');

const router = Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

export const AppRouter = router;
export default AppRouter;
