// ---------------------------------------------------------------
// Conditional Rendering Engine
// Evaluates conditions from template layout_json to determine
// which blocks should be visible when rendering a document.
// ---------------------------------------------------------------

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'exists'
  | 'not_exists'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with';

export interface Condition {
  field: string;
  operator: ConditionOperator;
  value?: any;
}

export interface ConditionGroup {
  logic: 'AND' | 'OR';
  conditions: (Condition | ConditionGroup)[];
}

/**
 * Evaluate a single condition against the provided data context
 */
export function evaluateCondition(condition: Condition, data: Record<string, any>): boolean {
  const fieldValue = getNestedValue(data, condition.field);

  switch (condition.operator) {
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
    case 'not_exists':
      return fieldValue === undefined || fieldValue === null || fieldValue === '';
    case 'equals':
      return String(fieldValue) === String(condition.value);
    case 'not_equals':
      return String(fieldValue) !== String(condition.value);
    case 'greater_than':
      return Number(fieldValue) > Number(condition.value);
    case 'less_than':
      return Number(fieldValue) < Number(condition.value);
    case 'greater_equal':
      return Number(fieldValue) >= Number(condition.value);
    case 'less_equal':
      return Number(fieldValue) <= Number(condition.value);
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
    case 'not_contains':
      return !String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
    case 'starts_with':
      return String(fieldValue).toLowerCase().startsWith(String(condition.value).toLowerCase());
    case 'ends_with':
      return String(fieldValue).toLowerCase().endsWith(String(condition.value).toLowerCase());
    default:
      return true;
  }
}

/**
 * Evaluate a condition group (supports nested AND/OR logic)
 */
export function evaluateConditionGroup(group: ConditionGroup, data: Record<string, any>): boolean {
  if (!group.conditions || group.conditions.length === 0) return true;

  if (group.logic === 'AND') {
    return group.conditions.every(c => evaluateItem(c, data));
  } else {
    return group.conditions.some(c => evaluateItem(c, data));
  }
}

/**
 * Evaluate a single condition or condition group
 */
function evaluateItem(item: Condition | ConditionGroup, data: Record<string, any>): boolean {
  if ('logic' in item) {
    return evaluateConditionGroup(item as ConditionGroup, data);
  }
  return evaluateCondition(item as Condition, data);
}

/**
 * Process layout components, filtering out those whose conditions are not met
 */
export function filterComponentsByConditions(
  components: any[],
  data: Record<string, any>
): any[] {
  return components.filter(component => {
    if (!component.conditions || component.conditions.length === 0) return true;

    const group: ConditionGroup = {
      logic: component.conditionLogic || 'AND',
      conditions: component.conditions
    };

    return evaluateConditionGroup(group, data);
  }).map(component => {
    // Recursively filter children
    if (component.children && Array.isArray(component.children)) {
      return {
        ...component,
        children: filterComponentsByConditions(component.children, data)
      };
    }
    return component;
  });
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function getNestedValue(obj: Record<string, any>, path: string): any {
  const keys = path.split('.');
  let current: any = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }
  return current;
}
