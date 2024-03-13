import sha1 from 'sha1';
import { redisClient } from './redis';

/**
 * Hashes a password
 *
 * @param {String} password - The password to be hashed
 * @returns {String} - The hashed value of the password
 */
export const hashPassword = (password) => sha1(password);

/**
 * Retrieves UserID stored in redis using token
 * @param {String} token - The token stored as a key in redis
 * @returns {Promise<String|null>} The UserID, otherwise null
 */
export const getUserIDFromRedisByToken = async (token) => {
  const userID = await redisClient.get(`auth_${token}`);
  return userID;
};

module.exports = { hashPassword, getUserIDFromRedisByToken };
