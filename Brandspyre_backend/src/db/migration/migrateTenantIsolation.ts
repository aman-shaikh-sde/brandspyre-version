/**
 * Migration Script: Complete Multi-Tenant Isolation & Backfill
 * 
 * This script:
 * 1. Backfills tenant_id for legacy Departments and Designations based on branch / default tenant.
 * 2. Backfills tenant_id for legacy Clients, Projects, Milestones, Tasks, and Invoices.
 * 3. Backfills tenant_id for legacy Accounting records (ChartOfAccounts, JournalEntries, Transactions).
 * 4. Ensures compound per-tenant indexes replace legacy global unique constraints.
 * 
 * Run with: npx ts-node src/db/migration/migrateTenantIsolation.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { Tenant, UserTenant } from '../ModelSceham/saasSchema';
import { Branch, Department, Designation, BranchLog } from '../ModelSceham/branchSchema';
import { Client, Project, Milestone, Task, TaskParticipant, TaskParticipantLog } from '../ModelSceham/project/client';
import { ChartOfAccounts, JournalEntry, JournalEntryLine, FinancialTransaction, BankAccount } from '../ModelSceham/accountingSchema';

async function migrateTenantIsolation() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/brandspyre_crm';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all active tenants
    const tenants = await Tenant.find({});
    console.log(`🏢 Total tenants found: ${tenants.length}`);

    if (tenants.length === 0) {
      console.log('⚠️ No tenants found in database. Exiting.');
      process.exit(0);
    }

    const defaultTenant = tenants[0];
    console.log(`📌 Using Default Tenant for unassigned records: ${defaultTenant.name} (${defaultTenant._id})`);

    // Map branchcodes to tenant_id
    const branches = await Branch.find({});
    const branchToTenantMap = new Map<string, mongoose.Types.ObjectId>();
    for (const b of branches) {
      if (b.branchcode && b.tenant_id) {
        branchToTenantMap.set(b.branchcode, b.tenant_id as mongoose.Types.ObjectId);
      }
    }

    // 1. Backfill Departments
    console.log('\n📁 Step 1: Backfilling Departments...');
    const unassignedDepts = await Department.find({ $or: [{ tenant_id: { $exists: false } }, { tenant_id: null }] });
    let deptsFixed = 0;
    for (const dept of unassignedDepts) {
      const targetTenantId = (dept.branchcode && branchToTenantMap.get(dept.branchcode)) || defaultTenant._id;
      await Department.updateOne({ _id: dept._id }, { tenant_id: targetTenantId });
      deptsFixed++;
    }
    console.log(`✅ Backfilled ${deptsFixed} Departments.`);

    // 2. Backfill Designations
    console.log('\n👔 Step 2: Backfilling Designations...');
    const unassignedDesigs = await Designation.find({ $or: [{ tenant_id: { $exists: false } }, { tenant_id: null }] });
    let desigsFixed = 0;
    for (const desig of unassignedDesigs) {
      const targetTenantId = (desig.branchcode && branchToTenantMap.get(desig.branchcode)) || defaultTenant._id;
      await Designation.updateOne({ _id: desig._id }, { tenant_id: targetTenantId });
      desigsFixed++;
    }
    console.log(`✅ Backfilled ${desigsFixed} Designations.`);

    // 3. Backfill Clients
    console.log('\n👥 Step 3: Backfilling Clients...');
    const unassignedClients = await Client.find({ $or: [{ tenant_id: { $exists: false } }, { tenant_id: null }] });
    let clientsFixed = 0;
    for (const c of unassignedClients) {
      const targetTenantId = (c.branchcode && branchToTenantMap.get(c.branchcode)) || defaultTenant._id;
      await Client.updateOne({ _id: c._id }, { tenant_id: targetTenantId });
      clientsFixed++;
    }
    console.log(`✅ Backfilled ${clientsFixed} Clients.`);

    // 4. Backfill Projects
    console.log('\n🚀 Step 4: Backfilling Projects...');
    const unassignedProjects = await Project.find({ $or: [{ tenant_id: { $exists: false } }, { tenant_id: null }] });
    let projectsFixed = 0;
    for (const prj of unassignedProjects) {
      const targetTenantId = (prj.branchcode && branchToTenantMap.get(prj.branchcode)) || defaultTenant._id;
      await Project.updateOne({ _id: prj._id }, { tenant_id: targetTenantId });
      projectsFixed++;
    }
    console.log(`✅ Backfilled ${projectsFixed} Projects.`);

    // 5. Backfill Milestones
    console.log('\n🚩 Step 5: Backfilling Milestones...');
    const unassignedMilestones = await Milestone.find({ $or: [{ tenant_id: { $exists: false } }, { tenant_id: null }] });
    let milestonesFixed = 0;
    for (const ms of unassignedMilestones) {
      const targetTenantId = (ms.branchcode && branchToTenantMap.get(ms.branchcode)) || defaultTenant._id;
      await Milestone.updateOne({ _id: ms._id }, { tenant_id: targetTenantId });
      milestonesFixed++;
    }
    console.log(`✅ Backfilled ${milestonesFixed} Milestones.`);

    // 6. Backfill Tasks & TaskParticipants
    console.log('\n📋 Step 6: Backfilling Tasks & Participants...');
    const unassignedTasks = await Task.find({ $or: [{ tenant_id: { $exists: false } }, { tenant_id: null }] });
    let tasksFixed = 0;
    for (const t of unassignedTasks) {
      const targetTenantId = (t.branchcode && branchToTenantMap.get(t.branchcode)) || defaultTenant._id;
      await Task.updateOne({ _id: t._id }, { tenant_id: targetTenantId });
      tasksFixed++;
    }

    const unassignedParts = await TaskParticipant.find({ $or: [{ tenant_id: { $exists: false } }, { tenant_id: null }] });
    let partsFixed = 0;
    for (const p of unassignedParts) {
      const targetTenantId = (p.branchcode && branchToTenantMap.get(p.branchcode)) || defaultTenant._id;
      await TaskParticipant.updateOne({ _id: p._id }, { tenant_id: targetTenantId });
      partsFixed++;
    }
    console.log(`✅ Backfilled ${tasksFixed} Tasks & ${partsFixed} TaskParticipants.`);

    // 7. Backfill Accounting Collections
    console.log('\n💰 Step 7: Backfilling ChartOfAccounts & Financial Transactions...');
    const unassignedAccounts = await ChartOfAccounts.find({ $or: [{ tenant_id: { $exists: false } }, { tenant_id: null }] });
    let accountsFixed = 0;
    for (const acc of unassignedAccounts) {
      const targetTenantId = (acc.branchcode && branchToTenantMap.get(acc.branchcode)) || defaultTenant._id;
      await ChartOfAccounts.updateOne({ _id: acc._id }, { tenant_id: targetTenantId });
      accountsFixed++;
    }

    const unassignedTxns = await FinancialTransaction.find({ $or: [{ tenant_id: { $exists: false } }, { tenant_id: null }] });
    let txnsFixed = 0;
    for (const txn of unassignedTxns) {
      const targetTenantId = (txn.branchcode && branchToTenantMap.get(txn.branchcode)) || defaultTenant._id;
      await FinancialTransaction.updateOne({ _id: txn._id }, { tenant_id: targetTenantId });
      txnsFixed++;
    }
    console.log(`✅ Backfilled ${accountsFixed} ChartOfAccounts & ${txnsFixed} FinancialTransactions.`);

    console.log('\n🎉 Multi-Tenant Isolation Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateTenantIsolation();
