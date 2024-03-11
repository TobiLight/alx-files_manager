/**
 * Class representing a DB.
 * Author: Oluwatobiloba Light
 * File: redis.js
 */

import { MongoClient } from 'mongodb';

class DBClient {
  /**
   * Creates a new DB client instance.
   */
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
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
    const dbClient = await this.client.connect();
    return dbClient.db(this.database).collection('users').countDocuments();
  }

  /**
   * Asynchronously retrieves the number of documents in the "files" collection.
   *
   * @returns {Promise<number>} A promise that resolves to the number of
   * documents (integer).
   */
  async nbFiles() {
    const dbClient = await this.client.connect();
    return dbClient.db(this.database).collection('files').countDocuments();
  }
}

export const dbClient = new DBClient();
export default dbClient;
