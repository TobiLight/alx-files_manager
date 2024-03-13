import { ObjectID } from 'mongodb';
import {
  mkdir, writeFile,
} from 'fs';
import { join as joinPath } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { dbClient } from '../utils/db';

const VALID_TYPES = {
  folder: 'folder',
  file: 'file',
  image: 'image',
};

const MAX_ITEMS_PER_PAGE = 20;

export const FilesController = {
  /**
     * Handles the POST /files endpoint that upload files
     *
     * @param {Express.Request} req - The Express request object.
     * @param {Express.Response} res - The Express response object.
     */
  postUpload: async (req, res) => {
    const { user } = req;

    const {
      name, type, parentId, isPublic, data,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Missing name' });

    if (!type || !Object.values(VALID_TYPES).includes(type)) return res.status(400).json({ error: 'Missing type' });

    if (!data && type !== VALID_TYPES.folder) return res.status(400).json({ error: 'Missing data' });

    if (parentId && parentId !== 0) {
      const parent = await dbClient.getFileById(ObjectID(parentId));

      if (!parent) return res.status(400).json({ error: 'Parent not found' });

      if (parent.type !== VALID_TYPES.folder) return res.status(400).json({ error: 'Parent is not a folder' });
    }

    if (type === VALID_TYPES.folder) {
      try {
        const folder = await dbClient.client.db().collection('files').insertOne({
          name,
          type,
          isPublic: isPublic || false,
          data,
          parentId: ObjectID(parentId) || 0,
          userId: ObjectID(user._id),
        });
        return res.status(201).json({
          id: folder.insertedId,
          userId: user._id.toString(),
          name,
          type,
          isPublic: isPublic || false,
          parentId: parentId || 0,
        });
      } catch (err) {
        console.log('error');
        return res.status(400).json({ error: err.message || err.toString() });
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
      isPublic: isPublic || false,
      data,
      parentId: ObjectID(parentId) || 0,
      userId: ObjectID(user._id),
      localPath,
    });

    return res.status(201).json({
      id: newFile.insertedId,
      userId: user._id.toString(),
      name,
      type,
      isPublic: isPublic || false,
      parentId: parentId || 0,
    });
  },

  /**
   * Handles the GET /files/:id endpoint to retrieve the file document based on
   * the ID
   *
   * @param {Express.Request} req - The Express request object.
   * @param {Express.Response} res - The Express response object.
   */
  getShow: async (req, res) => {
    const { user } = req;
    const { id } = req.params;
    const file = await (await dbClient.getFileCollections())
      .findOne({ _id: ObjectID(id), userId: ObjectID(user._id) });

    if (!file) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json({
      id,
      userId: user._id.toString(),
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId.toString() === '0' ? 0 : file.parentId.toString(),
    });
  },

  /**
   * Handles the GET /files endpoint to retrieve all users file documents for
   * a specific parentId
   *
   * @param {Express.Request} req - The Express request object.
   * @param {Express.Response} res - The Express response object.
   */
  getIndex: async (req, res) => {
    const { user } = req;
    const { parentId } = req.query.parentId ? req.query : { parentId: 0 };
    const page = /\d+/.test((req.query.page || '').toString())
      ? Number.parseInt(req.query.page, 10)
      : 0;

    const files = await (await (await dbClient.getFileCollections()).aggregate([
      {
        $match: {
          userId: user._id.toString(),
          parentId: parentId.toString() === '0'
            ? parseInt(parentId, 10) : parentId,
        },
      },
      { $sort: { _id: -1 } },
      { $skip: page * MAX_ITEMS_PER_PAGE },
      { $limit: MAX_ITEMS_PER_PAGE },
      {
        $project: {
          _id: 0,
          id: '$_id',
          userId: '$userId',
          name: '$name',
          type: '$type',
          isPublic: '$isPublic',
          parentId: {
            $cond: { if: { $eq: ['$parentId', '0'] }, then: 0, else: '$parentId' },
          },
        },
      },
    ])).toArray();

    return res.status(200).json(files);
  },
};

export default FilesController;
