import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockRequireEditor = vi.fn();
const mockCount = vi.fn();
const mockFindMany = vi.fn();

vi.mock('@/lib/auth', () => ({
  requireEditor: (...args: unknown[]) => mockRequireEditor(...args),
}));

vi.mock('@thulobazaar/database', () => ({
  prisma: {
    shop_reports: {
      count: (...args: unknown[]) => mockCount(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

function getRequest(params: Record<string, string>) {
  const url = new URL('http://localhost:3333/api/editor/reported-shops');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString(), { method: 'GET' });
}

const contains = (term: string) => ({ contains: term, mode: 'insensitive' });

describe('GET /api/editor/reported-shops ?search=', () => {
  let GET: typeof import('@/app/api/editor/reported-shops/route').GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    mockRequireEditor.mockResolvedValue({ id: 12, role: 'editor' });
    mockCount.mockResolvedValue(0);
    mockFindMany.mockResolvedValue([]);
    GET = (await import('@/app/api/editor/reported-shops/route')).GET;
  });

  it('matches shop, reporter, or reason server-side, combined with the status tab', async () => {
    const res = await GET(getRequest({ status: 'pending', search: 'babu' }));
    expect(res.status).toBe(200);

    const where = mockFindMany.mock.calls[0][0].where;
    expect(where.status).toBe('pending');
    expect(where.OR).toEqual([
      { shop: { OR: [{ business_name: contains('babu') }, { full_name: contains('babu') }, { email: contains('babu') }] } },
      { reporter: { OR: [{ full_name: contains('babu') }, { email: contains('babu') }] } },
      { reason: contains('babu') },
    ]);
    expect(mockCount.mock.calls[0][0].where).toEqual(where);
  });

  it('leaves the where clause untouched without a search term', async () => {
    await GET(getRequest({ status: 'pending' }));
    expect(mockFindMany.mock.calls[0][0].where).toEqual({ status: 'pending' });
  });
});
