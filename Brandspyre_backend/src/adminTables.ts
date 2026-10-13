
import {adminlanguageMasterInfo} from './db/ModelSceham/adminSession/languagemaster'
import {adminLeaveTypeMasterInfo} from './db/ModelSceham/adminSession/leavetype'
import {adminsoftwareMasterInfo} from './db/ModelSceham/adminSession/softwaremaster'


export const InitializeAllAdminTables = async () => {
    const tableInitializers = [
        { name: "Master Languages", fn: adminlanguageMasterInfo },
        { name: "Master Leave Types", fn: adminLeaveTypeMasterInfo },
        { name: "Master Softwares", fn: adminsoftwareMasterInfo }
    ];

    const failedTables = [];
    const successfulTables: string[] = [];

    for (const { name, fn } of tableInitializers) {
        try {
            await fn();
            successfulTables.push(name);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error(`❌ Error initializing ${name}: ${errorMsg}`);
            failedTables.push({ table: name, error: errorMsg });
        }
    }

    if (failedTables.length > 0) {
        return {
            status: false,
            message: "Some tables failed to initialize.",
            failedTables
        };
    } else {
        return {
            status: true,
            message: `All user tables initialized successfully: ${successfulTables.join(", ")}`
        };
    }
};