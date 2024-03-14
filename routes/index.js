import { Router } from 'express';
import { basicAuthenticate, xTokenAuthenticate } from '../middleware/auth';

const AppController = require('../controllers/AppController');
const { UsersController } = require('../controllers/UsersController');
const { AuthController } = require('../controllers/AuthController');
const { FilesController } = require('../controllers/FilesController');
// import { UserController } from "../controllers/UsersController";

const router = Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

router.post('/users', UsersController.postNew);
router.get('/users/me', xTokenAuthenticate, UsersController.getMe);

router.get('/connect', basicAuthenticate, AuthController.getConnect);
router.get('/disconnect', xTokenAuthenticate, AuthController.getDisconnect);

router.post('/files', xTokenAuthenticate, FilesController.postUpload);
router.get('/files/:id', xTokenAuthenticate, FilesController.getShow);
router.get('/files', xTokenAuthenticate, FilesController.getIndex);
router.put('/files/:id/publish', xTokenAuthenticate, FilesController.putPublish);
router.put('/files/:id/unpublish', xTokenAuthenticate, FilesController.putUnpublish);
router.get('/files/:id/data', FilesController.getFile);

export const AppRouter = router;
export default AppRouter;
