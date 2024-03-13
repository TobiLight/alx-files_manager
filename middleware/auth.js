import { getUserFromAuthorization, getUserFromXToken } from '../utils/auth';

/**
 * Applies Basic authentication to a route.
 * @param {Express.Request} req The Express request object.
 * @param {Express.Response} res The Express response object.
 * @param {Express.NextFunction} next The Express next function.
 */
// eslint-disable-next-line consistent-return
export const basicAuthenticate = async (req, res, next) => {
  const user = await getUserFromAuthorization(req);

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  req.user = user;

  next();
};

// eslint-disable-next-line consistent-return
export const xTokenAuthenticate = async (req, res, next) => {
  const user = await getUserFromXToken(req);

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  req.user = user;

  next();
};
