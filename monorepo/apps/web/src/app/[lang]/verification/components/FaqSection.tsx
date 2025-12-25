'use client';

export function FaqSection() {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 shadow-xl">
      <div className="text-center mb-6 sm:mb-8 md:mb-10">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4">
          <span className="text-xl sm:text-2xl">❓</span>
          <span className="font-bold text-indigo-900 text-sm sm:text-base">Frequently Asked Questions</span>
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Everything you need to know</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        <FaqItem
          icon="⏱️"
          iconColor="text-indigo-600"
          bgColor="from-indigo-50 to-purple-50"
          question="How long does verification take?"
          answer="Most verifications are reviewed within 24-48 hours. You'll receive an email notification once your verification is processed."
        />

        <FaqItem
          icon="📄"
          iconColor="text-purple-600"
          bgColor="from-purple-50 to-pink-50"
          question="What documents do I need?"
          answer={
            <>
              <strong>Individual:</strong> Government ID (citizenship, passport, license) + selfie<br />
              <strong>Business:</strong> Business registration + valid business license
            </>
          }
        />

        <FaqItem
          icon="💰"
          iconColor="text-pink-600"
          bgColor="from-pink-50 to-rose-50"
          question="How does verification pricing work?"
          answer="Choose from 1, 3, 6, or 12-month plans. Longer durations offer better discounts. New users may be eligible for FREE verification!"
        />

        <FaqItem
          icon="🔄"
          iconColor="text-rose-600"
          bgColor="from-rose-50 to-red-50"
          question="What happens when verification expires?"
          answer="Your verified badge will be removed, but your shop page and listings remain. You can renew anytime to restore your verified status."
        />
      </div>
    </div>
  );
}

interface FaqItemProps {
  icon: string;
  iconColor: string;
  bgColor: string;
  question: string;
  answer: React.ReactNode;
}

function FaqItem({ icon, iconColor, bgColor, question, answer }: FaqItemProps) {
  return (
    <div className={`bg-gradient-to-br ${bgColor} rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-shadow`}>
      <h3 className="font-bold text-gray-900 text-sm sm:text-base md:text-lg mb-2 sm:mb-3 flex items-start sm:items-center gap-2">
        <span className={`${iconColor} flex-shrink-0`}>{icon}</span>
        <span>{question}</span>
      </h3>
      <p className="text-gray-700 leading-relaxed text-xs sm:text-sm md:text-base">{answer}</p>
    </div>
  );
}
