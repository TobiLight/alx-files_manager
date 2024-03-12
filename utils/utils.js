import sha1 from 'sha1';

export const hashPassword = (password) => sha1(password);

export const getToken = () => { };

module.exports = { hashPassword };
