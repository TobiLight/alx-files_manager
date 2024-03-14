import { writeFile } from 'fs';
import { promisify } from 'util';
import Queue from 'bull/lib/queue';
import imgThumbnail from 'image-thumbnail';

const writeFileAsync = promisify(writeFile);
const fileQueue = new Queue('thumbnail generation');
const userQueue = new Queue('email sending');


/**
 * Generates the thumbnail of an image with a given size.
 * 
 * @param {String} filePath The location of the original file.
 * @param {number} size The width of the thumbnail.
 * 
 * @returns {Promise<void>}
 */
const generateThumbnail = async (filePath, size) => {
	const buffer = await imgThumbnail(filePath, { width: size });
	console.log(`Generating file: ${filePath}, size: ${size}`);
	return writeFileAsync(`${filePath}_${size}`, buffer);
};