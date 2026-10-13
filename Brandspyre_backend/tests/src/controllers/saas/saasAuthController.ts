import { Request, Response } from 'express';
import AuthService from '../../services/saas/AuthService';
import EmailService from '../../services/email/EmailService';

export const registerWizard = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      companyName,
      industry,
      companySize,
      slug,
      country,
      timezone,
      currency,
      language,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPassword,
      subscriptionPlan,
      billingCycle
    } = req.body;

    if (!companyName || !adminFirstName || !adminLastName || !adminEmail || !adminPassword) {
      res.status(400).json({ error: 'Company name, admin name, email, and password are required.' });
      return;
    }

    const result = await AuthService.registerOrganization({
      companyName,
      industry,
      companySize,
      slug,
      country,
      timezone,
      currency,
      language,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPassword,
      subscriptionPlan,
      billingCycle
    });

    // Asynchronously send Welcome Email with verification link without blocking HTTP response
    if (result && result.tenant && result.adminUser) {
      EmailService.sendWelcomeEmail({
        tenant: result.tenant,
        adminUser: result.adminUser,
        emailVerificationToken: result.emailVerificationToken
      }).catch((err) => {
        console.error('[Registration] Welcome email sending warning:', err?.message || err);
      });
    }

    // SECURITY: Sanitize registration response - NEVER expose emailVerificationToken,
    // passwords, internal user objects, or sensitive tenant metadata to client.
    res.status(201).json({
      success: true,
      message: 'Organization registered successfully with 14-day free trial. Please verify your email.',
      data: {
        tenant: {
          name: result?.tenant?.name || companyName,
          tenant_code: result?.tenant?.tenant_code || null
        },
        adminUser: {
          email: result?.adminUser?.email || adminEmail
        }
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Registration Wizard error:', message);
    res.status(400).json({ error: message });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = (req.query.token || req.body.token) as string;
    if (!token) {
      res.status(400).json({ error: 'Verification token is required.' });
      return;
    }

    const result = await AuthService.verifyEmail(token);
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
};

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/saas/auth'
});

const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/saas/auth'
});

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, device } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'missing_credentials', message: 'Email and password are required.' });
      return;
    }

    // SECURITY: Use server-resolved req.ip ONLY. Never trust req.body.ip.
    const clientIp = req.ip || req.socket.remoteAddress;
    const result = await AuthService.login(email, password, device, clientIp);
    const rt = (result as any).refreshToken;
    if (rt) {
      res.cookie('refreshToken', rt, getRefreshCookieOptions());
    }

    // SECURITY: Never return refresh token in JSON response payload
    const clientResponse = { ...result };
    delete (clientResponse as any).refreshToken;
    if (clientResponse.tokens) {
      delete (clientResponse.tokens as any).refreshToken;
    }

    res.status(200).json(clientResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[Login Failed]:', message);
    // Generic error to prevent account existence enumeration
    res.status(401).json({
      success: false,
      error: 'invalid_credentials',
      message: 'Invalid email or password.'
    });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: 'Email address is required.' });
      return;
    }

    const result = await AuthService.requestPasswordReset(email);
    res.status(200).json(result);
  } catch (error) {
    res.status(200).json({
      success: true,
      message: 'If an account exists with that email, password reset instructions have been sent.'
    });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ success: false, error: 'Reset token and new password are required.' });
      return;
    }

    const result = await AuthService.resetPassword(token, newPassword);
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    // SECURITY: Refresh token MUST come from HttpOnly cookie ONLY.
    // Reject body/query parameters.
    const token = req.cookies && req.cookies.refreshToken;
    if (!token) {
      res.status(401).json({ success: false, error: 'invalid_refresh_token', message: 'Authentication required' });
      return;
    }

    const result = await AuthService.rotateRefreshToken(token);
    const newRt = (result as any)?.refreshToken;
    if (newRt) {
      res.cookie('refreshToken', newRt, getRefreshCookieOptions());
    }

    // Return accessToken and non-sensitive user metadata in JSON response
    res.status(200).json({
      success: true,
      accessToken: result.accessToken,
      user: (result as any)?.user || null
    });
  } catch (error: any) {
    // Clear stale or revoked cookie
    res.clearCookie('refreshToken', getClearCookieOptions());
    const errCode = error?.message === 'membership_inactive'
      ? 'membership_inactive'
      : error?.message === 'invalid_session'
        ? 'invalid_session'
        : 'invalid_refresh_token';

    res.status(401).json({
      success: false,
      error: errCode,
      message: 'Session expired. Please log in again.'
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    const userId = (req as any).user?.userId;
    const sid = (req as any).user?.sid;

    const result = await AuthService.logout(token, userId, sid);
    res.clearCookie('refreshToken', getClearCookieOptions());
    res.status(200).json(result);
  } catch (error) {
    res.clearCookie('refreshToken', getClearCookieOptions());
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  }
};

export const getUserWorkspaces = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const workspaces = await AuthService.getUserWorkspaces(userId);
    res.status(200).json({ success: true, data: workspaces });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

export const switchWorkspace = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { tenantId } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!tenantId) {
      res.status(400).json({ error: 'tenantId is required to switch workspace.' });
      return;
    }

    const result = await AuthService.switchWorkspace(userId, tenantId);
    const newRt = (result as any)?.refreshToken;
    if (newRt) {
      res.cookie('refreshToken', newRt, getRefreshCookieOptions());
    }

    // Strip refreshToken from client JSON
    const clientResult = { ...result };
    delete (clientResult as any).refreshToken;

    res.status(200).json({ success: true, ...clientResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
};

export default {
  registerWizard,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  getUserWorkspaces,
  switchWorkspace
};
