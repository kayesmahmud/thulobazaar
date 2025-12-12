'use client';

import { UserAvatar } from '@/components/ui/UserAvatar';

interface ProfileHeaderProps {
  displayName: string;
  email: string | null;
  avatar: string | null;
  accountType: string | null;
  isVerified: boolean;
  isVerifiedBusiness: boolean;
  createdAt: string | null;
}

export function ProfileHeader({
  displayName,
  email,
  avatar,
  accountType,
  isVerified,
  isVerifiedBusiness,
  createdAt,
}: ProfileHeaderProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="h-32 bg-gradient-to-r from-primary to-pink-500"></div>
      <div className="px-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
          <div className="relative">
            <UserAvatar
              src={avatar}
              name={displayName}
              size="2xl"
              borderColor={isVerifiedBusiness ? 'gold' : isVerified ? 'blue' : 'default'}
            />
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 sm:pb-2">
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-gray-500">{email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                accountType === 'business'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {accountType === 'business' ? 'Business' : 'Individual'} Account
              </span>
              {isVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
              <span className="text-xs text-gray-500">
                Member since {new Date(createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
