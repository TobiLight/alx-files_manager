import { dbClient } from "../utils/db";

export const UsersController = {
  /**
 * Handles the POST /users endpoint that adds a user to database
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
  async postNew(req, res) {
    const { email, password } = req.body;

    if (!email)
      return res.status(400).json({ error: "Missing email" });

    if (!password)
      return res.status(400).json({ error: "Missing password" })

    const existingUser = await dbClient.userExists(email)

    if (existingUser)
      return res.status(400).json({ error: "Already exist" })

    const user = await dbClient.createUser(email, password)
    const userID = user.insertedId

    return res.status(201).json({ id: userID, email })
  },
}

export default UsersController;