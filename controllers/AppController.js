import { dbClient } from '../utils/db';
import { redisClient } from '../utils/redis';

/**
 * Handles the GET /status endpoint.
 * Returns the connection status of Redis & DB
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
export const getStatus = (req, res) => {
    res.status(200).json({
      redis: redisClient.isAlive(), db: dbClient.isAlive(),
    });
};

/**
 * Handles the GET /stats endpoint.
 * Get stats of files and users
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
export const getStats = async (req, res) => {
  const users = await dbClient.nbUsers();
  const files = await dbClient.nbFiles();

  console.log(users);

  res.status(200).json({
    users,
    files,
  });
  res.end();
};

module.exports = { getStats, getStatus };
