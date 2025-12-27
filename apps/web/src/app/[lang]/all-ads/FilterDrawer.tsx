'use client';

import { useState } from 'react';
import { X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface Category {
    id: number;
    name: string;
    slug: string;
    icon: string;
    other_categories?: Array<{ id: number; name: string; slug: string }>;
}

interface Location {
    id: number;
    name: string;
    slug: string;
    type: string;
    children?: Location[];
}

interface FilterDrawerProps {
    lang: string;
    categories: Category[];
    locationHierarchy: Location[];
    selectedCategory?: string;
    selectedLocation?: string;
    minPrice?: string;
    maxPrice?: string;
}

export default function FilterDrawer({
    lang,
    categories,
    locationHierarchy,
    selectedCategory,
    selectedLocation,
    minPrice = '',
    maxPrice = '',
}: FilterDrawerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        categories: true,
        locations: false,
        price: false,
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const buildFilterUrl = (filters: {
        category?: string;
        location?: string;
        minPrice?: string;
        maxPrice?: string;
    }) => {
        const params = new URLSearchParams();

        if (filters.category) params.set('category', filters.category);
        if (filters.location) params.set('location', filters.location);
        if (filters.minPrice) params.set('minPrice', filters.minPrice);
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);

        const queryString = params.toString();
        return `/${lang}/all-ads${queryString ? `?${queryString}` : ''}`;
    };

    const activeFiltersCount = [selectedCategory, selectedLocation, minPrice, maxPrice].filter(Boolean).length;

    return (
        <>
            {/* Filter Button - Fixed at top on mobile */}
            <div className="lg:hidden sticky top-14 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                    <SlidersHorizontal className="w-5 h-5" />
                    <span>Filters</span>
                    {activeFiltersCount > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-white text-indigo-600 rounded-full text-xs font-bold">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>

                {activeFiltersCount > 0 && (
                    <Link
                        href={`/${lang}/all-ads`}
                        className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                    >
                        Clear All
                    </Link>
                )}
            </div>

            {/* Drawer Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 lg:hidden animate-fade-in"
                    onClick={handleClose}
                />
            )}

            {/* Drawer Content */}
            <div
                className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 lg:hidden transition-transform duration-300 ease-out max-h-[85vh] flex flex-col ${isOpen ? 'translate-y-0' : 'translate-y-full'
                    }`}
            >
                {/* Handle Bar */}
                <div className="flex justify-center py-3 border-b border-gray-200">
                    <div className="w-12 h-1 bg-gray-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Categories Section */}
                    <div className="border-b border-gray-200">
                        <button
                            onClick={() => toggleSection('categories')}
                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                        >
                            <span className="font-semibold text-gray-900">Categories</span>
                            {expandedSections.categories ? (
                                <ChevronUp className="w-5 h-5 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                        </button>
                        {expandedSections.categories && (
                            <div className="px-6 pb-4 space-y-2">
                                {categories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={buildFilterUrl({
                                            category: category.slug,
                                            location: selectedLocation,
                                            minPrice,
                                            maxPrice,
                                        })}
                                        onClick={handleClose}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${selectedCategory === category.slug
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        <span className="text-2xl">{category.icon}</span>
                                        <span className="font-medium">{category.name}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Locations Section */}
                    <div className="border-b border-gray-200">
                        <button
                            onClick={() => toggleSection('locations')}
                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                        >
                            <span className="font-semibold text-gray-900">Locations</span>
                            {expandedSections.locations ? (
                                <ChevronUp className="w-5 h-5 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                        </button>
                        {expandedSections.locations && (
                            <div className="px-6 pb-4 space-y-2">
                                {locationHierarchy.slice(0, 10).map((location) => (
                                    <Link
                                        key={location.id}
                                        href={buildFilterUrl({
                                            category: selectedCategory,
                                            location: location.slug,
                                            minPrice,
                                            maxPrice,
                                        })}
                                        onClick={handleClose}
                                        className={`block px-4 py-3 rounded-lg transition-colors ${selectedLocation === location.slug
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        <span className="font-medium">{location.name}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Price Section */}
                    <div>
                        <button
                            onClick={() => toggleSection('price')}
                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                        >
                            <span className="font-semibold text-gray-900">Price Range</span>
                            {expandedSections.price ? (
                                <ChevronUp className="w-5 h-5 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                        </button>
                        {expandedSections.price && (
                            <div className="px-6 pb-4">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        const min = formData.get('minPrice') as string;
                                        const max = formData.get('maxPrice') as string;

                                        window.location.href = buildFilterUrl({
                                            category: selectedCategory,
                                            location: selectedLocation,
                                            minPrice: min,
                                            maxPrice: max,
                                        });
                                    }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Min Price (NPR)
                                        </label>
                                        <input
                                            type="number"
                                            name="minPrice"
                                            defaultValue={minPrice}
                                            placeholder="0"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Max Price (NPR)
                                        </label>
                                        <input
                                            type="number"
                                            name="maxPrice"
                                            defaultValue={maxPrice}
                                            placeholder="Any"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                                    >
                                        Apply Price Filter
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                    <Link
                        href={`/${lang}/all-ads`}
                        onClick={handleClose}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-center"
                    >
                        Reset
                    </Link>
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                    >
                        Show Results
                    </button>
                </div>
            </div>
        </>
    );
}
