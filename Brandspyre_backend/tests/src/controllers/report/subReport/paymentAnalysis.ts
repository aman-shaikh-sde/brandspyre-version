export const TotalInvoices = async():Promise<{overall: number,currentMonth:number, currentYear:number, data:String }> => {
    try {
        const result = {
            overall : 10,
            currentMonth:50,
            currentYear: 5,
            data:"Total are Invoices"
        }
        return result
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`TotalInvoices Error: ${message}`);
        throw new Error(`Error fetching total Invoices: ${message}`);
    }
}

export const TotalIncomeExpenses = async():Promise<{
    overall: number,
    currentMonthIncome:number, currentYearIncome:number, 
    currentMonthExpenses:number, currentYearExpenses:number, 
    data:String }> => {
    try {   
        const result = {
            overall : 10,
            currentMonthIncome:50,
            currentYearIncome: 5,
            currentMonthExpenses:50,
            currentYearExpenses: 5,
            data:"Total no Income Expenses"
        }
        return result
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`TotalIncome Expenses Error: ${message}`);
        throw new Error(`Error fetching total Income Expenses: ${message}`);
    }
}


