import { NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * Health Check Endpoint
 * Used by AWS Load Balancer, monitoring tools, and CI/CD
 *
 * GET /api/health - Basic health check
 * GET /api/health?deep=true - Full system check (database, etc.)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deep = searchParams.get('deep') === 'true';

  const health: {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    version: string;
    checks: Record<string, { status: string; latency?: number; error?: string }>;
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    checks: {},
  };

  // Basic check - app is running
  health.checks.app = { status: 'ok' };

  // Deep check - test database connection
  if (deep) {
    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.checks.database = {
        status: 'ok',
        latency: Date.now() - dbStart,
      };
    } catch (error) {
      health.status = 'unhealthy';
      health.checks.database = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Database connection failed',
      };
    }

    // Check environment variables
    const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
    const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);
    if (missingEnvVars.length > 0) {
      health.checks.environment = {
        status: 'warning',
        error: `Missing: ${missingEnvVars.join(', ')}`,
      };
    } else {
      health.checks.environment = { status: 'ok' };
    }
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
