import { hashPassword, getUserIDFromRedisByToken } from "./utils";
import { dbClient } from "./db"
import { Request } from "express"

/**
 *
 * @param {Express.Request.headers} header - Header object from the request
 * @returns {String|undefined} - Authorization, otherwise undefined
 */
export const getAuthHeader = (header) => {
  const authorization = header.authorization || null;

  if (!authorization || !authorization.startsWith('Basic ')) return undefined;

  return authorization;
};

/**
 * Gets user credentials from authorization header.
 *
 * @param {String} authorization - Auhtorization from header
 * @returns {Object} Email & Password from the authorization
 */
export const getCredentialsFromAuth = (authorization) => {
  const base64Credentials = authorization.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8').split(':');

  const [email, password] = credentials;

  return { email, password };
};

/**
 * Retrieves X-Token from header
 * 
 * @param {String} header - The name of the header
 * @returns {String|undefined} The token set in the header, otherwise undefined
 */
export const getXTokenFromHeader = (req, header) => {
  const token = req.headers[header];
  return token;
}

/**
 * Gets a user from authorization header
 * 
 * @param {Request} req 
 * @returns The user, otherwise null
 */
export const getUserFromAuthorization = async (req) => {
  const authorization = getAuthHeader(req.headers);

  if (!authorization || !authorization.startsWith('Basic ')) return null;

  const { email, password } = getCredentialsFromAuth(authorization);

  const existingUser = await dbClient.userExists(email);

  if (!existingUser) return null;

  const user = await dbClient.getUserByEmail(email);

  if (user.password !== hashPassword(password)) return null;

  return user
}

/**
 * 
 * @param {*} req 
 * @returns {Promise<User|null>} The user, otherwise null
 */
export const getUserFromXToken = async (req) => {
  const token = getXTokenFromHeader(req, 'x-token');

  if (!token) return null;

  const userID = await getUserIDFromRedisByToken(token);

  if (!userID) return null;

  const user = await dbClient.getUserById(userID);

  if (!user) return null;

  return user;
}

module.exports = { getAuthHeader, getCredentialsFromAuth, getXTokenFromHeader, getUserFromAuthorization, getUserFromXToken };
