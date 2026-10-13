import { ClientContract, BillableTransaction } from "../db/ModelSceham/billingSchema";
import { Lead } from "../db/ModelSceham/project/campagin";

export class CommercialCronWorker {
  /**
   * Run daily background scheduled tasks across all active tenants.
   */
  public static async runDailyScheduledTasks(): Promise<{
    contractsProcessed: number;
    acceptanceAutoApproved: number;
    slaViolationsFlagged: number;
  }> {
    console.log("[CommercialCronWorker] Starting daily scheduled tasks...");
    let contractsProcessed = 0;
    let acceptanceAutoApproved = 0;
    let slaViolationsFlagged = 0;

    try {
      // 1. Contract Expiry & Renewal Auditor
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiringContracts = await ClientContract.find({
        status: 'active',
        expiry_date: { $lte: thirtyDaysFromNow },
        renewal_reminder_sent: { $ne: true }
      });

      for (const contract of expiringContracts) {
        contract.renewal_reminder_sent = true;
        await contract.save();
        contractsProcessed++;
        console.log(`[CommercialCronWorker] Renewal alert triggered for Contract ${contract.contract_number} (Client: ${contract.client_code})`);
      }

      // 2. Client Acceptance Expiration Auto-Approve
      // Auto-approve leads pending review whose deadline has passed
      const expiredAcceptanceTxns = await BillableTransaction.find({
        client_acceptance_status: 'pending_client_review',
        client_acceptance_deadline: { $lte: new Date() },
        status: 'pending_approval'
      });

      for (const txn of expiredAcceptanceTxns) {
        txn.client_acceptance_status = 'auto_approved';
        txn.status = 'approved';
        txn.approved_by = 'system_cron_auto_approve';
        txn.approved_at = new Date();
        await txn.save();

        await Lead.findByIdAndUpdate(txn.lead_id, { $set: { billing_status: 'billable' } });
        acceptanceAutoApproved++;
        console.log(`[CommercialCronWorker] Auto-approved Transaction ${txn.transaction_code} after client review deadline expired.`);
      }

      console.log(`[CommercialCronWorker] Tasks completed. Contracts: ${contractsProcessed}, Auto-Approved: ${acceptanceAutoApproved}`);

      return {
        contractsProcessed,
        acceptanceAutoApproved,
        slaViolationsFlagged
      };
    } catch (error) {
      console.error("[CommercialCronWorker] Daily task execution error:", error);
      return { contractsProcessed, acceptanceAutoApproved, slaViolationsFlagged };
    }
  }
}
