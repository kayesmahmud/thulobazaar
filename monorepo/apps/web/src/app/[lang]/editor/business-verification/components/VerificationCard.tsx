'use client';

import type { BusinessVerification, TabStatus } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface VerificationCardProps {
  verification: BusinessVerification;
  activeTab: TabStatus;
  lang: string;
  actionLoading: boolean;
  onApprove: (id: number) => void;
  onReject: (verification: BusinessVerification) => void;
}

export function VerificationCard({
  verification,
  activeTab,
  lang,
  actionLoading,
  onApprove,
  onReject,
}: VerificationCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex gap-6">
          {/* Business Icon */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
              <span className="text-5xl">🏢</span>
            </div>
          </div>

          {/* Verification Details */}
          <div className="flex-1 min-w-0">
            <HeaderSection verification={verification} />
            <BusinessInfoGrid verification={verification} />
            <LicenseDocument verification={verification} />
            <PaymentDurationInfo verification={verification} />

            {verification.businessDescription && (
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="text-xs font-medium text-purple-700 mb-1">Business Description</div>
                <div className="text-sm text-gray-900">{verification.businessDescription}</div>
              </div>
            )}

            {activeTab === 'rejected' && verification.rejectionReason && (
              <RejectionReason reason={verification.rejectionReason} />
            )}

            <InfoNote activeTab={activeTab} />
            <ActionButtons
              verification={verification}
              activeTab={activeTab}
              lang={lang}
              actionLoading={actionLoading}
              onApprove={onApprove}
              onReject={onReject}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeaderSection({ verification }: { verification: BusinessVerification }) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <h3 className="text-xl font-bold text-gray-900 mb-1">{verification.businessName}</h3>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
          <span className="flex items-center gap-1">
            <span>👤</span> {verification.fullName}
          </span>
          <span className="flex items-center gap-1">
            <span>📧</span> {verification.email}
          </span>
        </div>
        {verification.businessPhone && (
          <div className="text-sm text-gray-600 mb-2">
            <span className="flex items-center gap-1">
              <span>📞</span> {verification.businessPhone}
            </span>
          </div>
        )}
      </div>
      <div className="text-right text-sm text-gray-500">
        <div>User ID: #{verification.userId}</div>
        <div className="mt-1">
          {new Date(verification.submittedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      </div>
    </div>
  );
}

function BusinessInfoGrid({ verification }: { verification: BusinessVerification }) {
  if (!verification.businessCategory && !verification.businessAddress && !verification.businessWebsite) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
      {verification.businessCategory && (
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">Category</div>
          <div className="text-sm text-gray-900">{verification.businessCategory}</div>
        </div>
      )}
      {verification.businessAddress && (
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">Address</div>
          <div className="text-sm text-gray-900">{verification.businessAddress}</div>
        </div>
      )}
      {verification.businessWebsite && (
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">Website</div>
          <a
            href={verification.businessWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            {verification.businessWebsite}
          </a>
        </div>
      )}
    </div>
  );
}

function LicenseDocument({ verification }: { verification: BusinessVerification }) {
  if (!verification.businessLicense) return null;

  const isImage = verification.businessLicense.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
        <span>📄</span> Business License Document
      </h4>
      <div className="flex gap-4 items-start">
        <a
          href={`${API_URL}/uploads/business_verification/${verification.businessLicense}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <div className="relative w-32 h-32 bg-white border-2 border-blue-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors">
            {isImage ? (
              <img
                src={`${API_URL}/uploads/business_verification/${verification.businessLicense}`}
                alt="Business License"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-100 to-pink-100">
                <svg className="w-12 h-12 text-red-600 mb-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-bold text-red-700">PDF</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-white text-sm bg-black/50 px-2 py-1 rounded">
                Click to view
              </span>
            </div>
          </div>
        </a>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 mb-2 break-all">{verification.businessLicense}</div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`${API_URL}/uploads/business_verification/${verification.businessLicense}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in New Tab
            </a>
            <a
              href={`${API_URL}/uploads/business_verification/${verification.businessLicense}`}
              download={verification.businessLicense}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentDurationInfo({ verification }: { verification: BusinessVerification }) {
  if (!verification.durationDays && verification.paymentAmount === undefined) {
    return null;
  }

  return (
    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
      {verification.durationDays && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs text-blue-600 font-medium mb-1">Duration</div>
          <div className="text-lg font-bold text-blue-900">
            {verification.durationDays === 30 ? '1 Month' :
             verification.durationDays === 90 ? '3 Months' :
             verification.durationDays === 180 ? '6 Months' :
             verification.durationDays === 365 ? '1 Year' :
             `${verification.durationDays} Days`}
          </div>
        </div>
      )}
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="text-xs text-green-600 font-medium mb-1">Payment</div>
        <div className="text-lg font-bold text-green-900">
          {verification.paymentStatus === 'free' ? (
            <span className="flex items-center gap-1">
              <span>FREE</span>
              <span className="text-xs font-normal">(Promo)</span>
            </span>
          ) : verification.paymentAmount ? (
            `NPR ${verification.paymentAmount}`
          ) : (
            'N/A'
          )}
        </div>
      </div>
      {verification.paymentReference && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-xs text-gray-600 font-medium mb-1">Reference</div>
          <div className="text-sm font-mono text-gray-900 truncate" title={verification.paymentReference}>
            {verification.paymentReference.length > 20
              ? `${verification.paymentReference.substring(0, 20)}...`
              : verification.paymentReference}
          </div>
        </div>
      )}
    </div>
  );
}

function RejectionReason({ reason }: { reason: string }) {
  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <span className="text-red-500 text-xl mt-0.5">⚠️</span>
        <div>
          <div className="text-sm font-semibold text-red-700 mb-1">Rejection Reason</div>
          <div className="text-red-900">{reason}</div>
        </div>
      </div>
    </div>
  );
}

function InfoNote({ activeTab }: { activeTab: TabStatus }) {
  const styles = {
    pending: 'bg-blue-50 border border-blue-200 text-blue-900',
    rejected: 'bg-red-50 border border-red-200 text-red-900',
    approved: 'bg-green-50 border border-green-200 text-green-900',
  };

  const messages = {
    pending: 'Business verification allows businesses to display a verified badge and build trust with customers.',
    rejected: 'This business can resubmit their verification with corrected documents. They will appear in the Pending tab once resubmitted.',
    approved: 'This business has been verified and can display the verified badge on their profile and listings.',
  };

  return (
    <div className={`mb-4 p-3 rounded-lg text-sm ${styles[activeTab]}`}>
      <span className="font-medium">Note:</span> {messages[activeTab]}
    </div>
  );
}

function ActionButtons({
  verification,
  activeTab,
  lang,
  actionLoading,
  onApprove,
  onReject,
}: {
  verification: BusinessVerification;
  activeTab: TabStatus;
  lang: string;
  actionLoading: boolean;
  onApprove: (id: number) => void;
  onReject: (verification: BusinessVerification) => void;
}) {
  return (
    <div className="flex gap-3">
      {activeTab === 'pending' && (
        <>
          <button
            onClick={() => onApprove(verification.id)}
            disabled={actionLoading}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✓ Approve Verification
          </button>
          <button
            onClick={() => onReject(verification)}
            disabled={actionLoading}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✗ Reject
          </button>
        </>
      )}
      {activeTab === 'rejected' && (
        <div className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg">
          Awaiting user resubmission
        </div>
      )}
      {activeTab === 'approved' && (
        <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
          <span>✅</span> Verified Business
        </div>
      )}
      <button
        onClick={() => window.open(`/${lang}/ads?userId=${verification.userId}`, '_blank')}
        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
      >
        📋 View User Ads
      </button>
      {verification.shopSlug && (
        <button
          onClick={() => window.open(`/${lang}/shop/${verification.shopSlug}`, '_blank')}
          className="px-6 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
        >
          🏪 View Shop
        </button>
      )}
    </div>
  );
}
