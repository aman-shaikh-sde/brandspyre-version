import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { BuyerUser, IBuyerUser } from '../../db/ModelSceham/marketplaceSchema';
import { UserInfo } from '../../db/ModelSceham/userSchema';
import { UserTenant, Tenant } from '../../db/ModelSceham/saasSchema';
import { getAccessTokenSecret } from '../../middleware/token';

export interface MarketplaceAuthRequest extends Request {
  buyer?: {
    id: string;
    _id?: string;
    email: string;
    name: string;
    isOrgUser?: boolean;
    orgId?: string;
    companyName?: string;
  };
}

const generateBuyerToken = (payload: {
  id: string;
  email: string;
  name: string;
  isOrgUser?: boolean;
  orgId?: string;
  companyName?: string;
}) => {
  const secret = getAccessTokenSecret();
  return jwt.sign(payload, secret, { expiresIn: '30d' });
};

export class MarketplaceAuthController {
  /**
   * POST /api/marketplace/auth/register
   * Register a new public buyer account
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, phone, company_name } = req.body;

      if (!name || !email || !password || !phone) {
        res.status(400).json({ success: false, error: 'Name, email, password, and phone number are required.' });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existingBuyer = await BuyerUser.findOne({ email: normalizedEmail });
      if (existingBuyer) {
        res.status(400).json({ success: false, error: 'An account with this email already exists.' });
        return;
      }

      // Check if this email is already a registered Brandspyre organization user
      const existingOrgUser = await UserInfo.findOne({ email: normalizedEmail });
      let isOrgUser = false;
      let linkedUserId: any = undefined;
      let linkedTenantId: any = undefined;
      let companyName = company_name?.trim() || '';

      if (existingOrgUser) {
        isOrgUser = true;
        linkedUserId = existingOrgUser._id;
        if (existingOrgUser.tenant_id) {
          linkedTenantId = existingOrgUser.tenant_id;
          const tenant = await Tenant.findById(linkedTenantId).lean();
          if (tenant) {
            companyName = (tenant as any).company_name || companyName;
          }
        }
      }

      const buyer = await BuyerUser.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        phone: phone.trim(),
        company_name: companyName,
        is_org_user: isOrgUser,
        linked_user_id: linkedUserId,
        linked_tenant_id: linkedTenantId,
        addresses: []
      });

      const token = generateBuyerToken({
        id: buyer._id.toString(),
        email: buyer.email,
        name: buyer.name,
        isOrgUser,
        orgId: linkedTenantId ? linkedTenantId.toString() : undefined,
        companyName
      });

      res.status(201).json({
        success: true,
        message: 'Account registered successfully!',
        token,
        buyer: {
          id: buyer._id,
          name: buyer.name,
          email: buyer.email,
          phone: buyer.phone,
          company_name: buyer.company_name,
          is_org_user: buyer.is_org_user,
          org_id: buyer.linked_tenant_id,
          addresses: buyer.addresses
        }
      });
    } catch (err: any) {
      console.error('Error in marketplace register:', err);
      res.status(500).json({ success: false, error: err.message || 'Registration failed.' });
    }
  }

  /**
   * POST /api/marketplace/auth/login
   * Unified login for both public buyers and Brandspyre organization users
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required.' });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();

      // 1. Check in BuyerUser collection first
      let buyer = await BuyerUser.findOne({ email: normalizedEmail });

      if (buyer) {
        const isMatch = await buyer.comparePassword(password);
        if (isMatch) {
          const token = generateBuyerToken({
            id: buyer._id.toString(),
            email: buyer.email,
            name: buyer.name,
            isOrgUser: buyer.is_org_user,
            orgId: buyer.linked_tenant_id?.toString(),
            companyName: buyer.company_name
          });

          res.status(200).json({
            success: true,
            message: 'Logged in successfully!',
            token,
            buyer: {
              id: buyer._id,
              name: buyer.name,
              email: buyer.email,
              phone: buyer.phone,
              company_name: buyer.company_name,
              is_org_user: buyer.is_org_user,
              org_id: buyer.linked_tenant_id,
              addresses: buyer.addresses
            }
          });
          return;
        }
      }

      // 2. Fallback: Authenticate via Brandspyre ERP UserInfo (Single Sign-On for organizations)
      const orgUser: any = await UserInfo.findOne({ email: normalizedEmail }).lean();
      if (orgUser && orgUser.password) {
        const isMatch = await bcrypt.compare(password, orgUser.password);
        if (isMatch) {
          // Resolve organization tenant
          let tenantId = orgUser.tenant_id ? orgUser.tenant_id.toString() : undefined;
          let companyName = '';

          if (!tenantId) {
            const userTenant: any = await UserTenant.findOne({ user_id: orgUser._id, is_active: true });
            if (userTenant) tenantId = userTenant.tenant_id.toString();
          }

          if (tenantId) {
            const tenant: any = await Tenant.findById(tenantId).lean();
            if (tenant) companyName = tenant.company_name || tenant.name || '';
          }

          // Link or provision BuyerUser representation for this organization user
          if (!buyer) {
            buyer = await BuyerUser.create({
              name: `${orgUser.firstname || ''} ${orgUser.lastname || ''}`.trim() || orgUser.username || 'Organization Member',
              email: normalizedEmail,
              password,
              phone: orgUser.phonenumber || orgUser.emergency_contact_phone || '9999999999',
              company_name: companyName,
              is_org_user: true,
              linked_user_id: orgUser._id,
              linked_tenant_id: tenantId ? new mongoose.Types.ObjectId(tenantId) : undefined,
              addresses: []
            });
          } else {
            buyer.is_org_user = true;
            buyer.linked_user_id = orgUser._id;
            if (tenantId) buyer.linked_tenant_id = new mongoose.Types.ObjectId(tenantId);
            if (companyName) buyer.company_name = companyName;
            await buyer.save();
          }

          const token = generateBuyerToken({
            id: buyer._id.toString(),
            email: buyer.email,
            name: buyer.name,
            isOrgUser: true,
            orgId: tenantId,
            companyName
          });

          res.status(200).json({
            success: true,
            message: 'Logged in successfully with Brandspyre organization credentials!',
            token,
            buyer: {
              id: buyer._id,
              name: buyer.name,
              email: buyer.email,
              phone: buyer.phone,
              company_name: buyer.company_name,
              is_org_user: true,
              org_id: tenantId,
              addresses: buyer.addresses
            }
          });
          return;
        }
      }

      res.status(401).json({ success: false, error: 'Invalid email or password.' });
    } catch (err: any) {
      console.error('Error in marketplace login:', err);
      res.status(500).json({ success: false, error: err.message || 'Login failed.' });
    }
  }

  /**
   * GET /api/marketplace/auth/me
   */
  static async getMe(req: MarketplaceAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.buyer?.id) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const buyer: any = await BuyerUser.findById(req.buyer.id).select('-password').lean();
      if (!buyer) {
        res.status(404).json({ success: false, error: 'User profile not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        buyer: {
          ...buyer,
          id: buyer._id
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * PUT /api/marketplace/auth/profile
   */
  static async updateProfile(req: MarketplaceAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.buyer?.id) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { name, phone, company_name, tax_id, addresses } = req.body;
      const buyer = await BuyerUser.findById(req.buyer.id);

      if (!buyer) {
        res.status(404).json({ success: false, error: 'User profile not found.' });
        return;
      }

      if (name) buyer.name = name.trim();
      if (phone) buyer.phone = phone.trim();
      if (company_name !== undefined) buyer.company_name = company_name.trim();
      if (tax_id !== undefined) buyer.tax_id = tax_id.trim();
      if (Array.isArray(addresses)) buyer.addresses = addresses;
      buyer.updated_at = new Date();

      await buyer.save();

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully!',
        buyer: {
          id: buyer._id,
          name: buyer.name,
          email: buyer.email,
          phone: buyer.phone,
          company_name: buyer.company_name,
          tax_id: buyer.tax_id,
          is_org_user: buyer.is_org_user,
          addresses: buyer.addresses
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default MarketplaceAuthController;
