import { v4 as uuidv4 } from 'uuid';
import { dbClient } from '../utils/db';
import { redisClient } from '../utils/redis';
import { hashPassword } from '../utils/utils';
import { getAuthHeader, getCredentialsFromAuth } from '../utils/auth';

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
    const authorization = getAuthHeader(req.headers);

    if (!authorization || !authorization.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { email, password } = getCredentialsFromAuth(authorization);

    const existingUser = await dbClient.userExists(email);

    if (!existingUser) return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.getUserByEmail(email);

    if (user.password !== hashPassword(password)) return res.status(401).json({ error: 'Unauthorized' });

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
    const token = req.headers['x-token'];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userID = await redisClient.get(`auth_${token}`);

    if (!userID) return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.getUserById(userID);

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    await redisClient.del(`auth_${token}`);

    return res.status(204).json();
  },

};

export default AuthController;
