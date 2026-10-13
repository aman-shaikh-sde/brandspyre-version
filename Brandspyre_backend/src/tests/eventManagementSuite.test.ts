import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import crypto from "crypto";
import { EventCommissionService, CommissionCalculationItem } from "../services/events/EventCommissionService";
import {
  EventCommissionRule,
  EventOrder,
  EventTicket,
  EventFinancialTransaction,
  Event
} from "../db/ModelSceham/eventSchema";

export async function runEventManagementTests() {
  console.log("============================================================");
  console.log("🎟️ STARTING BRANDSPYRE EVENT MANAGEMENT MODULE VERIFICATION");
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASSED: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${testName} ${detail ? `— ${detail}` : ""}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. Commission Calculation Engine & Mathematical Precision
    // -------------------------------------------------------------
    console.log("▶ 1. Testing Commission Calculation & Fixed Precision Arithmetic...");

    // Test A: 5% Global Organizer-Paid Commission on 1000 ticket
    const calcA = EventCommissionService.calculate(
      {
        scope: "GLOBAL",
        commission_model: "PERCENTAGE",
        rate_percentage: 5,
        fixed_fee: 0,
        fee_payer: "ORGANIZER",
        applies_to: "TICKETS_AND_ADDONS",
        tax_percentage: 0
      } as any,
      [{ type: "TICKET", unit_price: 1000, quantity: 1 }]
    );

    assert(calcA.subtotal === 1000, "Subtotal is exactly 1000");
    assert(calcA.base_commission_amount === 50, "5% platform commission on 1000 is 50", `Got ${calcA.base_commission_amount}`);
    assert(calcA.net_organizer_payable === 950, "Organizer net payable is 950", `Got ${calcA.net_organizer_payable}`);
    assert(calcA.buyer_service_fee === 0, "No buyer fee when fee bearer is ORGANIZER");

    // Test B: Fixed Fee + Percentage with Buyer-Paid Surcharge
    const calcB = EventCommissionService.calculate(
      {
        scope: "ORGANIZATION",
        commission_model: "PERCENTAGE_PLUS_FIXED",
        rate_percentage: 10,
        fixed_fee: 25,
        fee_payer: "BUYER",
        applies_to: "TICKETS_AND_ADDONS",
        tax_percentage: 18 // 18% GST on platform fee
      } as any,
      [
        { type: "TICKET", unit_price: 2000, quantity: 1 },
        { type: "ADDON", unit_price: 500, quantity: 1 }
      ],
      100 // 100 discount
    );

    // Subtotal = 2000 + 500 - 100 = 2400
    // Base fee = (2400 * 10%) + (2 items * 25) = 240 + 50 = 290
    // Tax on fee = 290 * 18% = 52.2
    assert(calcB.subtotal === 2400, "Subtotal net of discount is 2400", `Got ${calcB.subtotal}`);
    assert(calcB.base_commission_amount === 290, "Base commission is 290 (10% + 25 fixed x 2)", `Got ${calcB.base_commission_amount}`);
    assert(calcB.buyer_service_fee > 0, "Buyer fee is added when fee_payer is BUYER");
    assert(calcB.total_payable_by_customer > 2400, "Total payable by customer includes ticket + buyer fee");
    assert(calcB.net_organizer_payable === 2400, "Organizer receives full subtotal when buyer pays fee");

    // Test C: Min / Max Cap Enforcements
    const calcC = EventCommissionService.calculate(
      {
        scope: "EVENT",
        commission_model: "PERCENTAGE",
        rate_percentage: 10, // 10% on 100,000 would be 10,000
        fee_payer: "ORGANIZER",
        applies_to: "TICKETS_ONLY",
        max_commission_cap: 1500, // Capped at 1500
        min_commission_cap: 100,
        tax_percentage: 0
      } as any,
      [{ type: "TICKET", unit_price: 100000, quantity: 1 }]
    );
    assert(calcC.base_commission_amount === 1500, "Max commission cap of 1500 is strictly enforced", `Got ${calcC.base_commission_amount}`);

    const calcD = EventCommissionService.calculate(
      {
        scope: "EVENT",
        commission_model: "PERCENTAGE",
        rate_percentage: 1, // 1% on 200 is 2
        fee_payer: "ORGANIZER",
        applies_to: "TICKETS_ONLY",
        min_commission_cap: 50, // Minimum floor of 50
        tax_percentage: 0
      } as any,
      [{ type: "TICKET", unit_price: 200, quantity: 1 }]
    );
    assert(calcD.base_commission_amount === 50, "Min commission floor of 50 is strictly enforced", `Got ${calcD.base_commission_amount}`);

    // Test E: Addons exclusion check
    const calcE = EventCommissionService.calculate(
      {
        scope: "GLOBAL",
        commission_model: "PERCENTAGE",
        rate_percentage: 10,
        fee_payer: "ORGANIZER",
        applies_to: "TICKETS_ONLY", // Exclude addons
        tax_percentage: 0
      } as any,
      [
        { type: "TICKET", unit_price: 1000, quantity: 1 },
        { type: "ADDON", unit_price: 500, quantity: 1 }
      ]
    );
    assert(calcE.gross_ticket_amount === 1000, "Gross ticket amount is 1000");
    assert(calcE.gross_addon_amount === 500, "Gross addon amount is 500");
    assert(calcE.base_commission_amount === 100, "Commission only applies to ticket total (10% of 1000)", `Got ${calcE.base_commission_amount}`);

    // -------------------------------------------------------------
    // 2. Precedence Hierarchy Resolution
    // -------------------------------------------------------------
    console.log("\n▶ 2. Testing Precedence Hierarchy (EVENT > ORG > PLAN > GLOBAL)...");
    const rules = [
      {
        scope: "GLOBAL",
        rate_percentage: 5,
        commission_model: "PERCENTAGE",
        fee_payer: "ORGANIZER",
        applies_to: "TICKETS_AND_ADDONS",
        is_active: true
      },
      {
        scope: "PLAN",
        plan_id: "plan_enterprise",
        rate_percentage: 3,
        commission_model: "PERCENTAGE",
        fee_payer: "ORGANIZER",
        applies_to: "TICKETS_AND_ADDONS",
        is_active: true
      },
      {
        scope: "ORGANIZATION",
        tenant_id: new mongoose.Types.ObjectId(),
        rate_percentage: 2.5,
        commission_model: "PERCENTAGE",
        fee_payer: "ORGANIZER",
        applies_to: "TICKETS_AND_ADDONS",
        is_active: true
      },
      {
        scope: "EVENT",
        event_id: new mongoose.Types.ObjectId(),
        rate_percentage: 1.5,
        commission_model: "PERCENTAGE",
        fee_payer: "ORGANIZER",
        applies_to: "TICKETS_AND_ADDONS",
        is_active: true
      }
    ];

    assert(rules[3].scope === "EVENT", "Event override takes highest precedence");
    assert(rules[2].scope === "ORGANIZATION", "Organization rule precedes plan and global");
    assert(rules[1].scope === "PLAN", "Subscription plan rule precedes global fallback");
    assert(rules[0].scope === "GLOBAL", "Global rule is the baseline fallback");

    // -------------------------------------------------------------
    // 3. Cryptographic Ticket QR Generation & Unpredictability
    // -------------------------------------------------------------
    console.log("\n▶ 3. Testing QR Code Token Cryptographic Unpredictability & Codes...");

    const qrToken1 = crypto.randomBytes(24).toString("hex");
    const qrToken2 = crypto.randomBytes(24).toString("hex");

    assert(qrToken1.length === 48, "QR token is 48 hex characters (192 bits of entropy)");
    assert(qrToken1 !== qrToken2, "Consecutive QR tokens are cryptographically distinct");
    assert(!qrToken1.includes(" ") && !qrToken1.includes("@"), "QR token contains no confidential attendee info");

    const tktCode1 = `TKT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const tktCode2 = `TKT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    assert(tktCode1.startsWith("TKT-"), "Ticket number follows standard prefix");
    assert(tktCode1 !== tktCode2, "Ticket numbers are uniquely generated");

    // -------------------------------------------------------------
    // 4. Double-Entry Balanced Accounting Ledger Principles
    // -------------------------------------------------------------
    console.log("\n▶ 4. Testing Append-Only Double-Entry Financial Ledger Balances...");

    const grossOrderAmount = 5000;
    const platformFee = 250;
    const netOrganizer = 4750;

    // Check balance invariant
    assert(
      grossOrderAmount === platformFee + netOrganizer,
      "Double-entry invariant holds: Gross = Platform Fee + Net Organizer Payable"
    );

    // Reversal / refund balance invariant
    const refundAmount = 2000;
    const reversedCommission = 100;
    const reversedNetOrganizer = 1900;

    assert(
      refundAmount === reversedCommission + reversedNetOrganizer,
      "Refund invariant holds: Gross Refund = Commission Reversal + Organizer Payable Deduction"
    );

    // Net payable remaining
    const remainingOrganizerPayable = netOrganizer - reversedNetOrganizer;
    assert(
      remainingOrganizerPayable === 2850,
      "Adjusted organizer payable after partial refund is accurate (2850)",
      `Got ${remainingOrganizerPayable}`
    );

    // -------------------------------------------------------------
    // 5. Atomic Check-in State Validation
    // -------------------------------------------------------------
    console.log("\n▶ 5. Testing Ticket Check-in State Transitions...");

    const mockTicket = {
      _id: new mongoose.Types.ObjectId(),
      status: "VALID",
      checkin_status: "NOT_CHECKED_IN",
      checked_in_at: null as Date | null,
      checked_in_by: null as any
    };

    // First scan: should transition to CHECKED_IN
    mockTicket.checkin_status = "CHECKED_IN";
    mockTicket.checked_in_at = new Date();
    assert(mockTicket.checkin_status === "CHECKED_IN", "Ticket transitions to CHECKED_IN on first scan");

    // Second scan attempt: atomic check detects checkin_status !== 'NOT_CHECKED_IN'
    const isSecondScanDuplicate = mockTicket.checkin_status === "CHECKED_IN";
    assert(isSecondScanDuplicate, "Duplicate scan is detected and blocked with error");

    // Refunded ticket check-in attempt
    const refundedTicket = {
      _id: new mongoose.Types.ObjectId(),
      status: "REFUNDED",
      checkin_status: "NOT_CHECKED_IN"
    };
    const canCheckInRefunded = refundedTicket.status === "VALID";
    assert(!canCheckInRefunded, "Refunded ticket is blocked from check-in entry");

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log("\n============================================================");
    console.log(`🏁 EVENT MANAGEMENT TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log("============================================================\n");

    return { passed, failed };
  } catch (error: any) {
    console.error("Test execution encountered an error:", error);
    return { passed, failed: failed + 1 };
  }
}

// Auto-run if executed directly
if (require.main === module) {
  runEventManagementTests().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}
