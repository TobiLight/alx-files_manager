import { v4 as uuidv4 } from 'uuid';
import { redisClient } from '../utils/redis';
import { getXTokenFromHeader } from '../utils/auth';

export const AuthController = {
  /**
   * Handles the GET /connect endpoint that signs in a user and returns a
   * token upon successful authentication.
   *
   * @param {Express.Request} req - The Express request object.
   * @param {Express.Response} res - The Express response object.
   *
   * @returns Resolves with an empty response on success, rejects with an
   * error otherwise.
   */
  getConnect: async (req, res) => {
    const { user } = req;
    const token = uuidv4();
    const auth = `auth_${token}`;

    await redisClient.set(auth, user._id.toString(), 60 * 60 * 24);

    return res.status(200).json({ token });
  },

  /**
   * Handles the GET /disconnect endpoint that signs out a user
   *
   * @param {Express.Request} req - The Express request object.
   * @param {Express.Response} res - The Express response object.
   *
   * @returns {void} Unauthorized, otherwise void
   */
  getDisconnect: async (req, res) => {
    const token = getXTokenFromHeader('x-token');

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    await redisClient.del(`auth_${token}`);

    return res.status(204).json();
  },

};

export default AuthController;
