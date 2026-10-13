export const totalLeads = async():Promise<{
    overall: number,
    currentMonth:number, 
    currentYear:number, 
    data:String }> => {
    try {
        const result = {
            overall : 10,
            currentMonth:50,
            currentYear: 5,
            data:"Total are leads"
        }
        return result
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`TotalLeads Error: ${message}`);
        throw new Error(`Error fetching total leads: ${message}`);
    }
}

export const totalClients = async():Promise<{overall: number,currentMonth:number, currentYear:number, data:String }> => {
    try {
        const result = {
            overall : 10,
            currentMonth:50,
            currentYear: 5,
            data:"Total no Clients"
        }
        return result
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`TotalClient Error: ${message}`);
        throw new Error(`Error fetching total Clients: ${message}`);
    }
}

export const totalProject = async():Promise<{overall: number,currentMonth:number, currentYear:number, data:String }> => {
    try {
        const result = {
            overall : 10,
            currentMonth:50,
            currentYear: 5,
            data:"Total no Projects"
        }
        return result
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`TotalProjects Error: ${message}`);
        throw new Error(`Error fetching total Projects: ${message}`);
    }
}

export const totalClientsReport = async():Promise<{overall: number,currentMonth:number, currentYear:number, data:String }> => {
    try {
        const result = {
            overall : 10,
            currentMonth:50,
            currentYear: 5,
            data:"Total no ClientsReport"
        }
        return result
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`TotalClientsReport Error: ${message}`);
        throw new Error(`Error fetching total Clients Report: ${message}`);
    }
}
