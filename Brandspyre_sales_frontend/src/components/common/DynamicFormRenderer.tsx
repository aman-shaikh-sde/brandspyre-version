import React, { useMemo } from 'react';
import { FormFieldDefinition } from '../../types';
import { HelpCircle, AlertCircle } from 'lucide-react';

interface DynamicFormRendererProps {
  fields: FormFieldDefinition[];
  values: Record<string, any>;
  errors?: Record<string, string>;
  onChange: (key: string, value: any) => void;
  disabled?: boolean;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  fields,
  values,
  errors = {},
  onChange,
  disabled = false
}) => {
  // Group fields by group name
  const groupedFields = useMemo(() => {
    const groups: Record<string, FormFieldDefinition[]> = {};
    const sorted = [...fields].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    sorted.forEach(field => {
      // Evaluate conditional visibility
      if (field.conditional && field.conditional.depends_on) {
        const parentVal = values[field.conditional.depends_on];
        if (parentVal !== field.conditional.show_when) {
          return; // Skip hidden conditional field
        }
      }

      const groupName = field.group || 'Additional Information';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(field);
    });

    return groups;
  }, [fields, values]);

  const renderFieldInput = (field: FormFieldDefinition) => {
    const key = field.key;
    const value = values[key] !== undefined ? values[key] : (field.default_value ?? '');
    const error = errors[key];

    const baseInputClasses = `w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
      error
        ? 'border-red-300 bg-red-50/20 focus:border-red-500'
        : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-600'
    } ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`;

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={`field-${key}`}
            value={value}
            placeholder={field.placeholder || ''}
            disabled={disabled}
            rows={3}
            onChange={e => onChange(key, e.target.value)}
            className={`${baseInputClasses} resize-y`}
          />
        );

      case 'number':
      case 'currency':
        return (
          <div className="relative">
            {field.type === 'currency' && (
              <span className="absolute left-3.5 top-2.5 text-gray-500 font-semibold text-sm">₹</span>
            )}
            <input
              id={`field-${key}`}
              type="number"
              value={value}
              min={field.validation?.min}
              max={field.validation?.max}
              placeholder={field.placeholder || ''}
              disabled={disabled}
              onChange={e => onChange(key, e.target.value === '' ? '' : Number(e.target.value))}
              className={`${baseInputClasses} ${field.type === 'currency' ? 'pl-8' : ''}`}
            />
          </div>
        );

      case 'select':
        return (
          <select
            id={`field-${key}`}
            value={value}
            disabled={disabled}
            onChange={e => onChange(key, e.target.value)}
            className={`${baseInputClasses} bg-white`}
          >
            <option value="">{field.placeholder || '-- Select an option --'}</option>
            {field.options?.map((opt, i) => (
              <option key={i} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect': {
        const selectedArr: string[] = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {field.options?.map((opt, i) => {
                const optVal = String(opt.value);
                const isChecked = selectedArr.includes(optVal);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (isChecked) {
                        onChange(key, selectedArr.filter(v => v !== optVal));
                      } else {
                        onChange(key, [...selectedArr, optVal]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isChecked
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input
              id={`field-${key}`}
              type="checkbox"
              checked={Boolean(value)}
              disabled={disabled}
              onChange={e => onChange(key, e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 select-none">{field.label}</span>
          </label>
        );

      case 'radio':
        return (
          <div className="flex flex-wrap gap-4 pt-1">
            {field.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name={`radio-${key}`}
                  value={String(opt.value)}
                  checked={String(value) === String(opt.value)}
                  disabled={disabled}
                  onChange={() => onChange(key, opt.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            id={`field-${key}`}
            type="date"
            value={value ? String(value).split('T')[0] : ''}
            disabled={disabled}
            onChange={e => onChange(key, e.target.value)}
            className={baseInputClasses}
          />
        );

      case 'tags': {
        const tagsValue = Array.isArray(value) ? value.join(', ') : String(value || '');
        return (
          <input
            id={`field-${key}`}
            type="text"
            value={tagsValue}
            placeholder={field.placeholder || 'Comma separated values (e.g. WiFi, AC, Lift)'}
            disabled={disabled}
            onChange={e => {
              const raw = e.target.value;
              const parsed = raw.split(',').map(s => s.trim()).filter(Boolean);
              onChange(key, parsed);
            }}
            className={baseInputClasses}
          />
        );
      }

      case 'text':
      default:
        return (
          <input
            id={`field-${key}`}
            type="text"
            value={value}
            placeholder={field.placeholder || ''}
            disabled={disabled}
            onChange={e => onChange(key, e.target.value)}
            className={baseInputClasses}
          />
        );
    }
  };

  if (fields.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 border border-dashed rounded-xl bg-gray-50/50">
        No additional category fields defined for this listing type.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedFields).map(([groupTitle, groupFieldList]) => (
        <div key={groupTitle} className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
            {groupTitle}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupFieldList.map(field => {
              const error = errors[field.key];
              const isFullWidth = ['textarea', 'tags', 'multiselect'].includes(field.type);

              return (
                <div
                  key={field.key}
                  className={`space-y-1.5 ${isFullWidth ? 'md:col-span-2' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`field-${field.key}`}
                      className="block text-xs font-semibold text-gray-700"
                    >
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.help_text && (
                      <span className="text-[11px] text-gray-400 flex items-center gap-1" title={field.help_text}>
                        <HelpCircle className="w-3 h-3" />
                        {field.help_text}
                      </span>
                    )}
                  </div>

                  {renderFieldInput(field)}

                  {error && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
