/**
 * Class representing a DB.
 * Author: Oluwatobiloba Light
 * File: redis.js
 */

const { MongoClient, ObjectID } = require('mongodb');
const { hashPassword } = require('./utils');

class DBClient {
  /**
   * Creates a new DB client instance.
   */
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '27017';
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}/${database}`;

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
      resolve(this.client.db().collection('users').countDocuments());
    });
    // return this.client.db().collection('users').countDocuments();
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
      resolve(this.client.db().collection('files').countDocuments());
    });
    // return this.client.db().collection('files').countDocuments();
  }

  /**
   * Asynchronously retrieves a user by email from the database.
   *
   * @param {String} email - User email
   * @returns {Promise<object|null>} Returns a user
   */
  async getUserByEmail(email) {
    const user = await this.client.db().collection('users')
      .findOne({ email });

    return user;
  }

  /**
   * Asynchronously retrieves a user by ID from the database.
   *
   * @param {String} userID - User ID
   * @returns {Promise<object|null>} Returns a user
   */
  async getUserById(userID) {
    const _id = new ObjectID(userID);
    const user = await this.client.db().collection('users')
      .findOne({ _id });

    return user;
  }

  /**
   * Asynchronously checks if a user exists or not
   *
   * @param {String} email
   * @returns {Promise<Boolean>} True if user exists, otherwise false
   */
  async userExists(email) {
    const user = await this.getUserByEmail(email);

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
    const user = await this.client.db().collection('users')
      .insertOne({ email, password: hashPassword(password) });

    return user;
  }

  /**
   *
   */
  async getFileCollections() {
    const files = await this.client.db().collection('files');
    return files;
  }

  /**
  *
  */
  async getUserCollections() {
    const users = await this.client.db().collection('users');
    return users;
  }

  /**
   * Asynchronously retrieves a file by its id.
   *
   * @param {*} fileID - ID of the file
   *
   * @returns {Object} The file
   */
  async getFileById(fileID) {
    const file = await this.client.db().collection('files')
      .findOne({ _id: fileID });

    return file;
  }
}

export const dbClient = new DBClient();
export default dbClient;
