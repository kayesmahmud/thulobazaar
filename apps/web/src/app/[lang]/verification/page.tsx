'use client';

import { use, useMemo } from 'react';
import {
  IndividualVerificationForm,
  BusinessVerificationForm,
} from '@/components/verification';
import {
  useVerificationPage,
  HeroHeader,
  PhoneVerificationBanner,
  FreeVerificationBanner,
  CampaignBanner,
  BenefitsGrid,
  VerificationStatusCard,
  DurationSelector,
  FaqSection,
} from './components';
import { VerificationBanner } from '@/components/dashboard/VerificationBanner';
import type { VerificationStatus as DashboardVerificationStatus } from '@/components/dashboard/types';

interface VerificationPageProps {
  params: Promise<{ lang: string }>;
}

// Helper component to transform verification data for the dashboard banner
interface VerificationStatusBannerProps {
  verificationStatus: {
    business?: {
      status: string;
      rejectionReason?: string;
      request?: {
        status?: string;
        businessName?: string;
        rejectionReason?: string;
        createdAt?: string;
        durationDays?: number;
        paymentStatus?: string;
        canResubmitFree?: boolean;
      };
    };
    individual?: {
      status: string;
      rejectionReason?: string;
      request?: {
        status?: string;
        fullName?: string;
        rejectionReason?: string;
        createdAt?: string;
        durationDays?: number;
        paymentStatus?: string;
        canResubmitFree?: boolean;
      };
    };
  } | null;
  lang: string;
  onResubmit: (type: 'individual' | 'business') => void;
}

function VerificationStatusBanner({ verificationStatus, lang, onResubmit }: VerificationStatusBannerProps) {
  // Transform verification page data to dashboard banner format
  const dashboardFormat: DashboardVerificationStatus | null = verificationStatus ? {
    accountType: 'personal',
    businessVerification: {
      status: verificationStatus.business?.status || 'unverified',
      verified: verificationStatus.business?.status === 'verified',
      businessName: verificationStatus.business?.request?.businessName || null,
      hasRequest: !!verificationStatus.business?.request,
      request: verificationStatus.business?.request ? {
        id: 0,
        status: verificationStatus.business.request.status || verificationStatus.business.status,
        businessName: verificationStatus.business.request.businessName,
        createdAt: verificationStatus.business.request.createdAt || '',
        rejectionReason: verificationStatus.business.request.rejectionReason || verificationStatus.business.rejectionReason,
        durationDays: verificationStatus.business.request.durationDays,
      } : undefined,
    },
    individualVerification: {
      verified: verificationStatus.individual?.status === 'verified',
      fullName: verificationStatus.individual?.request?.fullName || null,
      hasRequest: !!verificationStatus.individual?.request,
      request: verificationStatus.individual?.request ? {
        id: 0,
        status: verificationStatus.individual.request.status || verificationStatus.individual.status,
        fullName: verificationStatus.individual.request.fullName,
        createdAt: verificationStatus.individual.request.createdAt || '',
        rejectionReason: verificationStatus.individual.request.rejectionReason || verificationStatus.individual.rejectionReason,
        durationDays: verificationStatus.individual.request.durationDays,
      } : undefined,
    },
  } : null;

  return (
    <VerificationBanner
      verificationStatus={dashboardFormat}
      lang={lang}
      userName={null}
      onResubmit={onResubmit}
    />
  );
}

export default function VerificationPage({ params }: VerificationPageProps) {
  const { lang } = use(params);
  const {
    status,
    loading,
    verificationStatus,
    pricing,
    phoneVerified,
    userPhone,
    selectedType,
    selectedDuration,
    showForm,
    isResubmission,
    resubmissionDuration,
    isFreeVerification,
    handleTypeSelect,
    handleDurationSelect,
    handleProceedToForm,
    handleFormSuccess,
    handleFormCancel,
    handleClearSelection,
  } = useVerificationPage(lang);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-ping opacity-20"></div>
            <div className="relative w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-xl">
              <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
          <p className="text-lg font-semibold text-gray-700">Loading verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <HeroHeader lang={lang} />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
        {/* Phone Verification Warning Banner */}
        {!loading && !phoneVerified && (
          <PhoneVerificationBanner lang={lang} userPhone={userPhone} />
        )}

        {/* Free Verification Promotion Banner */}
        {pricing && (
          <FreeVerificationBanner pricing={pricing} phoneVerified={phoneVerified} />
        )}

        {/* Campaign Discount Banner */}
        {pricing && phoneVerified && (
          <CampaignBanner pricing={pricing} />
        )}

        {/* Benefits Grid */}
        <BenefitsGrid />

        {/* Verification Status Banner - Same as Dashboard */}
        <VerificationStatusBanner
          verificationStatus={verificationStatus}
          lang={lang}
          onResubmit={handleTypeSelect}
        />

        {/* Verification Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12">
          <VerificationStatusCard
            type="individual"
            data={verificationStatus?.individual}
            phoneVerified={phoneVerified}
            isSelected={selectedType === 'individual'}
            showForm={showForm}
            onClick={() => handleTypeSelect('individual')}
          />
          <VerificationStatusCard
            type="business"
            data={verificationStatus?.business}
            phoneVerified={phoneVerified}
            isSelected={selectedType === 'business'}
            showForm={showForm}
            onClick={() => handleTypeSelect('business')}
          />
        </div>

        {/* Duration Selection */}
        {selectedType && !showForm && pricing && (
          <DurationSelector
            selectedType={selectedType}
            selectedDuration={selectedDuration}
            pricing={pricing}
            isFreeVerification={isFreeVerification || false}
            onDurationSelect={handleDurationSelect}
            onProceed={handleProceedToForm}
            onClear={handleClearSelection}
          />
        )}

        {/* FAQ Section */}
        <FaqSection />
      </div>

      {/* Business Verification Form Modal */}
      {showForm && selectedType === 'business' && (selectedDuration || isResubmission) && (
        <BusinessVerificationForm
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          durationDays={isResubmission && resubmissionDuration ? resubmissionDuration : selectedDuration!.durationDays}
          price={isResubmission ? 0 : (isFreeVerification ? 0 : selectedDuration!.finalPrice)}
          isFreeVerification={isResubmission || isFreeVerification || false}
          isResubmission={isResubmission}
        />
      )}

      {/* Individual Verification Form Modal */}
      {showForm && selectedType === 'individual' && (selectedDuration || isResubmission) && (
        <IndividualVerificationForm
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          durationDays={isResubmission && resubmissionDuration ? resubmissionDuration : selectedDuration!.durationDays}
          price={isResubmission ? 0 : (isFreeVerification ? 0 : selectedDuration!.finalPrice)}
          isFreeVerification={isResubmission || isFreeVerification || false}
          isResubmission={isResubmission}
        />
      )}
    </div>
  );
}
