import { dbClient } from '../utils/db';

export const UsersController = {
  /**
   * Handles the POST /users endpoint that adds a user to database
   *
   * @param {Express.Request} req - The Express request object.
   * @param {Express.Response} res - The Express response object.
   *
   * @returns {Object} User ID and email
 */
  async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).json({ error: 'Missing email' });

    if (!password) return res.status(400).json({ error: 'Missing password' });

    const existingUser = await dbClient.userExists(email);

    if (existingUser) return res.status(400).json({ error: 'Already exist' });

    const user = await dbClient.createUser(email, password);
    const userID = user.insertedId;

    return res.status(201).json({ id: userID, email });
  },

  /**
   * Handles the GET /users/me endpoint that retrieves a user.
   *
   * @param {Express.Request} req - The Express request object.
   * @param {Express.Response} res - The Express response object.
   *
   * @returns
   */
  async getMe(req, res) {
    const { user } = req;

    return res.status(200).json({ id: user._id, email: user.email });
  },
};

export default UsersController;
