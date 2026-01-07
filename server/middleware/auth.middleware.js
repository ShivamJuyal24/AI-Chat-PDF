import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

export const requireAuth = ClerkExpressRequireAuth({
  onError: (err, req, res) => {
    res.status(401).json({ error: 'Unauthorized' });
  },
});
