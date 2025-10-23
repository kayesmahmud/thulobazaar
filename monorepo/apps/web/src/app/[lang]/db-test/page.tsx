import { prisma } from '@thulobazaar/database';
import { formatPrice, formatDateTime } from '@thulobazaar/utils';

interface DbTestPageProps {
  params: Promise<{ lang: string }>;
}

export default async function DbTestPage({ params }: DbTestPageProps) {
  const { lang } = await params;

  // Fetch data directly from database using Prisma
  const [adsCount, usersCount, categoriesCount, locationsCount, latestAds] = await Promise.all([
    prisma.ads.count(),
    prisma.users.count(),
    prisma.categories.count(),
    prisma.locations.count(),
    prisma.ads.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        users_ads_user_idTousers: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        locations: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>
          🎉 Database Connection Test
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          Testing direct Prisma connection from Next.js Server Component
        </p>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
              {adsCount}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Ads</div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👥</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
              {usersCount}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Users</div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📁</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
              {categoriesCount}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Categories</div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🗺️</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
              {locationsCount}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Locations</div>
          </div>
        </div>

        {/* Latest Ads Table */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
              Latest 10 Ads (From Prisma)
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Title
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Price
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Seller
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Category
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Location
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Posted
                  </th>
                </tr>
              </thead>
              <tbody>
                {latestAds.map((ad) => (
                  <tr key={ad.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#1f2937', fontWeight: '500' }}>
                      {ad.title}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#10b981', fontWeight: '600' }}>
                      {formatPrice(parseFloat(ad.price.toString()))}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {ad.users_ads_user_idTousers.full_name}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {ad.categories.icon} {ad.categories.name}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {ad.locations.name}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {formatDateTime(ad.created_at || new Date())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Success Message */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: '#dcfce7',
          border: '1px solid #86efac',
          borderRadius: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem' }}>✅</div>
            <div>
              <div style={{ fontWeight: '600', color: '#166534', marginBottom: '0.25rem' }}>
                Database Connection Successful!
              </div>
              <div style={{ fontSize: '0.875rem', color: '#15803d' }}>
                Prisma is working perfectly with your PostgreSQL database. All {adsCount} ads are safe and accessible.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
