import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';
import fs from 'fs';

// Configure DNS for MongoDB Atlas SRV resolution
dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const targetStrings = [
  '6a9950bd35e20e23ad0daf8e',
  '6a996c41bedd43795e72bca4',
  '6a9950bd35e20e23ad0daf90',
  '6a996c41bedd43795e72bca6',
  'amanshaikh05050@gmail.com',
  'santhosh@leadgen.com',
  'EMP-222784',
  'EMP-362867',
  'BR-222784',
  'BR-362867',
  'brandspyre-group',
  'leadgen',
];

const targetObjIds = [
  new mongoose.Types.ObjectId('6a9950bd35e20e23ad0daf8e'),
  new mongoose.Types.ObjectId('6a996c41bedd43795e72bca4'),
  new mongoose.Types.ObjectId('6a9950bd35e20e23ad0daf90'),
  new mongoose.Types.ObjectId('6a996c41bedd43795e72bca6'),
];

function buildFilter() {
  return {
    $or: [
      { _id: { $in: targetObjIds } },
      { tenant_id: { $in: [...targetObjIds, ...targetStrings] } },
      { tenantId: { $in: [...targetObjIds, ...targetStrings] } },
      { user_id: { $in: [...targetObjIds, ...targetStrings] } },
      { userId: { $in: [...targetObjIds, ...targetStrings] } },
      { owner_id: { $in: [...targetObjIds, ...targetStrings] } },
      { email: { $in: targetStrings } },
      { adminEmail: { $in: targetStrings } },
      { staff_id: { $in: targetStrings } },
      { staffId: { $in: targetStrings } },
      { manager_id: { $in: targetStrings } },
      { cashier_id: { $in: targetStrings } },
      { branchcode: { $in: targetStrings } },
      { branch_code: { $in: targetStrings } },
      { slug: { $in: targetStrings } },
      { domain: { $in: targetStrings } },
      { name: { $in: ['BrandSpyre Group', 'leadgen'] } }
    ]
  };
}

async function runSafeCleanup() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/almino';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected successfully to MongoDB.');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Could not obtain database instance.');
  }

  const collections = await db.listCollections().toArray();
  const filter = buildFilter();

  console.log('\n=============================================================');
  console.log('PHASE 1: GATHERING AND BACKING UP TARGET DOCUMENTS');
  console.log('=============================================================');

  const backupData: Record<string, any[]> = {};
  let totalToBackup = 0;

  for (const c of collections) {
    const col = db.collection(c.name);
    try {
      const docs = await col.find(filter).toArray();
      if (docs.length > 0) {
        backupData[c.name] = docs;
        totalToBackup += docs.length;
        console.log(`- ${c.name.padEnd(25)}: Found ${docs.length} document(s) for backup`);
      }
    } catch (err: any) {
      // Ignore system collections or views
    }
  }

  console.log(`\nTotal documents staged for backup: ${totalToBackup}`);

  // Create backup directory
  const backupDir = path.join(__dirname, '../../../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(backupDir, `cleanup_backup_${timestamp}.json`);

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`\n[SUCCESS] Backup saved to: ${backupFilePath}`);
  const stats = fs.statSync(backupFilePath);
  console.log(`Backup file size: ${stats.size} bytes\n`);

  if (totalToBackup === 0) {
    console.log('No documents found to clean. Exiting safely.');
    await mongoose.disconnect();
    return;
  }

  console.log('=============================================================');
  console.log('PHASE 2: PERFORMING SCOPED DELETION');
  console.log('=============================================================');

  let totalDeleted = 0;
  for (const [colName, docs] of Object.entries(backupData)) {
    const col = db.collection(colName);
    const deleteResult = await col.deleteMany(filter);
    console.log(`- ${colName.padEnd(25)}: Deleted ${deleteResult.deletedCount} document(s)`);
    totalDeleted += deleteResult.deletedCount;
  }

  console.log(`\nTotal documents deleted: ${totalDeleted}`);

  console.log('\n=============================================================');
  console.log('PHASE 3: POST-CLEANUP VERIFICATION');
  console.log('=============================================================');

  let remainingTargetDocs = 0;
  for (const c of collections) {
    const col = db.collection(c.name);
    try {
      const count = await col.countDocuments(filter);
      if (count > 0) {
        console.error(`⚠️ WARNING: Collection ${c.name} still has ${count} matching document(s)!`);
        remainingTargetDocs += count;
      }
    } catch (e) {}
  }

  if (remainingTargetDocs === 0) {
    console.log('✅ PASS: All matching documents for the 2 target users/tenants have been completely removed (0 remaining).');
  } else {
    console.error(`❌ FAIL: ${remainingTargetDocs} target document(s) still remain!`);
  }

  // Verify other users and tenants
  const remainingUsers = await db.collection('userinfos').countDocuments({});
  const remainingTenants = await db.collection('tenants').countDocuments({});

  console.log(`\nRemaining users in 'userinfos': ${remainingUsers} (Expected: 14)`);
  console.log(`Remaining tenants in 'tenants': ${remainingTenants} (Expected: 8)`);

  if (remainingUsers === 14 && remainingTenants === 8) {
    console.log('✅ PASS: Exactly 14 platform users and 8 platform tenants remain intact!');
  } else {
    console.warn('⚠️ WARNING: User or tenant count does not match expected exact count.');
  }

  await mongoose.disconnect();
  console.log('\nMongoDB connection closed. Cleanup complete.');
}

runSafeCleanup().catch(err => {
  console.error('Fatal error during cleanup execution:', err);
  process.exit(1);
});
