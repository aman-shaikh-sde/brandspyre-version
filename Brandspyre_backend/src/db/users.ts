import { UserInfo } from "./ModelSceham/userSchema";

export async function getAllUsers() {
  const result = await (async () => {
        const rows = await UserInfo.find({  }).lean() as any[];
        return {
          rows: rows.map(r => ({
            ...r,
            id: r._id.toString(),
            
          })),
          rowCount: rows.length
        };
      })();
  return result.rows;
}
