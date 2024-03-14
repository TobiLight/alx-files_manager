import { ObjectId } from 'mongodb';
import {
  mkdir, writeFile, existsSync, realpath,
  stat,
} from 'fs';
import { join as joinPath } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { lookup } from 'mime-types';
import { promisify } from 'util';
import Queue from 'bull/lib/queue';
import { dbClient } from '../utils/db';
import { getXTokenFromHeader } from '../utils/auth';

const fileQueue = new Queue('thumbnail generation');

const VALID_TYPES = {
  folder: 'folder',
  file: 'file',
  image: 'image',
};

const MAX_ITEMS_PER_PAGE = 20;

const isValidId = (id) => {
  const size = 24;
  let i = 0;
  const charRanges = [
    [48, 57], // 0 - 9
    [97, 102], // a - f
    [65, 70], // A - F
  ];
  if (typeof id !== 'string' || id.length !== size) {
    return false;
  }
  while (i < size) {
    const c = id[i];
    const code = c.charCodeAt(0);

    if (!charRanges.some((range) => code >= range[0] && code <= range[1])) {
      return false;
    }
    i += 1;
  }
  return true;
};

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
      const parent = await dbClient.getFileById(ObjectId(parentId));

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
          parentId: parentId ? new ObjectId(parentId) : 0,
          userId: new ObjectId(user._id),
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
      parentId: parentId ? new ObjectId(parentId) : 0,
      userId: new ObjectId(user._id),
      localPath,
    });

    // start thumbnail generation worker
    if (type === VALID_TYPES.image) {
      const jobName = `Image thumbnail [${user._id.toString()}-${newFile.insertedId.toString()}]`;
      fileQueue
        .add({ userId: user._id.toString(), fileId: newFile.insertedId.toString(), name: jobName });
    }

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
      .findOne({
        _id: id === '0' ? Buffer.alloc(24, '0').toString('utf-8')
          : ObjectId(id),
        userId: ObjectId(user._id),
      });

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

    if (parentId === '0' || parentId === 0) {
      const files = await (await (await dbClient.getFileCollections()).aggregate([
        { $match: { userId: ObjectId(user._id) } },
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
              $cond: { if: { $eq: ['$parentId', 0] }, then: 0, else: '$parentId' },
            },
          },
        },
      ])).toArray();

      return res.status(200).json(files);
    }

    const files = await (await (await dbClient.getFileCollections()).aggregate([
      {
        $match: {
          userId: ObjectId(user._id),
          parentId: ObjectId(parentId),
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
          parentId: '$parentId',
        },
      },
    ])).toArray();

    return res.status(200).json(files);
  },

  /**
   * Handles the PUT /files/:id/publish endpoint to make a file public
   *
   * @param {Express.Request} req - The Express request object.
   * @param {Express.Response} res - The Express response object.
   */
  putPublish: async (req, res) => {
    const { user } = req;
    const { id } = req.params;

    const file = await (await dbClient.getFileCollections())
      .findOne({
        _id: ObjectId(isValidId(id) ? id : Buffer.alloc(24, '0').toString('utf-8')),
        userId: ObjectId(user._id),
      });

    if (!file) return res.status(404).json({ error: 'Not found' });

    await (await dbClient.getFileCollections()).updateOne({
      _id: ObjectId(id), userId: ObjectId(user._id),
    }, { $set: { isPublic: true } });

    return res.status(200).json({
      id,
      userId: user._id.toString(),
      name: file.name,
      type: file.type,
      isPublic: true,
      parentId: file.parentId.toString() === '0'
        ? 0
        : file.parentId.toString(),
    });
  },

  /**
   * Handles the PUT /files/:id/unpublish endpoint to make a file private
   *
   * @param {Express.Request} req - The Express request object.
   * @param {Express.Response} res - The Express response object.
   */
  putUnpublish: async (req, res) => {
    const { user } = req;
    const { id } = req.params;

    const file = await (await dbClient.getFileCollections())
      .findOne({
        _id: ObjectId(isValidId(id) ? id : Buffer.alloc(24, '0').toString('utf-8')),
        userId: ObjectId(user._id),
      });

    if (!file) return res.status(404).json({ error: 'Not found' });

    await (await dbClient.getFileCollections()).updateOne({
      _id: ObjectId(id), userId: ObjectId(user._id),
    }, { $set: { isPublic: false } });

    return res.status(200).json({
      id,
      userId: user._id.toString(),
      name: file.name,
      type: file.type,
      isPublic: false,
      parentId: file.parentId.toString() === '0'
        ? 0
        : file.parentId.toString(),
    });
  },

  /**
   * Handles the GET /files/:id/data endpoint to return the content of
   * the file document based on the ID
   *
   * @param {Express.Request} req - The Express request object.
   * @param {Express.Response} res - The Express response object.
  */
  // eslint-disable-next-line consistent-return
  getFile: async (req, res) => {
    const { user } = getXTokenFromHeader(req, 'x-token');
    const { id } = req.params;

    const file = await (await dbClient.getFileCollections())
      .findOne({
        _id: ObjectId(isValidId(id) ? id : Buffer.alloc(24, '0').toString('utf-8')),
      });

    if (!file || (!file.isPublic && user && file.userId.toString() !== user._id.toString())) return res.status(404).json({ error: 'Not found' });

    if (file === VALID_TYPES.folder) return res.status(400).json({ error: "A folder doesn't have content" });

    // if (!existsSync(file.localPath)) return res.status(404).json({ error: 'Not found' });

    const statAsync = promisify(stat);

    if (existsSync(file.localPath)) {
      const fileInfo = await statAsync(file.localPath);
      if (!fileInfo.isFile()) return res.status(404).json({ error: 'Not found' });
    } else {
      return res.status(404).json({ error: 'Not found' });
    }

    const realpathasync = promisify(realpath);

    const fileContent = await realpathasync(file.localPath);

    const mimeType = lookup(file.name);

    res.setHeader('Content-Type', mimeType || 'text/plain; charset=utf-8');

    return res.status(200).sendFile(fileContent);
  },
};

export default FilesController;
