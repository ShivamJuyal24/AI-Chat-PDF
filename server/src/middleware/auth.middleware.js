import { getAuth } from '../config/clerk.js';
import { ApiError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Requires a valid Clerk session token (Authorization: Bearer <jwt>) and
 * exposes the authenticated user as `req.userId` for downstream handlers.
 */
export const protectRoute = [
  (req, _res, next) => {
    const auth = getAuth(req);
    if (!auth.userId) {
      logger.warn('Clerk authentication rejected request', {
        path: req.originalUrl,
        hasAuthorization: Boolean(req.get('authorization')),
        isAuthenticated: auth.isAuthenticated,
        sessionId: auth.sessionId,
        reason: auth.reason,
        message: auth.message,
      });
      next(new ApiError(401, 'Authentication required.'));
      return;
    }

    req.auth = auth;
    req.userId = auth.userId;
    next();
  },
];
