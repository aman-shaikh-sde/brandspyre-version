import mongoose from 'mongoose';
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { LogEntry } from "../../../db/ModelSceham/user/18_loginEntry";
import { RoleAccess } from "../../../db/ModelSceham/roleAccessSchema";
import { UserTenant } from "../../../db/ModelSceham/saasSchema";
import { Branch } from "../../../db/ModelSceham/branchSchema";
import { Request, Response } from "express";
import bcrypt from 'bcrypt';
import { sessionStore, setSession, deleteSession } from "../../../middleware/sessionStore";
import tokenSession from "../../../middleware/token";
import { todayDate, todayTime } from '../../../db/timezone';

export const trimFormated = async (data: any) => {
  return data.trim().toLowerCase();
};

export const loginUsers = async (req: Request, res: Response): Promise<void> => {
  let session: mongoose.ClientSession | null = null;
  try {
    session = await mongoose.startSession();
  } catch (err) {
    console.warn("Mongoose session start failed. Running login query without transaction.", err);
  }

  const exitWithError = async (status: number, message: string) => {
    try {
      if (session) await session.abortTransaction();
    } catch (err) {
      console.error("Rollback error:", err);
    }
    res.status(status).json({ error: message });
  };

  try {
    if (session) session.startTransaction();

    const { email, password, device, ip } = req.body;

    if (!email || !password) {
      return exitWithError(400, "Request body missing");
    }

    const query = UserInfo.findOne({ email: email.toLowerCase() });
    if (session) query.session(session);
    const user = await query.lean() as any;

    if (!user) {
      return exitWithError(404, "User not found");
    }

    if (user.status && user.status.toLowerCase() !== "active") {
      return exitWithError(404, "User is inActive status , please contact Admin");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return exitWithError(401, "Invalid password");
    }

    const userId = user._id.toString();
    const role = (user.role || '').toLowerCase();
    const brcode = user.branchcode;

    // Resolve tenantId securely: Non-platform users MUST be bound to verified UserTenant membership
    const isPlatformAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin', 'platform_admin'].includes(role);
    let tenantId: string | undefined = undefined;
    let activeMembership: any = null;

    if (isPlatformAdmin) {
      tenantId = req.body.tenantId || (req.headers && (req.headers['x-tenant-id'] as string)) || user.tenant_id?.toString();
    } else {
      // Normal users: tenant must come from active UserTenant or user document
      const requestedTenant = req.body.tenantId;
      const userTenantQuery: any = { user_id: user._id, is_active: true };
      if (requestedTenant && mongoose.Types.ObjectId.isValid(requestedTenant)) {
        userTenantQuery.tenant_id = new mongoose.Types.ObjectId(requestedTenant);
      }

      activeMembership = await UserTenant.findOne(userTenantQuery).sort({ created_at: -1 });
      if (activeMembership) {
        tenantId = activeMembership.tenant_id.toString();
      } else if (user.tenant_id) {
        tenantId = user.tenant_id.toString();
      }
    }

    let branchcode = brcode || '';
    if (!branchcode && activeMembership?.default_branch_code) {
      branchcode = activeMembership.default_branch_code;
    }
    // Only use authorized branch assignment — do not fallback to arbitrary tenant branch

    await deleteSession(userId);

    await LogEntry.create([{
      branchcode: branchcode,
      staff_id: userId,
      date: todayDate,
      time: todayTime,
      ip,
      device,
    }], session ? { session } : {});

    const token = await tokenSession.generateTokens(userId, role, branchcode, tenantId);
    if (!token) {
      return exitWithError(400, "Token generation failed");
    }

    await setSession(userId, {
      userId,
      role,
      brcode: branchcode,
      tenantId: tenantId,
      lastSeen: Date.now(),
    });

    const roleQuery = RoleAccess.findOne({ role: role.toLowerCase() });
    if (session) roleQuery.session(session);
    const roleAccessDoc = await roleQuery.lean() as any;

    if (session) await session.commitTransaction();

    const userObj = {
      ...user,
      id: user._id.toString(),
      designation: user.desigantion,
      permanentaddress: user.permantaddress,
      tenantId: tenantId,
      branchcode: branchcode,
    };

    // Set secure HttpOnly cookie for refresh token
    if (token?.refreshToken) {
      res.cookie('refreshToken', token.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });
    }

    res.status(201).json({
      data: [userObj],
      token,
      roleAccess: roleAccessDoc ? [roleAccessDoc] : [],
      tenantId: tenantId,
      branchcode: branchcode,
    });

  } catch (err) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (rollbackErr) {
        console.error("Rollback error in catch:", rollbackErr);
      }
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("Login error:", message);
    res.status(500).json({ error: message });
  } finally {
    if (session) session.endSession();
  }
};
