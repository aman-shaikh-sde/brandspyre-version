# Meta Lead Integration - Setup Guide

This guide provides instructions for setting up the Meta Lead Ads integration for the CRM application.

## Important: Multi-Tenant SaaS Architecture

This is a **multi-tenant SaaS CRM**. Each tenant (organization) connects their own Meta account independently through the UI. The `.env` file contains **only platform-level Meta Developer App credentials**. Tenant-specific configurations (Page IDs, Form IDs, Access Tokens) are stored securely in the database per tenant.

### What Goes in .env (Platform-Level)
- Meta App ID (single app for the entire platform)
- Meta App Secret (single app for the entire platform)
- Server configuration (webhook URLs, encryption keys)

### What Goes in Database (Per-Tenant)
- Each tenant's OAuth access tokens (encrypted)
- Each tenant's selected Facebook Pages
- Each tenant's selected Lead Forms
- Each tenant's field mappings
- Each tenant's assignment rules

## Prerequisites

1. **Meta Developer Account**: You need a Meta (Facebook) Developer account
2. **Meta App**: Create or configure a Meta App with the required permissions
3. **Webhook URL**: Your server must be publicly accessible to receive webhooks from Meta

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Meta/Facebook Integration (Platform-Level)
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_API_VERSION=v19.0
META_REDIRECT_URI=https://your-domain.com/api/meta/oauth/callback
META_WEBHOOK_URL=https://your-domain.com/api/meta/webhook

# Security
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Frontend URL (for OAuth redirect)
FRONTEND_URL=https://your-frontend-domain.com

# Base URL (for webhook configuration)
BASE_URL=https://your-backend-domain.com
```

### Environment Variable Details

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `META_APP_ID` | Yes | Your Meta App ID from Meta Developer Console (single app for platform) | `123456789012345` |
| `META_APP_SECRET` | Yes | Your Meta App Secret from Meta Developer Console (single app for platform) | `abc123def456` |
| `META_API_VERSION` | No | Meta Graph API version (default: v19.0) | `v19.0` |
| `META_REDIRECT_URI` | Yes | OAuth callback URL registered in Meta App | `https://your-domain.com/api/meta/oauth/callback` |
| `META_WEBHOOK_URL` | Yes | Webhook endpoint URL for receiving lead events | `https://your-domain.com/api/meta/webhook` |
| `ENCRYPTION_KEY` | Yes | 32-character key for encrypting tenant access tokens | `your-32-char-encryption-key-here` |
| `FRONTEND_URL` | Yes | Frontend URL for OAuth redirect after connection | `https://your-frontend-domain.com` |
| `BASE_URL` | Yes | Backend base URL for API calls | `https://your-backend-domain.com` |

**Note**: `META_WEBHOOK_VERIFY_TOKEN` is **NOT** in .env. Each tenant gets their own auto-generated verify token stored in the database.

## Meta Developer App Configuration

### Step 1: Create Meta App

1. Go to [Meta Developer Console](https://developers.facebook.com/apps/)
2. Click "Create App"
3. Select "Business" app type
4. Enter app name and contact email
5. Create the app

### Step 2: Add Products

1. In your app dashboard, click "Add Product"
2. Add **Facebook Login**
3. Add **Webhooks**

### Step 3: Configure Facebook Login

1. Go to Facebook Login > Settings
2. Add your redirect URI:
   - `https://your-domain.com/api/meta/oauth/callback`
3. Enable "Client OAuth Login"
4. Enable "Web OAuth Login"

### Step 4: Configure Webhooks

1. Go to Webhooks > Settings
2. Add your webhook URL:
   - `https://your-domain.com/api/meta/webhook`
3. Enter a verify token (use the same as `META_WEBHOOK_VERIFY_TOKEN`)
4. Click "Verify and Save"
5. After verification, subscribe to `page` events
6. Select `leadgen` field for subscription

### Step 5: Request Permissions

1. Go to App Review > Permissions and Features
2. Add and request the following permissions:
   - `pages_manage_engagement`
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `leads_retrieval`
   - `pages_manage_metadata`

3. Submit for review with:
   - App screenshots
   - Use case description
   - Test instructions
   - Privacy policy URL
   - Terms of service URL

### Step 6: Get App Credentials

1. Go to Settings > Basic
2. Copy **App ID** → Set as `META_APP_ID`
3. Copy **App Secret** → Set as `META_APP_SECRET`
4. Generate and copy **App Secret** if not available

## Database Migration

Run the migration to create the necessary database indexes:

```bash
cd Brandspyre_backend
npm run migration:002
```

Or manually run:

```bash
node src/db/migrations/002_add_meta_integration.ts
```

## Webhook Configuration

### Local Development

For local development, use a tunneling service to expose your local server:

```bash
# Using ngrok
ngrok http 3000

# Update META_WEBHOOK_URL to use ngrok URL
# Example: https://abc123.ngrok.io/api/meta/webhook
```

### Production

1. Ensure your server is publicly accessible
2. Configure HTTPS (required by Meta webhooks)
3. Update `META_WEBHOOK_URL` to your production URL
4. Test webhook verification in Meta Developer Console

## Testing the Integration

### 1. Test OAuth Flow (Per-Tenant)

1. Start the backend server
2. Log in as a user from Tenant A
3. Navigate to Settings > Meta Integration in the frontend
4. Click "Connect Meta Account"
5. Authorize the app on Meta with Tenant A's Facebook account
6. Verify connection status shows "Connected"
7. Log out and log in as a user from Tenant B
8. Navigate to Settings > Meta Integration
9. Verify Tenant B shows "Not Connected" (strict isolation)
10. Connect Tenant B with a different Facebook account
11. Verify both tenants have independent connections

### 2. Test Webhook

1. In Meta Developer Console, go to Webhooks > Page Subscriptions
2. Click "Test" next to your webhook
3. Send a test leadgen event
4. Check server logs for webhook receipt
5. Verify lead is created in the correct tenant's CRM

### 3. Test Lead Sync

1. Create a test Lead Ad in Meta Ads Manager for Tenant A's page
2. Submit a test lead through the ad
3. Wait for webhook event (usually within seconds)
4. Check Tenant A's CRM for new lead
5. Verify lead data is mapped correctly
6. Verify Tenant B's CRM has no new lead (strict isolation)

### 4. Test Multi-Tenant Isolation

1. Connect Tenant A to Facebook Page X
2. Connect Tenant B to Facebook Page Y
3. Submit lead to Page X
4. Verify lead appears only in Tenant A's CRM
5. Submit lead to Page Y
6. Verify lead appears only in Tenant B's CRM
7. Verify cross-tenant data leakage does not occur

## Troubleshooting

### Common Issues

**Issue: OAuth redirect fails**
- Verify `META_REDIRECT_URI` matches exactly in Meta App settings
- Check that frontend URL is correctly set
- Ensure app is in "Live" mode (not "Development")

**Issue: Webhook verification fails**
- Verify `META_WEBHOOK_VERIFY_TOKEN` matches in Meta App
- Check that webhook URL is publicly accessible
- Ensure server is running and responding to GET requests

**Issue: Leads not syncing**
- Check webhook subscription is active for the page
- Verify page access token is valid
- Check server logs for errors
- Ensure lead form is enabled in CRM settings

**Issue: Token expired**
- System automatically refreshes long-lived tokens
- If manual refresh needed, disconnect and reconnect
- Check token expiration in database

**Issue: Duplicate leads**
- System uses `meta_lead_id` to prevent duplicates
- Check sync logs for duplicate detection
- Verify webhook is not sending duplicate events

## Security Considerations

1. **Never commit** `.env` file to version control
2. **Rotate** encryption keys periodically
3. **Monitor** webhook payloads for suspicious activity
4. **Limit** permissions to only what's needed
5. **Use** HTTPS in production
6. **Validate** all webhook signatures
7. **Encrypt** all access tokens at rest
8. **Log** security events without exposing sensitive data

## Monitoring

### Key Metrics to Monitor

- Webhook success rate
- Lead sync success rate
- Token expiration alerts
- Error rates by type
- Sync latency

### Log Locations

- Backend: Console logs and application logs
- Database: `MetaLeadSyncLog` collection
- Frontend: Browser console for API errors

## Support

For issues related to:
- **Meta API**: Check [Meta Graph API Documentation](https://developers.facebook.com/docs/graph-api)
- **Webhooks**: Check [Meta Webhooks Guide](https://developers.facebook.com/docs/graph-api/webhooks)
- **CRM Integration**: Check application logs and sync logs

## Maintenance

### Regular Tasks

1. **Monitor token expiration** - Tokens expire after 60 days
2. **Review webhook subscriptions** - Ensure active subscriptions
3. **Check sync logs** - Identify and resolve failed syncs
4. **Update API version** - Keep `META_API_VERSION` current
5. **Review permissions** - Ensure only necessary permissions are granted

### Updates

When Meta deprecates API versions:
1. Update `META_API_VERSION` in `.env`
2. Test with new version in development
3. Update any deprecated API calls
4. Deploy to production after testing
