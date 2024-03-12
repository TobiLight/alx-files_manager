/**
 * Class representing a DB.
 * Author: Oluwatobiloba Light
 * File: redis.js
 */

const { MongoClient } = require('mongodb');
const { hashPassword } = require('./utils');

class DBClient {
  /**
   * Creates a new DB client instance.
   */
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '27017';
    this.database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useUnifiedTopology: true });

    this.clientConnected = false;

    this.client.connect().then(() => {
      this.clientConnected = true;
    }).catch((err) => console.log(err.message || err.toString()));
  }

  /**
   * Checks whether connection to MongoDB is succesful
   *
   * @returns {Boolean} true if connected, otherwise false.
   */
  isAlive() {
    return this.clientConnected;
  }

  /**
   * Asynchronously retrieves the number of documents in the "users" collection.
   *
   * @returns {Promise<number>} A promise that resolves to the number of
   * documents (integer).
   */
  async nbUsers() {
    // eslint-disable-next-line no-unused-vars
    return new Promise((resolve, _reject) => {
      resolve(this.client.db(this.database).collection('users').countDocuments());
    });
    // return this.client.db(this.database).collection('users').countDocuments();
  }

  /**
   * Asynchronously retrieves the number of documents in the "files" collection.
   *
   * @returns {Promise<number>} A promise that resolves to the number of
   * documents (integer).
   */
  async nbFiles() {
    // eslint-disable-next-line no-unused-vars
    return new Promise((resolve, _reject) => {
      resolve(this.client.db(this.database).collection('files').countDocuments());
    });
    // return this.client.db(this.database).collection('files').countDocuments();
  }

  /**
   * Asynchronously retrieves a user from the database.
   *
   * @param {String} email - User email
   * @returns {Promise<object|null>} Returns a user
   */
  async getUser(email) {
    const user = await this.client.db(this.database).collection('users')
      .findOne({ email });

    return user;
  }

  /**
   * Asynchronously checks if a user exists or not
   *
   * @param {String} email
   * @returns {Promise<Boolean>} True if user exists, otherwise false
   */
  async userExists(email) {
    const user = await this.getUser(email);

    if (!user) return false;

    return true;
  }

  /**
   * Asynchronously creates a new user
   *
   * @param {String} email - The email of the user
   * @param {String} password - The password of the user
   *
   * @returns {Promise<object>} - The created user
   */
  async createUser(email, password) {
    const user = await this.client.db(this.database).collection('users')
      .insertOne({ email, password: hashPassword(password) });

    return user;
  }
}

export const dbClient = new DBClient();
export default dbClient;
