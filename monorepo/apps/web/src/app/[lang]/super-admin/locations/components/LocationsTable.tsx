'use client';

import React from 'react';
import type { Location } from '../types';

interface LocationsTableProps {
  locations: Location[];
  filterType: string;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'province': return 'bg-purple-100 text-purple-700';
    case 'district': return 'bg-blue-100 text-blue-700';
    case 'municipality': return 'bg-green-100 text-green-700';
    case 'area': return 'bg-pink-100 text-pink-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export default function LocationsTable({ locations, filterType, onEdit, onDelete }: LocationsTableProps) {
  const filteredLocations = filterType === 'all'
    ? locations
    : locations.filter(l => l.type === filterType);

  // When filtering by specific type, show all locations of that type (flat list)
  // When showing all, use hierarchical display (parents + sublocations)
  const parentLocations = filterType === 'all'
    ? filteredLocations.filter(l => !l.parent_id)
    : filteredLocations;

  const getSublocations = (parentId: number) => filterType === 'all'
    ? filteredLocations.filter(l => l.parent_id === parentId)
    : [];

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Slug</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Parent</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ads</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Users</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Sublocations</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {parentLocations.map((location) => (
              <React.Fragment key={location.id}>
                <LocationRow
                  location={location}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
                {getSublocations(location.id).map((sub) => (
                  <LocationRow
                    key={sub.id}
                    location={sub}
                    parentName={location.name}
                    isChild
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface LocationRowProps {
  location: Location;
  parentName?: string;
  isChild?: boolean;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
}

function LocationRow({ location, parentName, isChild, onEdit, onDelete }: LocationRowProps) {
  return (
    <tr className={`hover:bg-gray-50 ${isChild ? 'bg-gray-25' : ''}`}>
      <td className="px-6 py-4">
        <div className={`font-medium text-gray-900 ${isChild ? 'ml-8' : ''}`}>
          {isChild ? '└ ' : ''}{location.name}
        </div>
        {location.latitude && location.longitude && (
          <div className={`text-xs text-gray-500 font-mono ${isChild ? 'ml-8' : ''}`}>
            {location.latitude}, {location.longitude}
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 font-mono">{location.slug || '-'}</td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(location.type)}`}>
          {location.type}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{parentName || '-'}</td>
      <td className="px-6 py-4 text-sm text-gray-900">{location.ad_count}</td>
      <td className="px-6 py-4 text-sm text-gray-900">{location.user_count}</td>
      <td className="px-6 py-4 text-sm text-gray-900">{location.sublocation_count}</td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={() => onEdit(location)}
          className="text-indigo-600 hover:text-indigo-800 mr-3"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(location)}
          className="text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
