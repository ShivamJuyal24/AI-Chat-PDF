import { clerkMiddleware, getAuth } from '@clerk/express';

/**
 * Official Clerk Express middleware (from @clerk/express). It validates the
 * request token and populates Clerk auth state for protected routes.
 */
export { clerkMiddleware, getAuth };
