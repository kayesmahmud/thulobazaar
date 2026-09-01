import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockRequireEditor = vi.fn();
const mockBusinessCount = vi.fn();
const mockBusinessFindMany = vi.fn();
const mockIndividualCount = vi.fn();
const mockIndividualFindMany = vi.fn();

vi.mock('@/lib/auth', () => ({
  requireEditor: (...args: unknown[]) => mockRequireEditor(...args),
}));

vi.mock('@thulobazaar/database', () => ({
  prisma: {
    business_verification_requests: {
      count: (...args: unknown[]) => mockBusinessCount(...args),
      findMany: (...args: unknown[]) => mockBusinessFindMany(...args),
    },
    individual_verification_requests: {
      count: (...args: unknown[]) => mockIndividualCount(...args),
      findMany: (...args: unknown[]) => mockIndividualFindMany(...args),
    },
  },
}));

function getRequest(params: Record<string, string>) {
  const url = new URL('http://localhost:3333/api/admin/verifications');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString(), { method: 'GET' });
}

const contains = (term: string) => ({ contains: term, mode: 'insensitive' });

describe('GET /api/admin/verifications ?search=', () => {
  let GET: typeof import('@/app/api/admin/verifications/route').GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    mockRequireEditor.mockResolvedValue({ id: 12, role: 'editor' });
    mockBusinessCount.mockResolvedValue(0);
    mockIndividualCount.mockResolvedValue(0);
    mockBusinessFindMany.mockResolvedValue([]);
    mockIndividualFindMany.mockResolvedValue([]);
    GET = (await import('@/app/api/admin/verifications/route')).GET;
  });

  it('applies the search term to both tables on top of the status filter', async () => {
    const res = await GET(getRequest({ status: 'approved', search: '  anita ' }));
    expect(res.status).toBe(200);

    const businessWhere = mockBusinessFindMany.mock.calls[0][0].where;
    expect(businessWhere.status).toBe('approved');
    expect(businessWhere.OR).toEqual([
      { business_name: contains('anita') },
      {
        users_business_verification_requests_user_idTousers: {
          OR: [{ email: contains('anita') }, { full_name: contains('anita') }],
        },
      },
    ]);

    const individualWhere = mockIndividualFindMany.mock.calls[0][0].where;
    expect(individualWhere.status).toBe('approved');
    expect(individualWhere.OR).toEqual([
      { full_name: contains('anita') },
      {
        users_individual_verification_requests_user_idTousers: {
          OR: [{ email: contains('anita') }, { full_name: contains('anita') }],
        },
      },
    ]);

    // Pagination totals must use the same filtered where, or totalPages is wrong
    expect(mockBusinessCount.mock.calls[0][0].where).toEqual(businessWhere);
    expect(mockIndividualCount.mock.calls[0][0].where).toEqual(individualWhere);
  });

  it('does not add an OR clause when search is empty or whitespace', async () => {
    await GET(getRequest({ status: 'all', search: '   ' }));
    expect(mockBusinessFindMany.mock.calls[0][0].where).toEqual({});
    expect(mockIndividualFindMany.mock.calls[0][0].where).toEqual({});
  });
});
