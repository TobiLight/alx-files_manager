import { ObjectID } from 'mongodb';
import {
  mkdir, writeFile,
} from 'fs';
import { join as joinPath } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { redisClient } from '../utils/redis';
import { dbClient } from '../utils/db';

const VALID_TYPES = {
  folder: 'folder',
  file: 'file',
  image: 'image',
};

export const FilesController = {
  /**
     * Handles the POST /files endpoint that upload files
     *
     * @param {Express.Request} req - The Express request object.
     * @param {Express.Response} res - The Express response object.
     */
  postUpload: async (req, res) => {
    const token = req.headers['x-token'];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userID = await redisClient.get(`auth_${token}`);

    if (!userID) return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.getUserById(userID);

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name, type, parentId, isPublic, data,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Missing name' });

    if (!type || !Object.values(VALID_TYPES).includes(type)) return res.status(400).json({ error: 'Missing type' });

    if (!data && type !== VALID_TYPES.folder) return res.status(400).json({ error: 'Missing data' });

    if (parentId && parentId !== 0) {
      const parent = await dbClient.getFileById(new ObjectID(parentId));

      if (!parent) return res.status(400).json({ error: 'Parent not found' });

      if (parent.type && parent.type !== VALID_TYPES.folder) return res.status(400).json({ error: 'Parent is not a folder' });
    }

    if (type === VALID_TYPES.folder) {
      try {
        const folder = await dbClient.client.db().collection('files').insertOne({
          name,
          type,
          isPublic,
          data,
          parentId: new ObjectID(parentId) || 0,
          userId: user._id,
        });
        return res.status(201).json({
          id: folder.insertedId,
          userId: user._id,
          name,
          type,
          isPublic: isPublic || false,
          parentId: parentId || 0,
        });
      } catch (err) {
        console.log('error');
        return res.status(400).json({ error: err.message || err.toString() })
      }
    }

    const baseDir = `${process.env.FOLDER_PATH || ''}`.trim().length > 0
      ? process.env.FOLDER_PATH.trim()
      : joinPath(tmpdir(), '/files_manager');

    mkdir(baseDir, { recursive: true },
      // eslint-disable-next-line consistent-return
      (error) => {
        if (error) return res.status(400).json({ error: error.message || error.toString() });
      });

    const newFileID = uuidv4();
    const localPath = joinPath(baseDir, newFileID);

    const buffer = Buffer.from(data, 'base64');
    writeFile(
      localPath,
      buffer,
      // eslint-disable-next-line consistent-return
      (err) => {
        if (err) {
          return res.status(400).json({ error: err.message });
        }
      },
    );

    const newFile = await dbClient.client.db().collection('files').insertOne({
      name,
      type,
      isPublic,
      data,
      parentId: new ObjectID(parentId) || 0,
      userId: user._id,
      localPath,
    });

    return res.status(201).json({
      id: newFile.insertedId,
      userId: user._id,
      name,
      type,
      isPublic: isPublic || false,
      parentId: parentId || 0,
    });
  },
};

export default FilesController;
