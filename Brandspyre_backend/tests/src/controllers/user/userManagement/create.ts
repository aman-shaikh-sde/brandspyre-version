import mongoose from 'mongoose';
import crypto from 'crypto';
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { Tenant, UserTenant } from "../../../db/ModelSceham/saasSchema";
import { Request, Response } from "express";
import { encryptPassword } from './helperFunction';
import EmailService from '../../../services/email/EmailService';
import { isPlatformAdminRole } from '../../../middleware/securityContext';

export const trimFormated = async (data: any) => {
  return data.trim().toLowerCase();
};

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const generateNextStaffId = async (branchcode: string): Promise<string> => {
  try {
    const lastUser = await UserInfo.findOne({ branchcode }, 'staff_id')
      .sort({ create_datetime: -1 })
      .lean() as any;

    let nextNumber = 1;

    if (lastUser && lastUser.staff_id) {
      const parts = lastUser.staff_id.split("/");
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }

    const padLength = nextNumber >= 100 ? 3 : 2;
    return `${branchcode}/${String(nextNumber).padStart(padLength, "0")}`;
  } catch (error) {
    console.error("Error generating staff_id:", error);
    throw new Error("Failed to generate staff_id");
  }
};

export const createUsers = async (req: Request, res: Response): Promise<void> => {
  const msgField = `create User's Info`;
  const { brcode } = req.user as AuthenticatedUser;
  const { profile: userDatas } = req.body;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (!Array.isArray(userDatas) || userDatas.length === 0) {
      res.status(400).json({ error: "userDatas must be a non-empty array" });
      await session.abortTransaction();
      return;
    }

    const createdUsers: any[] = [];
    const failedUsers: any[] = [];

    const sanitizeRaw = (raw: any) => {
      const clone = { ...raw };
      delete clone.password;
      delete clone.cpassword;
      delete clone.pass;
      return clone;
    };

    const isCallerPlatformAdmin = (req as any).securityContext?.isPlatformAdmin === true;

    for (const userDataRaw of userDatas) {
      const userData = { ...userDataRaw };
      try {
        // SECURITY: Strip unauthorized sensitive fields to prevent mass assignment
        delete userData.isPlatformAdmin;
        delete userData.isSuperAdmin;
        delete userData.tenant_id;
        delete userData.tenantId;

        userData.role = (userData.role || '').trim().toLowerCase();
        userData.branchcode = userData.branchcode || brcode;

        // SECURITY: Disallow non-platform admins from assigning platform admin roles
        if (isPlatformAdminRole(userData.role) && !isCallerPlatformAdmin) {
          throw new Error("Only platform administrators are authorized to assign platform administrative roles.");
        }

        const requiredFields = ['email', 'password', 'role'];
        const missingFields = requiredFields.filter(field => !userData[field]);
        if (missingFields.length > 0) {
          throw new Error(`Missing field(s): ${missingFields.join(', ')}`);
        }

        for (const key in userData) {
          if (typeof userData[key] === 'string') {
            userData[key] = userData[key].trim();
          }
        }

        userData.password = await encryptPassword(userData.password as string);

        const existingUser = await UserInfo.findOne({
          email: userData.email
        }).session(session).lean();

        if (existingUser) {
          failedUsers.push({
            user: sanitizeRaw(userDataRaw),
            error: `Duplicate user with email: ${userData.email}`,
          });
          continue;
        }

        userData.staff_id = await generateNextStaffId(userData.branchcode);

        if (userData.firstName && !userData.firstname) {
          userData.firstname = userData.firstName;
        }
        if (userData.lastName && !userData.lastname) {
          userData.lastname = userData.lastName;
        }
        if (userData.designation && !userData.desigantion) {
          userData.desigantion = userData.designation;
        }
        if (userData.permanentaddress && !userData.permantaddress) {
          userData.permantaddress = userData.permanentaddress;
        }

        const [createdDoc] = await UserInfo.create([userData], { session });
        const userObj = createdDoc.toObject() as any;
        userObj.id = userObj._id.toString();
        userObj.designation = userObj.desigantion;
        userObj.permanentaddress = userObj.permantaddress;

        // Create UserTenant record so the employee can login via SaaS auth
        const adminTenantId = (req as any).securityContext?.tenantId || (req as any).tenant?.id || (req.user as any)?.tenantId;
        if (adminTenantId) {
          const existingUT = await UserTenant.findOne({
            user_id: createdDoc._id,
            tenant_id: new mongoose.Types.ObjectId(adminTenantId),
          }).session(session);

          if (!existingUT) {
            await UserTenant.create([{
              user_id: createdDoc._id,
              tenant_id: new mongoose.Types.ObjectId(adminTenantId),
              role: userData.role || 'employee',
              status: 'active',
              is_owner: false,
              is_active: true,
              default_branch_code: userData.branchcode || '',
              invited_by: new mongoose.Types.ObjectId(String((req.user as any).userId)),
              joined_at: new Date(),
            }], { session });
          }

          // Also set tenant_id on the user document for direct lookups
          await UserInfo.updateOne(
            { _id: createdDoc._id },
            { $set: { tenant_id: new mongoose.Types.ObjectId(adminTenantId) } }
          ).session(session);
        }

        // Sanitize sensitive credentials from return payload
        delete userObj.password;
        delete userObj.reset_password_token;
        delete userObj.reset_password_expires;

        createdUsers.push(userObj);
      } catch (err) {
        failedUsers.push({
          user: sanitizeRaw(userDataRaw),
          error: (err instanceof Error ? err.message : String(err))
        });
      }
    }

    if (createdUsers.length > 0) {
      await session.commitTransaction();

      // Trigger Employee Account Created Emails via Zoho SMTP (non-blocking)
      (async () => {
        try {
          const tenant = req.user && (req.user as any).tenantId
            ? await Tenant.findById((req.user as any).tenantId)
            : null;
          const companyName = tenant?.name || tenant?.company_name || 'Brandspyre Workspace';

          for (const user of createdUsers) {
            if (user.email) {
              const setupToken = crypto.randomBytes(32).toString('hex');
              const resetExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hrs

              await UserInfo.findByIdAndUpdate(user._id, {
                reset_password_token: setupToken,
                reset_password_expires: resetExpires
              }).catch(() => {});

              await EmailService.sendEmployeeAccountCreatedEmail({
                employee: user,
                companyName,
                setupToken,
                branchName: user.branchcode,
                departmentName: user.department,
                tenantId: user.tenant_id
              }).catch((emailErr) => {
                console.warn(`[UserManagement] Failed to send email to ${user.email}:`, emailErr?.message || emailErr);
              });
            }
          }
        } catch (err) {
          console.warn('[UserManagement] Employee email batch warning:', err);
        }
      })();
    } else {
      await session.abortTransaction();
    }

    if (createdUsers.length === 0 && failedUsers.length > 0) {
      res.status(400).json({
        message: `${msgField} failed.`,
        successCount: 0,
        failedCount: failedUsers.length,
        createdUsers,
        failedUsers
      });
      return;
    }

    res.status(201).json({
      message: `Bulk ${msgField} result`,
      data: {
        successCount: createdUsers.length,
        failedCount: failedUsers.length,
        createdUsers,
        failedUsers
      }
    });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  } finally {
    session.endSession();
  }
};