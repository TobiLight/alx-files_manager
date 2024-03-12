import sha1 from 'sha1';

/**
 * Hashes a password
 * 
 * @param {String} password - The password to be hashed
 * @returns {String} - The hashed value of the password
 */
export const hashPassword = (password) => sha1(password);

export const getToken = () => { };

module.exports = { hashPassword };
