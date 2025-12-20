'use client';

import type { IndividualVerification, TabStatus } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface VerificationCardProps {
  verification: IndividualVerification;
  activeTab: TabStatus;
  lang: string;
  actionLoading: boolean;
  onApprove: (id: number) => void;
  onReject: (verification: IndividualVerification) => void;
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
          {/* User Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
              <span className="text-5xl">
                {verification.fullName ? verification.fullName.charAt(0).toUpperCase() : '👤'}
              </span>
            </div>
          </div>

          {/* Verification Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {verification.fullName}
                </h3>
                {verification.verifiedSellerName && (
                  <div className="text-sm text-purple-700 font-medium mb-2 flex items-center gap-1">
                    <span>✨</span> Seller Name: {verification.verifiedSellerName}
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <span>📧</span> {verification.email}
                  </span>
                  {verification.phone && (
                    <span className="flex items-center gap-1">
                      <span>📞</span> {verification.phone}
                    </span>
                  )}
                  {verification.location && (
                    <span className="flex items-center gap-1">
                      <span>📍</span> {verification.location}
                    </span>
                  )}
                </div>
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

            {/* Payment & Duration Info */}
            <PaymentDurationInfo verification={verification} />

            {/* ID Document Info */}
            <IdDocumentInfo verification={verification} />

            {/* Document Images */}
            <DocumentImages verification={verification} />

            {/* Rejection Reason */}
            {activeTab === 'rejected' && verification.rejectionReason && (
              <RejectionReason reason={verification.rejectionReason} />
            )}

            {/* Info Note */}
            <InfoNote activeTab={activeTab} />

            {/* Action Buttons */}
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

function PaymentDurationInfo({ verification }: { verification: IndividualVerification }) {
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
          ) : verification.paymentAmount !== undefined ? (
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
            {verification.paymentReference.substring(0, 20)}...
          </div>
        </div>
      )}
    </div>
  );
}

function IdDocumentInfo({ verification }: { verification: IndividualVerification }) {
  if (!verification.idDocumentType && !verification.idDocumentNumber) {
    return null;
  }

  return (
    <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span>ID Document Information</span>
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {verification.idDocumentType && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Document Type</div>
            <div className="font-medium text-gray-900 capitalize">
              {verification.idDocumentType.replace(/_/g, ' ')}
            </div>
          </div>
        )}
        {verification.idDocumentNumber && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Document Number</div>
            <div className="font-medium text-gray-900 font-mono">
              {verification.idDocumentNumber}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentImages({ verification }: { verification: IndividualVerification }) {
  if (!verification.idDocumentFront && !verification.idDocumentBack && !verification.selfieWithId) {
    return null;
  }

  const documents = [
    { label: 'ID Front', filename: verification.idDocumentFront, alt: 'ID Document Front' },
    { label: 'ID Back', filename: verification.idDocumentBack, alt: 'ID Document Back' },
    { label: 'Selfie with ID', filename: verification.selfieWithId, alt: 'Selfie with ID' },
  ].filter(d => d.filename);

  return (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
        <span>Uploaded Documents</span>
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {documents.map(({ label, filename, alt }) => (
          <div key={label}>
            <div className="text-xs text-blue-600 mb-2 font-medium">{label}</div>
            <a
              href={`${API_URL}/uploads/individual_verification/${filename}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="relative aspect-[4/3] bg-white border-2 border-blue-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors">
                <img
                  src={`${API_URL}/uploads/individual_verification/${filename}`}
                  alt={alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-sm bg-black/50 px-2 py-1 rounded">
                    Click to view
                  </span>
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>
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
    pending: 'bg-purple-50 border border-purple-200 text-purple-900',
    rejected: 'bg-red-50 border border-red-200 text-red-900',
    approved: 'bg-green-50 border border-green-200 text-green-900',
  };

  const messages = {
    pending: 'Individual verification allows users to display a verified badge and build trust with buyers.',
    rejected: 'This user can resubmit their verification with corrected information. They will appear in the Pending tab once resubmitted.',
    approved: 'This user has been verified and can display the verified badge on their profile and listings.',
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
  verification: IndividualVerification;
  activeTab: TabStatus;
  lang: string;
  actionLoading: boolean;
  onApprove: (id: number) => void;
  onReject: (verification: IndividualVerification) => void;
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
          <span>✅</span> Verified User
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
