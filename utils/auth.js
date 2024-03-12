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

module.exports = { getAuthHeader, getCredentialsFromAuth };
