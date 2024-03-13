import { Router } from 'express';

const AppController = require('../controllers/AppController');
const { UsersController } = require('../controllers/UsersController');
const { AuthController } = require('../controllers/AuthController');
const { FilesController } = require('../controllers/FilesController');
// import { UserController } from "../controllers/UsersController";

const router = Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

router.post('/users', UsersController.postNew);
router.get('/users/me', UsersController.getMe);

router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);

router.post('/files', FilesController.postUpload);

export const AppRouter = router;
export default AppRouter;
