'use client';

export type VerificationType = 'individual' | 'business';

interface FormTipsProps {
  type: VerificationType;
}

const tips = {
  individual: [
    'Ensure all photos are clear and readable',
    'Your face and ID details should be visible',
    'Review usually takes 1-2 business days',
  ],
  business: [
    'Business name must match your registration document',
    'Upload a clear copy of your business license/registration',
    'Provide accurate contact information',
    'Review usually takes 1-2 business days',
  ],
};

export default function FormTips({ type }: FormTipsProps) {
  const tipsList = tips[type];

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <strong className="text-blue-900 text-sm">
        {type === 'individual' ? 'Tips:' : 'Verification Requirements:'}
      </strong>
      <ul className="text-blue-900 text-xs sm:text-sm mt-1 ml-4 list-disc space-y-0.5">
        {tipsList.map((tip, index) => (
          <li key={index}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}
