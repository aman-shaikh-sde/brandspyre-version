import React, { useState, useEffect } from 'react';
import { apiClient } from "src/services/apiClient";
import { useOrganizationConfig } from '../../stores/useOrganizationConfig';
import { Button } from '../ui/Button';
import { notify } from '~/services/notificationService';

export interface DynamicFormField {
  field_code: string;
  label: string;
  description?: string;
  data_type: string;
  input_type: string;
  required: boolean;
  visible: boolean;
  editable: boolean;
  default_value?: any;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  validation?: { min?: number; max?: number; regex?: string; message?: string };
  section: string;
  is_system?: boolean;
}

export interface DynamicFormProps {
  entity: string;
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void>;
  submitting?: boolean;
  mode?: 'create' | 'edit';
  onCancel?: () => void;
  submitLabel?: string;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  entity,
  initialValues = {},
  onSubmit,
  submitting = false,
  mode = 'create',
  onCancel,
  submitLabel
}) => {
  const [fields, setFields] = useState<DynamicFormField[]>([]);
  const [sections, setSections] = useState<Array<{ title: string; fields: DynamicFormField[] }>>([]);
  const [formData, setFormData] = useState<Record<string, any>>(initialValues);
  const [customFields, setCustomFields] = useState<Record<string, any>>(initialValues.custom_fields || {});
  const [loading, setLoading] = useState<boolean>(true);

  const { getEntityFields } = useOrganizationConfig();

  useEffect(() => {
    const loadFields = async () => {
      setLoading(true);
      try {
        let fieldDefs = getEntityFields(entity);
        if (!fieldDefs || fieldDefs.length === 0) {
          const res = await apiClient.get(`/config/entities/${entity}/fields`);
          if (res.data?.success) {
            fieldDefs = res.data.data || [];
          }
        }

        const visibleFields = (fieldDefs || []).filter((f: any) => f.visible !== false);
        setFields(visibleFields);

        // Group into sections
        const secMap = new Map<string, DynamicFormField[]>();
        visibleFields.forEach((f: DynamicFormField) => {
          const sec = f.section || 'General Information';
          if (!secMap.has(sec)) secMap.set(sec, []);
          secMap.get(sec)!.push(f);
        });

        setSections(
          Array.from(secMap.entries()).map(([title, fieldList]) => ({
            title,
            fields: fieldList
          }))
        );
      } catch (err) {
        console.warn(`Failed to load dynamic fields for entity ${entity}:`, err);
      } finally {
        setLoading(false);
      }
    };

    loadFields();
  }, [entity]);

  useEffect(() => {
    setFormData(initialValues || {});
    setCustomFields(initialValues?.custom_fields || {});
  }, [JSON.stringify(initialValues || {})]);

  const handleChange = (field: DynamicFormField, value: any) => {
    if (field.is_system !== false) {
      setFormData((prev) => ({ ...prev, [field.field_code]: value }));
    } else {
      setCustomFields((prev) => ({ ...prev, [field.field_code]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    for (const f of fields) {
      const isSys = f.is_system !== false;
      const val = isSys ? formData[f.field_code] : customFields[f.field_code];
      if (f.required && (val === undefined || val === null || val === '')) {
        notify.error(`${f.label} is required.`);
        return;
      }
    }

    const payload = {
      ...formData,
      custom_fields: customFields
    };

    await onSubmit(payload);
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500 animate-pulse">
        Loading dynamic configuration for {entity}...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {sections.map((section, sIdx) => (
        <div key={sIdx} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            {section.title}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {section.fields.map((field) => {
              const isSys = field.is_system !== false;
              const val = isSys
                ? formData[field.field_code] ?? (field.default_value || '')
                : customFields[field.field_code] ?? (field.default_value || '');

              const isDisabled = field.editable === false;

              return (
                <div key={field.field_code} className={field.input_type === 'textarea' ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>

                  {field.input_type === 'select' ? (
                    <select
                      value={val}
                      onChange={(e) => handleChange(field, e.target.value)}
                      disabled={isDisabled}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
                    >
                      <option value="">Select {field.label}</option>
                      {(field.options || []).map((opt, oIdx) => (
                        <option key={oIdx} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.input_type === 'textarea' ? (
                    <textarea
                      value={val}
                      onChange={(e) => handleChange(field, e.target.value)}
                      disabled={isDisabled}
                      rows={3}
                      placeholder={field.placeholder || ''}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  ) : field.input_type === 'checkbox' ? (
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        checked={Boolean(val)}
                        onChange={(e) => handleChange(field, e.target.checked)}
                        disabled={isDisabled}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400">{field.description || field.label}</span>
                    </div>
                  ) : field.input_type === 'currency' || field.input_type === 'number' ? (
                    <div className="relative">
                      {field.input_type === 'currency' && (
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">₹</span>
                      )}
                      <input
                        type="number"
                        step={field.input_type === 'currency' ? '0.01' : '1'}
                        value={val}
                        onChange={(e) => handleChange(field, e.target.value === '' ? '' : Number(e.target.value))}
                        disabled={isDisabled}
                        placeholder={field.placeholder || '0.00'}
                        className={`w-full ${field.input_type === 'currency' ? 'pl-7' : 'px-3'} py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white`}
                      />
                    </div>
                  ) : (
                    <input
                      type={field.input_type === 'date' ? 'date' : 'text'}
                      value={val}
                      onChange={(e) => handleChange(field, e.target.value)}
                      disabled={isDisabled}
                      placeholder={field.placeholder || ''}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  )}

                  {field.description && (
                    <p className="text-[10px] text-slate-400 mt-1">{field.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel || (mode === 'create' ? 'Create Entity' : 'Update Entity')}
        </Button>
      </div>
    </form>
  );
};

export default DynamicForm;
