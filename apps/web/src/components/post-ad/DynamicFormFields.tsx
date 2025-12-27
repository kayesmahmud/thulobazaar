'use client';

import { FormField } from '@/config/formTemplates';

interface DynamicFormFieldsProps {
  fields: FormField[];
  values: Record<string, any>;
  errors: Record<string, string>;
  onChange: (fieldName: string, value: any) => void;
  subcategoryName?: string;
}

/**
 * Dynamic Form Fields Component
 * Renders category-specific fields based on template configuration
 *
 * EXACT port from old JavaScript version with Tailwind CSS styling
 */
export default function DynamicFormFields({
  fields,
  values,
  errors,
  onChange,
  subcategoryName
}: DynamicFormFieldsProps) {
  if (fields.length === 0) return null;

  const renderField = (field: FormField) => {
    const value = values[field.name] || '';
    const error = errors[field.name];

    const inputClass = `w-full px-4 py-2.5 border-2 rounded-lg text-base transition-colors ${
      error
        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
        : 'border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
    } focus:outline-none`;

    const labelClass = 'block mb-2 text-sm font-medium text-gray-700';
    const errorClass = 'text-red-600 text-sm mt-1';

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="form-field">
            <label className={labelClass}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              className={inputClass}
              value={value}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
            {error && <p className={errorClass}>{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="form-field">
            <label className={labelClass}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              className={inputClass}
              value={value}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              required={field.required}
            />
            {error && <p className={errorClass}>{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="form-field">
            <label className={labelClass}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              className={inputClass}
              value={value}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.required}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {error && <p className={errorClass}>{error}</p>}
          </div>
        );

      case 'multiselect':
        return (
          <div key={field.name} className="form-field">
            <label className={labelClass}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              {field.options?.map(option => {
                const isChecked = Array.isArray(value) && value.includes(option);
                return (
                  <label key={option} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const currentValues = Array.isArray(value) ? value : [];
                        const newValues = e.target.checked
                          ? [...currentValues, option]
                          : currentValues.filter(v => v !== option);
                        onChange(field.name, newValues);
                      }}
                      className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-2 focus:ring-rose-500"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                );
              })}
            </div>
            {error && <p className={errorClass}>{error}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="form-field">
            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={value === true}
                onChange={(e) => onChange(field.name, e.target.checked)}
                className="w-5 h-5 text-rose-500 border-gray-300 rounded focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
            {error && <p className={errorClass}>{error}</p>}
          </div>
        );

      case 'date':
        return (
          <div key={field.name} className="form-field">
            <label className={labelClass}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              className={inputClass}
              value={value}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.required}
            />
            {error && <p className={errorClass}>{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dynamic-fields bg-blue-50/50 border-2 border-blue-200 rounded-xl p-6 mb-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Additional Details
          {subcategoryName && (
            <span className="text-sm font-normal text-gray-600">
              for {subcategoryName}
            </span>
          )}
        </h3>
        <p className="text-sm text-gray-600">
          Provide specific details to help buyers understand your item better
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map(field => renderField(field))}
      </div>
    </div>
  );
}
