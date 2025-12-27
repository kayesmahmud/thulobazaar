# How to Add "Contact Seller" Button to Ad Pages

## Quick Start

### 1. Find Your Ad Detail Page

Common locations:
- `/apps/web/src/app/[lang]/ad/[slug]/page.tsx`
- `/apps/web/src/app/[lang]/ads/[id]/page.tsx`
- Or wherever you display individual ad details

### 2. Import the Component

```typescript
import ContactSellerButton from '@/components/messages/ContactSellerButton';
```

### 3. Add the Button

```typescript
// Inside your ad detail page component
export default function AdDetailPage({ ad }) {
  return (
    <div>
      {/* ... other ad details ... */}

      {/* Add this where you want the contact button */}
      <ContactSellerButton
        sellerId={ad.userId}          // Required: The ad seller's user ID
        sellerName={ad.user?.full_name}  // Optional: Shows "Contact John" instead of "Contact Seller"
        adId={ad.id}                  // Optional: Links conversation to this ad
        adTitle={ad.title}            // Optional: For future reference
        variant="primary"             // Optional: 'primary' | 'secondary' | 'outline'
        className="w-full mt-4"       // Optional: Custom Tailwind classes
      />
    </div>
  );
}
```

## Example: Complete Integration

```typescript
// File: /apps/web/src/app/[lang]/ad/[slug]/page.tsx

import ContactSellerButton from '@/components/messages/ContactSellerButton';

export default async function AdDetailPage({ params }: { params: { slug: string } }) {
  // Fetch ad data
  const ad = await getAdBySlug(params.slug);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images */}
        <div className="lg:col-span-2">
          <AdGallery images={ad.images} />
        </div>

        {/* Right Column - Details + Contact */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-6">
            {/* Price Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-2xl font-bold mb-2">{ad.title}</h1>
              <p className="text-3xl font-bold text-blue-600 mb-4">
                NPR {ad.price.toLocaleString()}
              </p>

              {/* Contact Seller Button */}
              <ContactSellerButton
                sellerId={ad.userId}
                sellerName={ad.user?.full_name}
                adId={ad.id}
                adTitle={ad.title}
                variant="primary"
                className="w-full"
              />
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Seller Information</h3>
              <div className="flex items-center space-x-3">
                <img
                  src={ad.user?.avatar || '/default-avatar.png'}
                  alt={ad.user?.full_name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-medium">{ad.user?.full_name}</p>
                  <p className="text-sm text-gray-500">
                    Member since {formatDate(ad.user?.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Description */}
      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{ad.description}</p>
      </div>
    </div>
  );
}
```

## Button Variants

### Primary (Default)
```typescript
<ContactSellerButton variant="primary" />
```
Blue background, white text - Most prominent

### Secondary
```typescript
<ContactSellerButton variant="secondary" />
```
Gray background, white text - Subtle alternative

### Outline
```typescript
<ContactSellerButton variant="outline" />
```
Transparent background, blue border - Minimal style

## Responsive Design Example

```typescript
<div className="flex flex-col md:flex-row gap-4">
  {/* Call button for mobile */}
  <a
    href={`tel:${ad.user?.phone}`}
    className="md:hidden bg-green-600 text-white px-6 py-3 rounded-lg text-center"
  >
    Call Seller
  </a>

  {/* Contact button - full width on mobile, auto on desktop */}
  <ContactSellerButton
    sellerId={ad.userId}
    sellerName={ad.user?.full_name}
    adId={ad.id}
    variant="primary"
    className="w-full md:w-auto md:flex-1"
  />
</div>
```

## What Happens When Clicked?

1. **User not logged in** → Redirects to `/auth/signin?redirect=/messages`
2. **User logged in** → Creates/opens conversation → Redirects to `/messages?conversation=<id>`
3. **If messaging themselves** → Shows error "You cannot message yourself"
4. **Loading state** → Button shows spinner and "Starting conversation..."
5. **Success** → User lands in messages page with conversation open

## Testing

1. **Login as User A**
2. **View an ad** posted by User B
3. **Click "Contact Seller"**
4. **Verify**: Redirected to `/messages?conversation=N`
5. **Send a message**
6. **Login as User B** in incognito
7. **Go to `/messages`**
8. **Verify**: Conversation appears and message is visible

## Troubleshooting

### Button not appearing
- Check that you imported the component correctly
- Verify `ad.userId` exists and is a valid number

### "Please refresh the page" error
- User's session doesn't have a backend token
- Ask user to logout and login again
- Or wait for useBackendToken hook to fetch token automatically

### Button appears but nothing happens
- Check browser console for errors
- Verify backend API is running on port 5000
- Check that messaging routes are registered in backend

## Additional Features

### Show seller's other ads
```typescript
<div>
  <ContactSellerButton {...props} />
  <button
    onClick={() => router.push(`/seller/${ad.userId}/ads`)}
    className="mt-2 text-blue-600 text-sm hover:underline"
  >
    View all ads from {ad.user?.full_name}
  </button>
</div>
```

### Conditional rendering
```typescript
{currentUser?.id !== ad.userId && (
  <ContactSellerButton {...props} />
)}
```
Only show button if user is NOT the seller

### With analytics
```typescript
<ContactSellerButton
  {...props}
  onClick={() => {
    // Track in analytics
    analytics.track('contact_seller_clicked', {
      adId: ad.id,
      sellerId: ad.userId,
    });
  }}
/>
```

## Summary

✅ **Component ready to use**: `/apps/web/src/components/messages/ContactSellerButton.tsx`

✅ **Just import and add** with seller's user ID

✅ **Everything else is automatic**: Conversation creation, socket connection, message routing

✅ **Works for ALL users** without any manual database setup
