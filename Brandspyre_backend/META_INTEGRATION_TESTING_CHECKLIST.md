# Meta Lead Integration - Testing Checklist

This checklist provides comprehensive testing procedures for the Meta Lead Ads integration.

## Pre-Deployment Testing

### Environment Setup
- [ ] All environment variables are configured correctly
- [ ] Database migration has been run successfully
- [ ] Meta Developer App is configured with correct permissions
- [ ] Webhook URL is publicly accessible
- [ ] HTTPS is configured for production
- [ ] Encryption key is set and secure

### Backend Testing

#### Database Models
- [ ] `MetaIntegration` model creates documents correctly
- [ ] `MetaLeadForm` model creates documents correctly
- [ ] `MetaLeadSyncLog` model creates documents correctly
- [ ] Token encryption/decryption works correctly
- [ ] Indexes are created on all collections
- [ ] `meta_lead_id` index exists on Lead collection

#### OAuth Flow
- [ ] `/api/meta/oauth/connect` returns valid OAuth URL
- [ ] OAuth URL includes correct state parameter
- [ ] OAuth URL includes all required scopes
- [ ] `/api/meta/oauth/callback` handles successful authorization
- [ ] Callback exchanges code for access token
- [ ] Callback obtains long-lived token
- [ ] Token expiration is calculated correctly
- [ ] Integration record is created/updated correctly
- [ ] Webhook verify token is generated
- [ ] Redirect to frontend works correctly
- [ ] Error handling for invalid codes
- [ ] Error handling for expired tokens

#### Page & Form Management
- [ ] `/api/meta/pages` fetches user's Facebook pages
- [ ] Page data includes all required fields
- [ ] `/api/meta/forms` fetches lead forms for a page
- [ ] Form data includes existing configurations
- [ ] Form toggle enables/disables correctly
- [ ] Form configuration saves correctly
- [ ] Field mapping validation works
- [ ] Error handling for expired tokens
- [ ] Error handling for invalid page IDs

#### Webhook Handling
- [ ] `/api/meta/webhook` GET handles verification
- [ ] Webhook verification token matches correctly
- [ ] `/api/meta/webhook` POST handles leadgen events
- [ ] Webhook signature verification works
- [ ] Lead data is fetched from Meta Graph API
- [ ] Lead mapping applies correctly
- [ ] Duplicate leads are prevented
- [ ] Lead is created in CRM correctly
- [ ] Assignment rules are applied
- [ ] Sync log is created/updated correctly
- [ ] Form statistics are updated
- [ ] Error handling for invalid payloads
- [ ] Error handling for API failures

#### Configuration Management
- [ ] `/api/meta/config` retrieves integration status
- [ ] Access tokens are not exposed in response
- [ ] Connection status is accurate
- [ ] Enabled forms are listed correctly
- [ ] `/api/meta/config` updates page configuration
- [ ] Webhook subscription works correctly
- [ ] `/api/meta/disconnect` revokes tokens
- [ ] Webhook unsubscription works correctly
- [ ] Integration status updates to disconnected
- [ ] All forms are disabled on disconnect

#### Sync Management
- [ ] `/api/meta/sync/logs` retrieves sync logs
- [ ] Pagination works correctly
- [ ] Filtering by form ID works
- [ ] Filtering by status works
- [ ] `/api/meta/sync/stats` returns correct statistics
- [ ] Success rate calculation is accurate
- [ ] Statistics are tenant-isolated

#### Service Layer
- [ ] `metaService.getOAuthUrl()` generates valid URL
- [ ] `metaService.exchangeCodeForToken()` works
- [ ] `metaService.getLongLivedToken()` works
- [ ] `metaService.debugToken()` returns correct info
- [ ] `metaService.fetchUserPages()` works
- [ ] `metaService.fetchPageLeadForms()` works
- [ ] `metaService.subscribeToLeadgenWebhook()` works
- [ ] `metaService.unsubscribeFromLeadgenWebhook()` works
- [ ] `metaService.fetchLeadDetails()` works
- [ ] `metaService.refreshAccessToken()` works
- [ ] `metaService.revokeToken()` works
- [ ] `metaService.getPageAccessToken()` works
- [ ] `LeadMappingService.mapMetaLeadToCRM()` works
- [ ] `LeadMappingService.validateMapping()` works
- [ ] `LeadMappingService.applyLeadAssignment()` works
- [ ] `LeadMappingService.checkDuplicate()` works
- [ ] `LeadMappingService.createLead()` works

### Frontend Testing

#### Integration Page
- [ ] Page loads without errors
- [ ] Connection status displays correctly
- [ ] "Connect Meta Account" button works
- [ ] OAuth redirect initiates correctly
- [ ] Connection status updates after OAuth
- [ ] "Disconnect" button works
- [ ] Disconnect confirmation works
- [ ] Pages list displays correctly
- [ ] Forms list displays correctly
- [ ] Form toggle works
- [ ] Sync statistics display correctly
- [ ] Sync logs modal opens
- [ ] Sync logs display correctly
- [ ] Error messages display correctly
- [ ] Loading states work correctly

#### Store Management
- [ ] `connectMetaAccount` action works
- [ ] `disconnectMetaAccount` action works
- [ ] `fetchConfig` action works
- [ ] `fetchPages` action works
- [ ] `fetchForms` action works
- [ ] `toggleForm` action works
- [ ] `updateConfig` action works
- [ ] `fetchSyncStats` action works
- [ ] `fetchSyncLogs` action works
- [ ] State persists correctly
- [ ] Error handling works

#### Navigation
- [ ] Settings sidebar shows "Meta Integration" link
- [ ] Link navigates to correct page
- [ ] Active state highlights correctly
- [ ] Navigation works from other pages

### Integration Testing

#### End-to-End OAuth Flow
- [ ] User clicks "Connect Meta Account"
- [ ] User is redirected to Meta authorization page
- [ ] User authorizes the app
- [ ] User is redirected back to CRM
- [ ] Connection status shows "Connected"
- [ ] Integration record exists in database
- [ ] Access token is encrypted in database

#### End-to-End Lead Sync
- [ ] User connects Meta account
- [ ] User selects a Facebook page
- [ ] User enables a lead form
- [ ] Test lead is submitted via Meta Lead Ad
- [ ] Webhook event is received
- [ ] Lead is fetched from Meta API
- [ ] Lead is mapped to CRM fields
- [ ] Lead is created in CRM
- [ ] Lead appears in Leads list
- [ ] Lead assignment is applied
- [ ] Sync log shows success status
- [ ] Sync statistics are updated

#### Multi-Tenant Isolation
- [ ] Tenant A cannot see Tenant B's integration
- [ ] Tenant A cannot see Tenant B's pages
- [ ] Tenant A cannot see Tenant B's forms
- [ ] Tenant A cannot see Tenant B's sync logs
- [ ] Tenant A's leads don't mix with Tenant B's
- [ ] API calls are properly isolated by tenant ID

#### Error Scenarios
- [ ] Invalid OAuth code is handled
- [ ] Expired access token is handled
- [ ] Invalid page ID is handled
- [ ] Invalid form ID is handled
- [ ] Webhook verification failure is handled
- [ ] Invalid webhook payload is handled
- [ ] Meta API failure is handled
- [ ] Database connection failure is handled
- [ ] Network timeout is handled
- [ ] Duplicate lead is prevented

### Regression Testing

#### Existing Lead Management
- [ ] Manual lead creation still works
- [ ] Manual lead editing still works
- [ ] Manual lead deletion still works
- [ ] Lead viewing still works
- [ ] Lead filtering still works
- [ ] Lead search still works
- [ ] Lead export still works

#### Authentication
- [ ] JWT authentication still works
- [ ] Session management still works
- [ ] Token refresh still works
- [ ] Logout still works

#### Authorization
- [ ] Role-based access still works
- [ ] Tenant isolation still works
- [ ] Branch isolation still works

#### Other Features
- [ ] Campaign management still works
- [ ] Client management still works
- [ ] Project management still works
- [ ] Notifications still work
- [ ] Reports still work

## Performance Testing

### Load Testing
- [ ] System handles 100 concurrent webhook events
- [ ] System handles 1000 concurrent webhook events
- [ ] OAuth flow completes within 5 seconds
- [ ] Lead sync completes within 10 seconds
- [ ] Page fetching completes within 5 seconds
- [ ] Form fetching completes within 5 seconds

### Stress Testing
- [ ] System handles burst of 50 webhook events
- [ ] System handles sustained load of 10 events/minute
- [ ] Database queries remain performant under load
- [ ] API response times remain acceptable

## Security Testing

### Authentication & Authorization
- [ ] Unauthenticated requests are rejected
- [ ] Unauthorized requests are rejected
- [ ] Tenant isolation is enforced
- [ ] Role-based access is enforced

### Data Protection
- [ ] Access tokens are encrypted at rest
- [ ] Access tokens are never exposed in logs
- [ ] Access tokens are never exposed in API responses
- [ ] Webhook signatures are verified
- [ ] SQL injection is prevented
- [ ] XSS is prevented

### API Security
- [ ] Rate limiting is enforced
- [ ] Input validation is performed
- [ ] Output encoding is performed
- [ ] CORS is configured correctly
- [ ] CSRF protection is in place

## Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest version)
- [ ] Firefox (latest version)
- [ ] Safari (latest version)
- [ ] Edge (latest version)

### Mobile Browsers
- [ ] Chrome Mobile (latest version)
- [ ] Safari Mobile (latest version)
- [ ] Firefox Mobile (latest version)

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Color contrast meets WCAG standards
- [ ] Focus indicators are visible
- [ ] Alt text is present for images

## Deployment Testing

### Staging Environment
- [ ] All tests pass in staging
- [ ] Environment variables are configured
- [ ] Database migration runs successfully
- [ ] Webhook URL is accessible
- [ ] SSL certificate is valid

### Production Environment
- [ ] All tests pass in production
- [ ] Environment variables are secure
- [ ] Database migration runs successfully
- [ ] Webhook URL is accessible
- [ ] SSL certificate is valid
- [ ] Monitoring is configured
- [ ] Logging is configured
- [ ] Backup is configured

## Post-Deployment Testing

### Smoke Tests
- [ ] Backend server starts successfully
- [ ] Frontend loads successfully
- [ ] OAuth flow works
- [ ] Webhook receives events
- [ ] Leads sync correctly

### Monitoring
- [ ] Error tracking is working
- [ ] Performance monitoring is working
- [ ] Uptime monitoring is working
- [ ] Alerting is configured

### Rollback Plan
- [ ] Database rollback procedure documented
- [ ] Code rollback procedure documented
- [ ] Rollback has been tested

## User Acceptance Testing

### Business User Testing
- [ ] User can connect Meta account
- [ ] User can select Facebook pages
- [ ] User can enable/disable lead forms
- [ ] User can view sync statistics
- [ ] User can view sync logs
- [ ] User can disconnect Meta account

### Admin User Testing
- [ ] Admin can view all integrations
- [ ] Admin can troubleshoot issues
- [ ] Admin can monitor sync performance
- [ ] Admin can access sync logs

## Documentation

- [ ] Setup guide is complete
- [ ] API documentation is complete
- [ ] User guide is complete
- [ ] Troubleshooting guide is complete
- [ ] Environment variables are documented
- [ ] Migration instructions are documented

## Sign-Off

### Developer Sign-Off
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Code review completed
- [ ] Security review completed

### QA Sign-Off
- [ ] All QA tests pass
- [ ] Regression testing completed
- [ ] Performance testing completed
- [ ] Security testing completed

### Product Owner Sign-Off
- [ ] User acceptance testing completed
- [ ] Business requirements met
- [ ] Documentation reviewed
- [ ] Training completed

### Deployment Sign-Off
- [ ] Staging deployment successful
- [ ] Production deployment successful
- [ ] Monitoring confirmed
- [ ] Rollback plan verified
