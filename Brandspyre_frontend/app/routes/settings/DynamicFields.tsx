import React, { useState, useEffect } from "react";
import { notify } from "~/services/notificationService";
import { apiClient } from "src/services/apiClient";
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';

interface FieldDefinition {
  id?: number;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options: string[];
  is_required: boolean;
  category: string;
  display_order: number;
  is_active: boolean;
}

export default function DynamicFields() {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const [newField, setNewField] = useState<FieldDefinition>({
    field_name: '',
    field_label: '',
    field_type: 'text',
    field_options: [],
    is_required: false,
    category: 'general',
    display_order: 0,
    is_active: true
  });

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'Date & Time' },
    { value: 'select', label: 'Dropdown (Single Select)' },
    { value: 'multiselect', label: 'Multi Select' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'file', label: 'File Upload' },
    { value: 'url', label: 'URL' },
    { value: 'currency', label: 'Currency' },
    { value: 'percentage', label: 'Percentage' }
  ];

  const categories = [
    'general',
    'contact',
    'business',
    'personal',
    'custom'
  ];

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const response = await apiClient.get('/business/dynamic-fields');
      const result = response.data;
      if (result.success || result.data) {
        setFields(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
      notify.error('Failed to load dynamic fields');
    }
  };

  const handleSaveField = async () => {
    try {
      const payload = {
        ...newField,
        field_options: newField.field_options
      };

      const response = await apiClient.post('/business/dynamic-fields', payload);

      if (response.status === 200 || response.status === 201) {
        notify.success('Field created successfully');
        setNewField({
          field_name: '',
          field_label: '',
          field_type: 'text',
          field_options: [],
          is_required: false,
          category: 'general',
          display_order: 0,
          is_active: true
        });
        setIsEditing(false);
        fetchFields();
      } else {
        notify.error(response.data?.error || 'Failed to create field');
      }
    } catch (error: any) {
      console.error('Error saving field:', error);
      notify.error(error.response?.data?.error || 'Failed to save field');
    }
  };

  const handleUpdateField = async () => {
    if (!editingField?.id) return;

    try {
      const payload = {
        ...editingField,
        field_options: editingField.field_options
      };

      const response = await apiClient.put(`/business/dynamic-fields/${editingField.id}`, payload);

      if (response.status === 200) {
        notify.success('Field updated successfully');
        setEditingField(null);
        fetchFields();
      } else {
        notify.error(response.data?.error || 'Failed to update field');
      }
    } catch (error: any) {
      console.error('Error updating field:', error);
      notify.error(error.response?.data?.error || 'Failed to update field');
    }
  };

  const handleDeleteField = async (fieldId: number) => {
    if (!confirm('Are you sure you want to delete this field?')) return;

    try {
      const response = await apiClient.delete(`/business/dynamic-fields/${fieldId}`);

      if (response.status === 200) {
        notify.success('Field deleted successfully');
        fetchFields();
      } else {
        notify.error(response.data?.error || 'Failed to delete field');
      }
    } catch (error: any) {
      console.error('Error deleting field:', error);
      notify.error(error.response?.data?.error || 'Failed to delete field');
    }
  };

  const handleAddOption = () => {
    if (editingField) {
      setEditingField({
        ...editingField,
        field_options: [...editingField.field_options, '']
      });
    } else {
      setNewField({
        ...newField,
        field_options: [...newField.field_options, '']
      });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (editingField) {
      setEditingField({
        ...editingField,
        field_options: editingField.field_options.filter((_, i) => i !== index)
      });
    } else {
      setNewField({
        ...newField,
        field_options: newField.field_options.filter((_, i) => i !== index)
      });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    if (editingField) {
      const newOptions = [...editingField.field_options];
      newOptions[index] = value;
      setEditingField({
        ...editingField,
        field_options: newOptions
      });
    } else {
      const newOptions = [...newField.field_options];
      newOptions[index] = value;
      setNewField({
        ...newField,
        field_options: newOptions
      });
    }
  };

  const renderFieldForm = (field: FieldDefinition, isEdit: boolean) => (
    <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Field Name *</label>
          <input
            type="text"
            value={field.field_name}
            onChange={(e) => isEdit 
              ? setEditingField({ ...field, field_name: e.target.value })
              : setNewField({ ...newField, field_name: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., customer_phone"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Field Label *</label>
          <input
            type="text"
            value={field.field_label}
            onChange={(e) => isEdit 
              ? setEditingField({ ...field, field_label: e.target.value })
              : setNewField({ ...newField, field_label: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., Customer Phone"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Field Type *</label>
          <select
            value={field.field_type}
            onChange={(e) => isEdit 
              ? setEditingField({ ...field, field_type: e.target.value, field_options: [] })
              : setNewField({ ...newField, field_type: e.target.value, field_options: [] })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            {fieldTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={field.category}
            onChange={(e) => isEdit 
              ? setEditingField({ ...field, category: e.target.value })
              : setNewField({ ...newField, category: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
          <input
            type="number"
            value={field.display_order}
            onChange={(e) => isEdit 
              ? setEditingField({ ...field, display_order: parseInt(e.target.value) || 0 })
              : setNewField({ ...newField, display_order: parseInt(e.target.value) || 0 })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            min="0"
          />
        </div>

        <div className="flex items-center pt-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={field.is_required}
              onChange={(e) => isEdit 
                ? setEditingField({ ...field, is_required: e.target.checked })
                : setNewField({ ...newField, is_required: e.target.checked })
              }
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Required Field</span>
          </label>
        </div>
      </div>

      {(field.field_type === 'select' || field.field_type === 'multiselect') && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
          {field.field_options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Option text"
              />
              <button
                type="button"
                onClick={() => handleRemoveOption(index)}
                className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddOption}
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm font-medium"
          >
            + Add Option
          </button>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => {
            setIsEditing(false);
            setEditingField(null);
          }}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={isEdit ? handleUpdateField : handleSaveField}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Save size={16} />
          {isEdit ? 'Update Field' : 'Create Field'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dynamic Fields Management</h1>
        <p className="text-gray-600 mt-1">Create and manage custom fields for your CRM</p>
      </div>

      {!isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Add New Field
        </button>
      )}

      {isEditing && !editingField && renderFieldForm(newField, false)}

      {editingField && renderFieldForm(editingField, true)}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Existing Fields</h2>
        {fields.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No custom fields created yet</p>
        ) : (
          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{field.field_label}</h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {field.field_type}
                      </span>
                      {field.is_required && (
                        <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                          Required
                        </span>
                      )}
                      {!field.is_active && (
                        <span className="px-2 py-1 bg-gray-300 text-gray-600 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Field Name: {field.field_name} | Category: {field.category}
                    </p>
                    {(field.field_type === 'select' || field.field_type === 'multiselect') && field.field_options.length > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Options: {field.field_options.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingField(field)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteField(field.id!)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
