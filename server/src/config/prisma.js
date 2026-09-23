import { PrismaClient } from '@prisma/client';

// Reuse the client across nodemon hot reloads so we don't exhaust the
// Supabase pooler with dangling connections.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
