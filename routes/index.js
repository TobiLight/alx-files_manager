import { Router } from 'express';

const AppController = require('../controllers/AppController');
const { UsersController } = require('../controllers/UsersController');
// import { UserController } from "../controllers/UsersController";

const router = Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

router.post("/users", UsersController.postNew)

export const AppRouter = router;
export default AppRouter;
