import { EventEmitter } from "events";
import { BillingEngineService } from "./billingEngineService";

class BillingEventBus extends EventEmitter {}

export const billingEventBus = new BillingEventBus();

// Subscribe Billing Engine Listener to LEAD_STAGE_UPDATED events
billingEventBus.on("LEAD_STAGE_UPDATED", async (payload: {
  leadId: string;
  newStage: string;
  tenantId?: string;
  branchcode?: string;
  updatedBy?: string;
  conversionDate?: Date;
}) => {
  try {
    console.log(`[BillingEventBus] Event received for Lead ${payload.leadId} -> Stage: "${payload.newStage}"`);
    await BillingEngineService.evaluateLeadSuccessStage(
      payload.leadId,
      payload.newStage,
      payload.tenantId,
      payload.branchcode,
      payload.conversionDate
    );
  } catch (error) {
    console.error("[BillingEventBus] Error processing LEAD_STAGE_UPDATED event:", error);
  }
});
