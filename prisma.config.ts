import path from 'node:path';
import { defineConfig } from 'prisma/config';

// Load environment variables manually (Prisma 7 no longer auto-loads .env)
import 'dotenv/config';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'packages/database/prisma/schema.prisma'),
});
