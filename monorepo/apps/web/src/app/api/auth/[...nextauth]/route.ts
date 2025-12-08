import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// =============================================================================
// NEXTAUTH ROUTE HANDLER
// =============================================================================

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
