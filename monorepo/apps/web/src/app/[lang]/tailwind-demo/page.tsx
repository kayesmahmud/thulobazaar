import { use } from 'react';

interface TailwindDemoPageProps {
  params: Promise<{ lang: string }>;
}

export default function TailwindDemoPage({ params }: TailwindDemoPageProps) {
  const { lang } = use(params);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container-custom">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🎨 Tailwind CSS Showcase
        </h1>
        <p className="text-muted mb-8">
          All components using your migrated theme from theme.js
        </p>

        {/* Color Palette */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Color Palette</h2>
          <div className="grid grid-cols-2 laptop:grid-cols-4 gap-4">
            <div className="card text-center">
              <div className="w-full h-20 bg-primary rounded-lg mb-3"></div>
              <p className="font-medium">Primary</p>
              <p className="text-xs text-muted">#dc1e4a</p>
            </div>
            <div className="card text-center">
              <div className="w-full h-20 bg-secondary rounded-lg mb-3"></div>
              <p className="font-medium">Secondary</p>
              <p className="text-xs text-muted">#3b82f6</p>
            </div>
            <div className="card text-center">
              <div className="w-full h-20 bg-success rounded-lg mb-3"></div>
              <p className="font-medium">Success</p>
              <p className="text-xs text-muted">#10b981</p>
            </div>
            <div className="card text-center">
              <div className="w-full h-20 bg-warning rounded-lg mb-3"></div>
              <p className="font-medium">Warning</p>
              <p className="text-xs text-muted">#f59e0b</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
          <div className="card">
            <div className="flex flex-wrap gap-3 mb-4">
              <button className="btn-primary">Primary Button</button>
              <button className="btn-secondary">Secondary Button</button>
              <button className="btn-success">Success Button</button>
              <button className="btn-danger">Danger Button</button>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="btn-outline-primary">Outline Primary</button>
              <button className="btn-outline-secondary">Outline Secondary</button>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Cards</h2>
          <div className="grid grid-cols-1 laptop:grid-cols-3 gap-4">
            <div className="card">
              <h3 className="text-lg font-semibold mb-2">Default Card</h3>
              <p className="text-muted">This is a default card with standard shadow.</p>
            </div>
            <div className="card-elevated">
              <h3 className="text-lg font-semibold mb-2">Elevated Card</h3>
              <p className="text-muted">This card has a larger shadow.</p>
            </div>
            <div className="card-flat">
              <h3 className="text-lg font-semibold mb-2">Flat Card</h3>
              <p className="text-muted">This card has no shadow.</p>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Badges</h2>
          <div className="card">
            <div className="flex flex-wrap gap-3">
              <span className="badge-primary">Primary Badge</span>
              <span className="badge-success">Success Badge</span>
              <span className="badge-warning">Warning Badge</span>
              <span className="badge-danger">Danger Badge</span>
              <span className="badge-info">Info Badge</span>
            </div>
          </div>
        </section>

        {/* Forms */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Form Elements</h2>
          <div className="card max-w-2xl">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Default Input</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter text here..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Success Input</label>
                <input
                  type="text"
                  className="input-success"
                  placeholder="Valid input"
                  defaultValue="Great!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Error Input</label>
                <input
                  type="text"
                  className="input-error"
                  placeholder="Invalid input"
                />
                <p className="text-danger text-sm mt-1">This field has an error</p>
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Typography</h2>
          <div className="card">
            <h1 className="text-5xl font-bold mb-2">Heading 1 (5xl)</h1>
            <h2 className="text-4xl font-bold mb-2">Heading 2 (4xl)</h2>
            <h3 className="text-3xl font-semibold mb-2">Heading 3 (3xl)</h3>
            <h4 className="text-2xl font-semibold mb-2">Heading 4 (2xl)</h4>
            <h5 className="text-xl font-medium mb-2">Heading 5 (xl)</h5>
            <h6 className="text-lg font-medium mb-4">Heading 6 (lg)</h6>
            <p className="text-base mb-2">
              This is body text (base). Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
            <p className="text-sm mb-2 text-muted">
              This is small muted text (sm).
            </p>
            <p className="text-xs text-light">
              This is extra small light text (xs).
            </p>
          </div>
        </section>

        {/* Spacing Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Spacing System (4px base)</h2>
          <div className="card">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-32 text-sm text-muted">p-xs (4px)</div>
                <div className="p-xs bg-primary-light border border-primary rounded">Content</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 text-sm text-muted">p-sm (8px)</div>
                <div className="p-sm bg-primary-light border border-primary rounded">Content</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 text-sm text-muted">p-md (12px)</div>
                <div className="p-md bg-primary-light border border-primary rounded">Content</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 text-sm text-muted">p-lg (16px)</div>
                <div className="p-lg bg-primary-light border border-primary rounded">Content</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 text-sm text-muted">p-xl (24px)</div>
                <div className="p-xl bg-primary-light border border-primary rounded">Content</div>
              </div>
            </div>
          </div>
        </section>

        {/* Loading States */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Loading States</h2>
          <div className="card">
            <div className="flex items-center gap-4 mb-4">
              <div className="spinner text-primary"></div>
              <span>Primary spinner</span>
            </div>
            <div className="space-y-2">
              <div className="skeleton h-8 w-full"></div>
              <div className="skeleton h-8 w-3/4"></div>
              <div className="skeleton h-8 w-1/2"></div>
            </div>
          </div>
        </section>

        {/* Responsive Grid */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Responsive Grid</h2>
          <div className="grid grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-3 desktop:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <div key={num} className="card text-center">
                <div className="text-4xl mb-2">📦</div>
                <p className="font-medium">Grid Item {num}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Success Message */}
        <div className="bg-success-light border border-success rounded-lg p-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✅</div>
            <div>
              <h3 className="font-semibold text-success mb-1">
                Tailwind CSS Setup Complete!
              </h3>
              <p className="text-sm text-gray-700">
                All your theme.js values have been successfully migrated to Tailwind. You can now use utility classes or
                custom component classes throughout your app.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
