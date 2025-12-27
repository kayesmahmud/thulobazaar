'use client';

import type { EditorDetail, ActiveTab, EditorActivity, AdWork, VerificationWork } from './types';
import { getActivityIcon, getActivityColor, getActivityLabel, formatTimestamp } from './types';

interface EditorTabsProps {
  editor: EditorDetail;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export function EditorTabs({ editor, activeTab, setActiveTab }: EditorTabsProps) {
  const tabs = [
    { key: 'activity' as const, label: 'Activity Timeline', icon: '📅' },
    { key: 'ads' as const, label: 'Ads Work', icon: '📢', badge: editor.adWork.length },
    { key: 'business' as const, label: 'Business Verifications', icon: '🏢', badge: editor.businessVerifications.length },
    { key: 'individual' as const, label: 'Individual Verifications', icon: '👤', badge: editor.individualVerifications.length },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 overflow-hidden">
      {/* Tab Headers */}
      <div className="border-b-2 border-gray-100 bg-gray-50 px-6">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-6 py-4 font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-bold">
                    {tab.badge}
                  </span>
                )}
              </span>
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'activity' && <ActivityTab activities={editor.activities} />}
        {activeTab === 'ads' && <AdsTab adWork={editor.adWork} />}
        {activeTab === 'business' && <VerificationTab verifications={editor.businessVerifications} />}
        {activeTab === 'individual' && <VerificationTab verifications={editor.individualVerifications} />}
      </div>
    </div>
  );
}

function ActivityTab({ activities }: { activities: EditorActivity[] }) {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
            <span className="text-2xl">{getActivityIcon(activity.type)}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">{getActivityLabel(activity)}</h4>
                {activity.details && <p className="text-gray-600 text-sm">{activity.details}</p>}
              </div>
              <span className="text-sm text-gray-500 whitespace-nowrap">{formatTimestamp(activity.timestamp)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdsTab({ adWork }: { adWork: AdWork[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-100">
            <th className="text-left py-4 px-4 font-semibold text-gray-700">Ad ID</th>
            <th className="text-left py-4 px-4 font-semibold text-gray-700">Ad Title</th>
            <th className="text-left py-4 px-4 font-semibold text-gray-700">Action</th>
            <th className="text-left py-4 px-4 font-semibold text-gray-700">Timestamp</th>
            <th className="text-left py-4 px-4 font-semibold text-gray-700">Reason/Notes</th>
          </tr>
        </thead>
        <tbody>
          {adWork.map((ad) => (
            <tr key={ad.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-4 px-4 text-gray-600">#{ad.id}</td>
              <td className="py-4 px-4 font-medium text-gray-900">{ad.adTitle}</td>
              <td className="py-4 px-4">
                <ActionBadge action={ad.action} />
              </td>
              <td className="py-4 px-4 text-gray-600 text-sm">{formatTimestamp(ad.timestamp)}</td>
              <td className="py-4 px-4 text-gray-600 text-sm">{ad.reason || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VerificationTab({ verifications }: { verifications: VerificationWork[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-100">
            <th className="text-left py-4 px-4 font-semibold text-gray-700">ID</th>
            <th className="text-left py-4 px-4 font-semibold text-gray-700">Seller Name</th>
            <th className="text-left py-4 px-4 font-semibold text-gray-700">Action</th>
            <th className="text-left py-4 px-4 font-semibold text-gray-700">Timestamp</th>
            <th className="text-left py-4 px-4 font-semibold text-gray-700">Reason/Notes</th>
          </tr>
        </thead>
        <tbody>
          {verifications.map((verification) => (
            <tr key={verification.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-4 px-4 text-gray-600">#{verification.id}</td>
              <td className="py-4 px-4 font-medium text-gray-900">{verification.sellerName}</td>
              <td className="py-4 px-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    verification.action === 'approved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {verification.action.charAt(0).toUpperCase() + verification.action.slice(1)}
                </span>
              </td>
              <td className="py-4 px-4 text-gray-600 text-sm">{formatTimestamp(verification.timestamp)}</td>
              <td className="py-4 px-4 text-gray-600 text-sm">{verification.reason || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionBadge({ action }: { action: AdWork['action'] }) {
  const styles = {
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
    edited: 'bg-amber-100 text-amber-700',
    deleted: 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[action]}`}>
      {action.charAt(0).toUpperCase() + action.slice(1)}
    </span>
  );
}
