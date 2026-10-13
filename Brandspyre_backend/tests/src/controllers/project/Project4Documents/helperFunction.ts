export const buildDynamicInsert = async (data: Record<string, any>) => {
    const keys = Object.keys(data);
    const columns: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [];
  
    keys.forEach((key, index) => {
      const value = data[key];
  
      // Skip undefined or function values
      if (value === undefined || typeof value === "function") return;
  
      columns.push(key);
      placeholders.push(`$${values.length + 1}`);
  
      // If object or array, stringify it (JSONB safe for PostgreSQL)
      if (typeof value === "object" && value !== null) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
    });
  
    return { columns, placeholders, values };
  };