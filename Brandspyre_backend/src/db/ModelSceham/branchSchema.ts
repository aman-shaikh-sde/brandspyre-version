import mongoose, { Schema, Document } from "mongoose";

export interface IBranch extends Document {
  branchcode?: string;
  role?: string;
  name?: string;
  branch_hours?: string;
  location?: string;
  mobile?: string;
  email?: string;
  manager_id?: string;
  managerName?: string;
  notes?: string;
  status?: string;
  closeReason?: string;
  create_datetime?: Date;
  last_update_datetime?: Date;
  // Multi-tenant SaaS field
  tenant_id?: mongoose.Types.ObjectId;
}

export interface IBranchLog extends Document {
  branch_id: mongoose.Types.ObjectId;
  branchcode?: string;
  role?: string;
  name?: string;
  branch_hours?: string;
  location?: string;
  mobile?: string;
  email?: string;
  manager_id?: string;
  managerName?: string;
  notes?: string;
  status?: string;
  closeReason?: string;
  changedBy?: string;
  last_update_datetime?: Date;
  tenant_id?: mongoose.Types.ObjectId;
}

const BranchSchema = new Schema<IBranch>({
  branchcode: { type: String },
  role: { type: String },
  name: { type: String },
  branch_hours: { type: String },
  location: { type: String },
  mobile: { type: String },
  email: { type: String },
  manager_id: { type: String },
  managerName: { type: String },
  notes: { type: String },
  status: { type: String, default: 'active' },
  closeReason: { type: String },
  create_datetime: { type: Date, default: Date.now },
  last_update_datetime: { type: Date, default: Date.now },
  // Multi-tenant SaaS field
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' }
});

// Add compound index for tenant isolation
BranchSchema.index({ tenant_id: 1, branchcode: 1 });

const BranchLogSchema = new Schema<IBranchLog>({
  branch_id: { type: Schema.Types.ObjectId, ref: 'Branch' },
  branchcode: { type: String },
  role: { type: String },
  name: { type: String },
  branch_hours: { type: String },
  location: { type: String },
  mobile: { type: String },
  email: { type: String },
  manager_id: { type: String },
  managerName: { type: String },
  notes: { type: String },
  status: { type: String, default: 'active' },
  closeReason: { type: String },
  changedBy: { type: String },
  last_update_datetime: { type: Date, default: Date.now },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' }
});

const DepartmentSchema = new Schema({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  branchcode: { type: String, required: true },
  name: { type: String, required: true }
}, { timestamps: true });

DepartmentSchema.index({ tenant_id: 1, branchcode: 1, name: 1 });

const DesignationSchema = new Schema({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  branchcode: { type: String, required: true },
  name: { type: String, required: true },
  department: { type: String, required: true }
}, { timestamps: true });

DesignationSchema.index({ tenant_id: 1, branchcode: 1, name: 1 });

export const Branch = mongoose.models.Branch || mongoose.model<IBranch>('Branch', BranchSchema);
export const BranchLog = mongoose.models.BranchLog || mongoose.model<IBranchLog>('BranchLog', BranchLogSchema);
export const Department = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);
export const Designation = mongoose.models.Designation || mongoose.model('Designation', DesignationSchema);

export const staticBranchData = {
  branchcode: 'BRCODE_01',
  role: "superadmin",
  name: 'mainbranch',
  branch_hours: "24",
  location: "mainBranch",
  mobile: "00000000000",
  email: "alminoadmin@gmail.com",
  manager_id: "SUPERADMIN_01",
  managerName: "superadminManager",
  notes: null,
  status: 'active',
  closeReason: null,
  changedBy: "superAdmin"
}

export const initializeBranches = async () => {
  try {
    const existingBranch = await Branch.findOne({
      name: staticBranchData.name.toLowerCase(),
      role: staticBranchData.role.toLowerCase()
    });

    if (existingBranch) {
      console.log("Branch with this name and location already exists.");
      return;
    }

    const newBranch = await Branch.create({
      branch_hours: staticBranchData.branch_hours,
      branchcode: staticBranchData.branchcode,
      role: staticBranchData.role.toLowerCase(),
      name: staticBranchData.name.toLowerCase(),
      location: staticBranchData.location.toLowerCase(),
      mobile: staticBranchData.mobile,
      email: staticBranchData.email,
      manager_id: staticBranchData.manager_id,
      managerName: staticBranchData.managerName,
      notes: staticBranchData.notes || null,
      status: staticBranchData.status || 'active',
      closeReason: staticBranchData.closeReason || null
    });

    await BranchLog.create({
      branch_id: newBranch._id,
      branch_hours: staticBranchData.branch_hours,
      branchcode: staticBranchData.branchcode,
      role: staticBranchData.role.toLowerCase(),
      name: staticBranchData.name.toLowerCase(),
      location: staticBranchData.location.toLowerCase(),
      mobile: staticBranchData.mobile,
      email: staticBranchData.email,
      manager_id: staticBranchData.manager_id,
      managerName: staticBranchData.managerName,
      notes: staticBranchData.notes || null,
      status: staticBranchData.status || 'active',
      closeReason: staticBranchData.closeReason || null,
      changedBy: staticBranchData.changedBy
    });

    console.log("✅ Branch_Tables checked/initialized successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing Branch_Tables Message: ${message}`);
    throw new Error(`Error initializing Branch_Tables Message: ${message}`);
  }
};


