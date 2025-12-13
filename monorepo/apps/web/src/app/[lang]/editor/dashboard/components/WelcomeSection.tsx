'use client';

import type { MyWorkToday } from '../types';

interface WelcomeSectionProps {
  staffName: string;
  avatarUrl: string | null;
  myWorkToday: MyWorkToday;
}

export default function WelcomeSection({ staffName, avatarUrl, myWorkToday }: WelcomeSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Left: Profile and Welcome */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Profile Picture */}
          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={staffName || 'Profile'}
                className="w-20 h-20 rounded-full object-cover shadow-lg ring-4 ring-white"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-white">
                {staffName ? staffName.charAt(0).toUpperCase() : 'T'}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="flex flex-col">
            <p className="text-gray-500 text-sm font-medium">Welcome</p>
            <h1 className="text-xl font-bold text-gray-900">{staffName || 'Editor'}</h1>
          </div>
        </div>

        {/* Right: My Work Reports Today */}
        <div className="flex-1 overflow-x-auto">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-w-fit">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p className="text-sm font-bold text-gray-700">My Work reports today:</p>
            </div>
            <table className="w-full">
              <tbody className="divide-y divide-gray-200">
                {/* Row 1: Ad Approved | Ad rejected | Business verification */}
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">Ad Approved:</td>
                  <td className="px-3 py-2 text-right text-lg font-bold text-gray-900 border-r border-gray-200">{myWorkToday.adsApprovedToday}</td>
                  <td className="px-3 py-2 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">Ad rejected:</td>
                  <td className="px-3 py-2 text-right text-lg font-bold text-gray-900 border-r border-gray-200">{myWorkToday.adsRejectedToday}</td>
                  <td className="px-3 py-2 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">Business verification:</td>
                  <td className="px-3 py-2 text-right text-lg font-bold text-gray-900">{myWorkToday.businessVerificationsToday}</td>
                </tr>
                {/* Row 2: Ad Edited | Support tickets | Individual verification */}
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">Ad Edited:</td>
                  <td className="px-3 py-2 text-right text-lg font-bold text-gray-900 border-r border-gray-200">{myWorkToday.adsEditedToday}</td>
                  <td className="px-3 py-2 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">Support tickets:</td>
                  <td className="px-3 py-2 text-right text-lg font-bold text-gray-900 border-r border-gray-200">{myWorkToday.supportTicketsAssigned}</td>
                  <td className="px-3 py-2 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">Individual verification:</td>
                  <td className="px-3 py-2 text-right text-lg font-bold text-gray-900">{myWorkToday.individualVerificationsToday}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
