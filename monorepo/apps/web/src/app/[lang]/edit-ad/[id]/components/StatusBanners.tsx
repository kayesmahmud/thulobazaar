'use client';

interface RejectionBannerProps {
  rejectionReason: string;
}

export function RejectionBanner({ rejectionReason }: RejectionBannerProps) {
  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400 border-l-[6px] border-l-red-600 rounded-xl p-6 mb-8 shadow">
      <div className="flex gap-4 items-start">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">warning</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-bold text-red-900">Your Ad Was Rejected</h3>
            <span className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full">
              Action Required
            </span>
          </div>
          <p className="text-sm font-semibold text-red-800 mb-2">Reason from editor:</p>
          <p className="text-sm text-red-700 bg-white/70 p-3 rounded-lg border border-red-200 mb-4">
            {rejectionReason}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2 items-start">
              <span className="text-xl flex-shrink-0">info</span>
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">What to do next:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Fix the issues mentioned in the rejection reason above</li>
                  <li>Update your ad details in the form below</li>
                  <li>Click "Update Ad" - your ad will automatically be resubmitted for review</li>
                  <li>You'll receive a notification once the editor reviews it again</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ApprovedBanner() {
  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-400 border-l-[6px] border-l-green-600 rounded-xl p-6 mb-8 shadow">
      <div className="flex gap-4 items-start">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">lock</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-green-900 mb-3">Ad Approved & Published</h3>
          <p className="text-sm text-green-700 mb-4">
            This ad has been approved by our editors and is currently live on ThuluBazaar. For
            content integrity and fairness to buyers, approved ads cannot be edited.
          </p>
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <p className="text-sm text-yellow-900">
              <strong>Need to make changes?</strong> You have these options:
              <br />
              • Contact our support team if you need to update critical information
              <br />• Mark this ad as sold and create a new listing with updated details
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
