'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useShopSlug } from '@/hooks/useShopSlug';

interface ShopTabProps {
  businessName: string;
  displayName: string;
  customShopSlug: string | null;
  fallbackShopSlug: string;
  lang: string;
  onSuccess?: () => void;
}

export function ShopTab({
  businessName,
  displayName,
  customShopSlug,
  fallbackShopSlug,
  lang,
  onSuccess,
}: ShopTabProps) {
  const [successMessage, setSuccessMessage] = useState('');
  const activeShopSlug = customShopSlug || fallbackShopSlug;

  const {
    customSlug,
    isEditing,
    availability,
    suggestedSlugs,
    isSaving,
    error,
    setCustomSlug,
    startEditing,
    cancelEditing,
    checkAvailability,
    saveSlug,
    selectSuggestion,
  } = useShopSlug({
    initialSlug: activeShopSlug,
    onSuccess: () => {
      setSuccessMessage('Shop URL updated successfully!');
      onSuccess?.();
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  // Reset customSlug when props change
  useEffect(() => {
    if (!isEditing) {
      setCustomSlug(activeShopSlug);
    }
  }, [activeShopSlug, isEditing, setCustomSlug]);

  const copyUrl = () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/${lang}/shop/${activeShopSlug}`;
    navigator.clipboard.writeText(url);
    setSuccessMessage('URL copied!');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const shareShop = () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/${lang}/shop/${activeShopSlug}`;
    if (navigator.share) {
      navigator.share({
        title: `${displayName} - Shop`,
        text: `Visit ${displayName} on ThuLoBazaar`,
        url: url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setSuccessMessage('Shop URL copied!');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Shop Header */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{businessName}</h3>
          <p className="text-sm text-gray-600">Your verified business shop page</p>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Verified
        </span>
      </div>

      {/* Shop URL Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Shop URL</label>
        {!isEditing ? (
          <div className="flex items-center gap-3">
            <code className="flex-1 text-sm font-mono text-gray-700 bg-gray-100 px-4 py-2.5 rounded-lg border border-gray-200 truncate">
              {typeof window !== 'undefined' ? window.location.origin : ''}/{lang}/shop/{activeShopSlug}
            </code>
            <button
              onClick={copyUrl}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Copy URL"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => startEditing(activeShopSlug)}
              className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
                <span className="px-3 py-2.5 text-sm text-gray-500 bg-gray-50 border-r border-gray-300 whitespace-nowrap">
                  /{lang}/shop/
                </span>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  onBlur={() => checkAvailability(customSlug)}
                  placeholder="your-shop-name"
                  className="flex-1 px-3 py-2.5 text-sm outline-none border-none focus:ring-0"
                />
              </div>
              <button
                onClick={() => checkAvailability(customSlug)}
                disabled={availability === 'checking'}
                className="px-4 py-2.5 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-colors disabled:opacity-50"
              >
                {availability === 'checking' ? 'Checking...' : 'Check'}
              </button>
            </div>

            {availability === 'available' && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2.5 rounded-lg border border-green-200">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                This URL is available!
              </div>
            )}

            {availability === 'taken' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 px-4 py-2.5 rounded-lg border border-red-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  This URL is already taken
                </div>
                {suggestedSlugs.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Try these alternatives:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedSlugs.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => selectSuggestion(suggestion)}
                          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-mono"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={saveSlug}
                disabled={availability !== 'available' || isSaving}
                className="px-5 py-2.5 bg-success text-white font-medium rounded-lg hover:bg-success-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save URL'}
              </button>
              <button
                onClick={() => cancelEditing(activeShopSlug)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shop Actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
        <Link
          href={`/${lang}/shop/${activeShopSlug}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Shop
        </Link>
        <button
          onClick={shareShop}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Shop
        </button>
      </div>

      {/* Shop Features */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Shop Features</h4>
        <div className="grid grid-cols-2 gap-3">
          {['Golden verified badge', 'Custom shop URL', 'All your listings', 'Business information'].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
