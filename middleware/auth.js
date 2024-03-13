import { Request, Response, NextFunction } from 'express';
import { getUserFromAuthorization, getUserFromXToken, getXTokenFromHeader } from '../utils/auth';
import { getUserIDFromRedisByToken } from '../utils/utils';
import { dbClient } from '../utils/db';

/**
 * Applies Basic authentication to a route.
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The Express next function.
 */
export const basicAuthenticate = async (req, res, next) => {
	const user = await getUserFromAuthorization(req);

	if (!user) return res.status(401).json({ error: "Unauthorized" })

	req.user = user;

	next();
};

export const xTokenAuthenticate = async (req, res, next) => {
	const user = await getUserFromXToken(req);

	if (!user) return res.status(401).json({ error: "Unauthorized" })

	req.user = user;

	next();
}