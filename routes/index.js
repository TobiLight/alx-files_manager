import { Router } from 'express';

const AppController = require('../controllers/AppController');
// const { UserController } = require('../controllers/UserController');
import { UserController } from "../controllers/UserController";

const router = Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

router.post("/users", UserController.postNew)

export const AppRouter = router;
export default AppRouter;
