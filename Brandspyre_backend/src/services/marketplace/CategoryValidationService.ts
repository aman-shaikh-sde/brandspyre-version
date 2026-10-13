import { ICategoryFormSchema, IFormFieldDefinition } from '../../db/ModelSceham/marketplaceCategorySchema';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData: Record<string, any>;
}

export class CategoryValidationService {
  /**
   * Validate dynamic form submission data against a CategoryFormSchema
   */
  static validate(schema: ICategoryFormSchema, inputData: Record<string, any>): ValidationResult {
    const errors: Record<string, string> = {};
    const sanitizedData: Record<string, any> = {};

    if (!schema || !Array.isArray(schema.fields)) {
      return { isValid: true, errors: {}, sanitizedData: inputData || {} };
    }

    const data = inputData || {};

    for (const field of schema.fields) {
      const key = field.key;
      let rawVal = data[key];

      // Check conditional visibility: if condition is not met, field is skipped
      if (field.conditional && field.conditional.depends_on) {
        const parentVal = data[field.conditional.depends_on];
        if (parentVal !== field.conditional.show_when) {
          continue; // Not active in current condition
        }
      }

      // Check Required
      const isMissing = rawVal === undefined || rawVal === null || (typeof rawVal === 'string' && rawVal.trim() === '');
      if (field.required && isMissing) {
        errors[key] = `${field.label || key} is required.`;
        continue;
      }

      if (isMissing) {
        if (field.default_value !== undefined) {
          sanitizedData[key] = field.default_value;
        }
        continue;
      }

      // Validate by field type
      let validatedVal = rawVal;
      switch (field.type) {
        case 'number':
        case 'currency': {
          const num = Number(rawVal);
          if (isNaN(num)) {
            errors[key] = `${field.label || key} must be a valid number.`;
          } else {
            if (field.validation?.min !== undefined && num < field.validation.min) {
              errors[key] = `${field.label || key} cannot be less than ${field.validation.min}.`;
            }
            if (field.validation?.max !== undefined && num > field.validation.max) {
              errors[key] = `${field.label || key} cannot exceed ${field.validation.max}.`;
            }
            validatedVal = num;
          }
          break;
        }

        case 'text':
        case 'textarea': {
          const str = String(rawVal).trim();
          if (field.validation?.min_length !== undefined && str.length < field.validation.min_length) {
            errors[key] = `${field.label || key} must have at least ${field.validation.min_length} characters.`;
          }
          if (field.validation?.max_length !== undefined && str.length > field.validation.max_length) {
            errors[key] = `${field.label || key} cannot exceed ${field.validation.max_length} characters.`;
          }
          if (field.validation?.pattern) {
            try {
              const regex = new RegExp(field.validation.pattern);
              if (!regex.test(str)) {
                errors[key] = `${field.label || key} has an invalid format.`;
              }
            } catch (e) {
              // Ignore invalid regex patterns
            }
          }
          validatedVal = str;
          break;
        }

        case 'select':
        case 'radio': {
          if (field.options && field.options.length > 0) {
            const allowedValues = field.options.map(opt => String(opt.value));
            if (!allowedValues.includes(String(rawVal))) {
              errors[key] = `Invalid selection for ${field.label || key}.`;
            }
          }
          validatedVal = rawVal;
          break;
        }

        case 'multiselect':
        case 'tags': {
          if (!Array.isArray(rawVal)) {
            errors[key] = `${field.label || key} must be an array of values.`;
          } else {
            if (field.type === 'multiselect' && field.options && field.options.length > 0) {
              const allowedValues = field.options.map(opt => String(opt.value));
              const invalidItem = rawVal.find(item => !allowedValues.includes(String(item)));
              if (invalidItem) {
                errors[key] = `Invalid choice "${invalidItem}" in ${field.label || key}.`;
              }
            }
            validatedVal = rawVal;
          }
          break;
        }

        case 'checkbox': {
          validatedVal = Boolean(rawVal);
          break;
        }

        case 'date': {
          const d = new Date(rawVal);
          if (isNaN(d.getTime())) {
            errors[key] = `${field.label || key} must be a valid date.`;
          } else {
            validatedVal = d.toISOString();
          }
          break;
        }

        case 'daterange': {
          if (typeof rawVal !== 'object' || (!rawVal.start && !rawVal.from)) {
            errors[key] = `${field.label || key} must be a valid date range.`;
          } else {
            validatedVal = rawVal;
          }
          break;
        }

        case 'image_upload':
        case 'document_upload': {
          if (Array.isArray(rawVal)) {
            validatedVal = rawVal.filter(url => typeof url === 'string' && url.trim().length > 0);
          } else if (typeof rawVal === 'string') {
            validatedVal = [rawVal];
          }
          break;
        }

        case 'repeater': {
          if (!Array.isArray(rawVal)) {
            errors[key] = `${field.label || key} must be a list of items.`;
          } else {
            validatedVal = rawVal;
          }
          break;
        }

        default:
          validatedVal = rawVal;
      }

      sanitizedData[key] = validatedVal;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData
    };
  }
}
