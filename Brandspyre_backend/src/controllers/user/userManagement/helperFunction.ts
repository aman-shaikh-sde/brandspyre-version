import bcrypt from 'bcrypt'

export const buildDynamicInsert = async(data: Record<string, any>)=> {
    const columns: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [];
    let index = 1;
  
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null && value !== "") {
        columns.push(key);
        placeholders.push(`$${index++}`);
        values.push(value);
      }
    }
  
    return { columns, placeholders, values };
  };


  // Create Password Encrypt
  export const encryptPassword = async (password: string): Promise<string> => {
      const hashed = await bcrypt.hash(password, 10); // 10 is the salt rounds
      return hashed;
    };