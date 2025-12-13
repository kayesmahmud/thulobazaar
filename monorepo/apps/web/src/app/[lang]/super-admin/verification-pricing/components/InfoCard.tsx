'use client';

export default function InfoCard() {
  return (
    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 className="text-lg font-bold text-blue-800 mb-2">How Verification Pricing Works</h3>
      <ul className="text-blue-700 space-y-2">
        <li>• Users select a verification type (Individual or Business) and duration (1/3/6/12 months)</li>
        <li>• The final price is calculated as: Base Price - (Base Price × Discount %)</li>
        <li>• When <strong>Free Verification Promotion</strong> is enabled, new users get 6 months free</li>
        <li>• Editors review documents and approve/reject verification requests</li>
        <li>• After the period ends, users need to renew their verification</li>
      </ul>
    </div>
  );
}
