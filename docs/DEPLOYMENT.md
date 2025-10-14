# Deployment Guide

## Resume Builder - Production Deployment

**Version:** 1.0
**Last Updated:** 2025-10-13

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Build Process](#build-process)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedure](#rollback-procedure)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
- Node.js 18+
- npm or yarn
- Git
- Vercel CLI (for Vercel deployment) or deployment tool of choice

### Required Accounts
- Clerk account (Authentication)
- Convex account (Backend/Database)
- OpenAI account (AI features)
- Deployment platform account (Vercel, Netlify, etc.)

### Required Environment Variables
```bash
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Convex Backend
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOYMENT=

# OpenAI API
OPENAI_API_KEY=

# Optional: Analytics, Monitoring
NEXT_PUBLIC_ANALYTICS_ID=
```

---

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd Ascentul
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables

Create `.env.local` file:
```bash
cp .env.example .env.local
```

Fill in all required variables:
```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
CONVEX_DEPLOYMENT=prod:xxx
OPENAI_API_KEY=sk-xxx
```

### 4. Verify Configuration
```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm run test:ci
```

---

## Build Process

### 1. Pre-Build Checks

Run all checks before building:
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Tests
npm run test:ci

# Check for security vulnerabilities
npm audit
```

### 2. Create Production Build
```bash
npm run build
```

Expected output:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (X/X)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    X kB        XX kB
├ ○ /dashboard                           X kB        XX kB
└ ○ /resume/[resumeId]                   X kB        XX kB
```

### 3. Test Build Locally
```bash
npm run start
```

Open `http://localhost:3000` and verify:
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] AI features are functional
- [ ] No console errors

---

## Deployment Steps

### Option 1: Vercel Deployment (Recommended)

#### First-Time Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

#### Deploy to Production
```bash
# Preview deployment (staging)
vercel

# Production deployment
vercel --prod
```

#### Configure Environment Variables in Vercel
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all required variables
3. Redeploy after adding variables

### Option 2: Manual Deployment

#### Build Artifacts
```bash
npm run build
```

Artifacts to deploy:
- `.next/` folder
- `public/` folder
- `package.json` and `package-lock.json`
- `next.config.js`

#### Environment Configuration

**Option A: Export environment variables on the server**
```bash
# Set environment variables on production server
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
export CLERK_SECRET_KEY=sk_live_xxx
export NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
export CONVEX_DEPLOY_KEY=prod:your-project:deploy-key
export OPENAI_API_KEY=sk-xxx
export STRIPE_SECRET_KEY=sk_live_xxx
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Then start the application
npm start
```

**Option B: Use a .env.production file**
```bash
# Create .env.production on the server (DO NOT commit this file)
cp .env.local .env.production

# Add .env.production to .gitignore if not already present
echo ".env.production" >> .gitignore

# Edit with production values
nano .env.production

# Start the application
npm start
```

**⚠️ Security Warning**: The `.env.production` file contains sensitive secrets and must never be committed to version control:
- Add it to `.gitignore` immediately
- Restrict file permissions: `chmod 600 .env.production`
- Use separate environment-specific files (`.env.staging`, `.env.production`)
- Never copy `.env.production` to your local machine
- Consider using a secret management service for team environments

**Option C: Use PM2 ecosystem file (Recommended)**
```bash
# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'resume-builder',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_xxx',
      CLERK_SECRET_KEY: 'sk_live_xxx',
      // Add all other environment variables here
    }
  }]
}
EOF
```

**⚠️ Security Warning**: Never commit `ecosystem.config.js` with real secrets to version control. Add it to `.gitignore` and use one of these secure alternatives for production:
- PM2's `--env` flag with encrypted environment variables
- External secret management services (AWS Secrets Manager, HashiCorp Vault, Azure Key Vault)
- Environment-specific config files loaded at runtime
- PM2's keymetrics secret management

Example secure approach:
```bash
# Add to .gitignore
echo "ecosystem.config.js" >> .gitignore

# Use environment variables from secure source
pm2 start ecosystem.config.js --env production --update-env
```

#### Process Management (Recommended)

Use PM2 or Docker to ensure the application stays running and automatically restarts on crashes:

**Using PM2:**
```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start npm --name "resume-builder" -- start

# OR use ecosystem file for better configuration
pm2 start ecosystem.config.js

# Configure PM2 to start on system boot
pm2 startup
pm2 save

# Useful PM2 commands
pm2 status           # Check application status
pm2 logs            # View logs
pm2 restart resume-builder  # Restart app
pm2 stop resume-builder     # Stop app
pm2 delete resume-builder   # Remove app
```

**Using Docker:**
```bash
# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY .next ./.next
COPY public ./public
COPY next.config.js ./
EXPOSE 3000
CMD ["npm", "start"]
EOF

# Build and run
docker build -t resume-builder .
docker run -d -p 3000:3000 --name resume-builder \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx \
  -e CLERK_SECRET_KEY=sk_live_xxx \
  # Add all other environment variables
  resume-builder
```

**⚠️ Security Warning**: Avoid using `-e` flags for secrets in production. Inline environment variables are exposed in:
- Shell history (`~/.bash_history`, `~/.zsh_history`)
- Process listings (`ps aux`, `docker inspect`)
- Container metadata accessible via Docker API

**Secure alternatives for production:**

1. **Docker secrets** (Docker Swarm):
   ```bash
   echo "sk_live_xxx" | docker secret create clerk_secret -
   docker service create --secret clerk_secret resume-builder
   ```

2. **Environment files** (add to `.gitignore`):
   ```bash
   # Create .env.production (never commit this!)
   echo ".env.production" >> .gitignore

   # Use env file
   docker run -d --env-file .env.production resume-builder
   ```

3. **Docker Compose with secrets**:
   ```yaml
   services:
     app:
       environment:
         - CLERK_SECRET_KEY  # Loaded from host environment
       secrets:
         - db_password
   secrets:
     db_password:
       external: true
   ```

4. **Orchestration tools**:
   - Kubernetes Secrets with RBAC
   - AWS ECS with Systems Manager Parameter Store
   - Azure Container Instances with Key Vault
   - HashiCorp Vault integration

```

**Using systemd (Linux):**
```bash
# Create service file
sudo nano /etc/systemd/system/resume-builder.service

# Add configuration:
[Unit]
Description=Resume Builder Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/resume-builder
Environment=NODE_ENV=production
Environment=PORT=3000
# Add all other environment variables
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target

# Enable and start service
sudo systemctl enable resume-builder
sudo systemctl start resume-builder
sudo systemctl status resume-builder
```

**⚠️ Security Warning**: Avoid inline `Environment=` directives for secrets in systemd service files. These are:
- Visible in `systemctl status` output
- Stored in plain text in `/etc/systemd/system/`
- Readable by users with systemd access
- Logged in system journals

**Secure alternatives for production:**

1. **EnvironmentFile with restricted permissions**:
   ```bash
   # Create secure env file
   sudo mkdir -p /etc/resume-builder
   sudo touch /etc/resume-builder/.env
   sudo chmod 600 /etc/resume-builder/.env  # Owner read/write only
   sudo chown www-data:www-data /etc/resume-builder/.env

   # Add to service file:
   [Service]
   EnvironmentFile=/etc/resume-builder/.env
   ```

2. **systemd credentials** (systemd v250+):
   ```bash
   # Store encrypted credential
   sudo systemd-creds encrypt - resume-builder.cred <<EOF
   CLERK_SECRET_KEY=sk_live_xxx
   EOF

   # Add to service file:
   [Service]
   LoadCredential=secrets:resume-builder.cred
   # Access via $CREDENTIALS_DIRECTORY/secrets
   ```

3. **External secret management**:
   ```bash
   # Use a pre-start script to fetch secrets
   [Service]
   ExecStartPre=/usr/local/bin/fetch-secrets.sh
   EnvironmentFile=/run/resume-builder/secrets.env
   ```

4. **Integration with secret stores**:
   - AWS Systems Manager Parameter Store
   - HashiCorp Vault with systemd integration
   - Azure Key Vault with managed identities
   - Google Cloud Secret Manager

#### Reverse Proxy Configuration

For production, use a reverse proxy (nginx or Apache) to:
- Handle HTTPS/SSL certificates
- Serve static files efficiently
- Load balance multiple instances
- Add security headers

**nginx configuration:**
```nginx
# /etc/nginx/sites-available/resume-builder
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL certificate paths (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy to Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
    }
}

# Enable configuration and restart nginx
# sudo ln -s /etc/nginx/sites-available/resume-builder /etc/nginx/sites-enabled/
# sudo nginx -t
# sudo systemctl restart nginx
```

**Apache configuration:**
```apache
# /etc/apache2/sites-available/resume-builder.conf
<VirtualHost *:80>
    ServerName your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/your-domain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/your-domain.com/privkey.pem

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    # Security headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
</VirtualHost>

# Enable modules and site
# sudo a2enmod proxy proxy_http ssl headers
# sudo a2ensite resume-builder
# sudo systemctl restart apache2
```

#### Server Requirements
- Node.js 18+ runtime
- Start command: `npm start`
- Port: 3000 (or configure PORT env var)
- Recommended: 2GB+ RAM, 2+ CPU cores

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# Check homepage
curl https://your-domain.com

# Check API health
curl https://your-domain.com/api/health

# Check authentication
curl https://your-domain.com/api/auth/check
```

### 2. Functional Tests

Test these critical paths:

**Authentication:**
- [ ] Sign up flow works
- [ ] Sign in flow works
- [ ] Sign out works
- [ ] Protected routes redirect

**Resume Builder:**
- [ ] Create new resume
- [ ] Edit resume blocks
- [ ] AI Generate works
- [ ] AI Tailor works
- [ ] AI Tidy works
- [ ] Export to PDF works

**Inline Suggestions:**
- [ ] Suggestions display on block selection
- [ ] Dismiss suggestions works
- [ ] localStorage persists

**Onboarding:**
- [ ] Tour shows for new users
- [ ] Can skip tour
- [ ] Can complete tour
- [ ] Doesn't show after completion

### 3. Performance Checks

```bash
# Lighthouse audit
npx lighthouse https://your-domain.com --view

# Core Web Vitals
# Check in Chrome DevTools → Lighthouse
```

Target metrics:
- Performance: ≥90
- Accessibility: ≥95
- Best Practices: ≥90
- SEO: ≥90

### 4. Error Monitoring

Check for errors in:
- [ ] Browser console (no errors)
- [ ] Server logs (no critical errors)
- [ ] Error tracking service (if configured)

---

## Rollback Procedure

### Vercel Rollback
```bash
# List previous deployments
vercel ls

# Promote a previous deployment
vercel promote <deployment-url>
```

### Manual Rollback
```bash
# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild and redeploy
npm run build
# Deploy using your deployment method
```

### Database Rollback (Convex)

**Important**: Convex does not have a built-in CLI rollback command. To revert Convex deployments:

**Option 1: Rollback via Git + Redeploy**
```bash
# Checkout the previous commit with the desired Convex schema/functions
git checkout <previous-commit-hash>

# Redeploy Convex functions and schema
npx convex deploy --prod

# Return to main branch if needed
git checkout main
```

**Option 2: Use Hosting Provider's Rollback**
- **Vercel**: Dashboard → Deployments → Promote previous deployment
- **Netlify**: Dashboard → Deploys → Restore previous deploy
- If your hosting provider auto-deploys Convex, this will also rollback Convex functions

**Option 3: Manual Convex Dashboard Rollback**
1. Go to Convex Dashboard → Your Project → Deployments
2. View deployment history
3. Manually revert schema changes or functions through the dashboard
4. Note: This is manual and error-prone; Git-based rollback is preferred

**Data Recovery**
If data was corrupted or needs restoration:
- Convex does not have automatic database snapshots
- Implement your own backup strategy using scheduled functions
- Consider exporting critical data regularly

**Example: Scheduled Backup Function**

Create a cron job to backup critical data to external storage:

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily backup at 2:00 AM UTC
crons.daily(
  "daily-backup",
  { hourUTC: 2, minuteUTC: 0 },
  internal.backups.performBackup
);

export default crons;
```

```typescript
// convex/backups.ts
import { internalMutation } from "./_generated/server";

export const performBackup = internalMutation(async (ctx) => {
  // Export critical tables
  const resumes = await ctx.db.query("builder_resumes").collect();
  const users = await ctx.db.query("users").collect();

  const backup = {
    timestamp: new Date().toISOString(),
    resumes,
    users,
  };

  // Send to external storage (S3, Azure Blob, GCS, etc.)
  // Example with AWS S3:
  const response = await fetch('YOUR_BACKUP_SERVICE_URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(backup),
  });

  if (!response.ok) {
    throw new Error('Backup failed');
  }

  console.log(`Backup completed: ${backup.timestamp}`);
  return { success: true, timestamp: backup.timestamp };
});
```

**Backup Best Practices:**

1. **Store backups externally**: Use S3, Azure Blob Storage, or Google Cloud Storage
2. **Retention policy**: Keep daily backups for 7 days, weekly for 30 days, monthly for 1 year
3. **Test restores regularly**: Verify backups can be restored successfully
4. **Monitor backup jobs**: Set up alerts for failed backup operations
5. **Encrypt backups**: Use encryption at rest and in transit
6. **Document restore procedure**: Create runbook for data restoration

**Alternative: Export Data via API**

```bash
# Manual backup script
curl -X POST https://your-convex-deployment.convex.cloud/api/query \
  -H "Authorization: Bearer $CONVEX_DEPLOY_KEY" \
  -d '{"path":"backups:performBackup","args":{}}' \
  > backup-$(date +%Y%m%d).json
```

See [Convex Cron Jobs documentation](https://docs.convex.dev/scheduling/cron-jobs) for more details on scheduling tasks.

---

## Monitoring & Logging

### Application Monitoring

**Recommended Tools:**
- Vercel Analytics (built-in)
- Sentry (error tracking)
- LogRocket (session replay)
- Datadog (APM)

### Key Metrics to Monitor

**Performance:**
- Page load time
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- API response times

**Usage:**
- Active users
- Feature adoption rates
- AI action usage
- Error rates

**Infrastructure:**
- Server response time
- Memory usage
- API rate limits
- Database query performance

### Setting Up Alerts

Create alerts for:
- Error rate > 1%
- Response time > 2s
- 5xx errors
- Rate limit hits
- Memory usage > 80%

---

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Error:** TypeScript compilation errors
```bash
# Fix: Run type check locally
npm run type-check
# Fix errors and rebuild
```

**Error:** Missing environment variables
```bash
# Fix: Verify all env vars are set
vercel env ls
# Add missing variables
vercel env add VARIABLE_NAME
```

#### 2. Runtime Errors

**Error:** "Unauthorized" on API calls
```bash
# Check: Clerk keys are correct
# Check: Convex auth is configured
# Check: Environment variables are in production
```

**Error:** OpenAI API errors
```bash
# Check: API key is valid
# Check: Rate limits not exceeded
# Check: Model names are correct (gpt-4o, gpt-4o-mini)
```

#### 3. Performance Issues

**Slow page loads:**
- Check bundle size: `npm run build` and review output
- Implement code splitting
- Optimize images
- Enable caching headers

**Slow AI responses:**
- Check OpenAI API response times
- Implement timeout handling
- Add retry logic (already implemented)
- Consider model fallback (already implemented)

#### 4. Authentication Issues

**Users can't sign in:**
- Verify Clerk dashboard status
- Check Clerk keys in env vars
- Check redirect URLs are configured
- Verify session token handling

---

## Security Checklist

Before deploying to production:

- [ ] No secrets in client-side code
- [ ] Environment variables properly secured
- [ ] HTTPS enabled (forced)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled on API routes
- [ ] Input validation on all forms
- [ ] SQL injection protection (N/A - using Convex)
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] Security headers configured

### Security Headers (next.config.js)

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://qyycdduuadsofgabrgip.supabase.co https://*.stripe.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.clerk.accounts.dev https://*.convex.cloud https://api.openai.com https://api.stripe.com",
              "frame-src https://*.clerk.accounts.dev https://challenges.cloudflare.com https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'"
            ].join('; ')
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  }
}
```

**Security Headers Explained:**

- **X-DNS-Prefetch-Control**: Enables DNS prefetching for faster external resource loading
- **Strict-Transport-Security (HSTS)**: Forces HTTPS connections for 2 years, includes all subdomains
- **X-Frame-Options**: Prevents clickjacking by only allowing same-origin framing
- **X-Content-Type-Options**: Prevents MIME type sniffing attacks
- **Content-Security-Policy (CSP)**: Comprehensive policy preventing XSS and other injection attacks
  - Allows scripts from self, Clerk authentication, and Cloudflare challenges (no unsafe-inline or unsafe-eval)
  - Allows styles from self with inline styles (needed for styled-jsx)
  - Allows images only from trusted sources (Supabase storage, Stripe, and data URIs)
  - Restricts API connections to trusted domains (Clerk, Convex, OpenAI, Stripe)
  - Allows frames only from Clerk, Cloudflare, and Stripe (for authentication and payment flows)
- **Referrer-Policy**: Controls referrer information sent with requests
- **Permissions-Policy**: Blocks access to camera, microphone, and geolocation

**⚠️ CSP Security Best Practices:**

The current CSP configuration **removes** `'unsafe-inline'` and `'unsafe-eval'` from script-src for enhanced security. This provides strong protection against XSS attacks. If your application breaks after deployment, check the browser console for CSP violations and address them:

**Troubleshooting CSP Issues:**

1. **Inline scripts blocked**: Move inline `<script>` tags to external files or use Next.js `<Script>` component
2. **Inline event handlers blocked**: Replace `onclick="..."` with `addEventListener()` in external scripts
3. **eval() usage blocked**: Refactor code to avoid `eval()`, `Function()`, `setTimeout(string)`, or `setInterval(string)`

**If you need to temporarily relax CSP** (not recommended):

```javascript
// next.config.js - Only use as a last resort
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev ...
```

**For production-ready CSP with inline scripts** (Next.js 13.4+):

Implement nonce-based CSP for inline scripts while maintaining security:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://*.clerk.accounts.dev;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https://qyycdduuadsofgabrgip.supabase.co https://*.stripe.com;
    font-src 'self' data:;
    connect-src 'self' https://*.clerk.accounts.dev https://*.convex.cloud https://api.openai.com;
    frame-src https://*.clerk.accounts.dev https://challenges.cloudflare.com https://js.stripe.com;
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}
```

Then use the nonce in your components:

```typescript
import { headers } from 'next/headers';
import Script from 'next/script';

export default function Page() {
  const nonce = headers().get('x-nonce');

  return (
    <Script id="inline-script" nonce={nonce}>
      {`console.log('This inline script is CSP-compliant!');`}
    </Script>
  );
}
```

**Resources:**
- [Next.js CSP Documentation](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error rates
- Check performance metrics
- Review user feedback

**Weekly:**
- Review and update dependencies
- Analyze usage patterns
- Check for security updates

**Monthly:**
- Run full QA test suite
- Performance audit
- Security audit
- Dependency updates

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update to latest compatible versions
npm update

# Update to latest versions (breaking changes possible)
npm install <package>@latest

# Run tests after updates
npm test
npm run type-check
```

---

## Support

### Internal Contacts
- Engineering Lead: [Name]
- Product Manager: [Name]
- DevOps: [Name]

### External Support
- Vercel Support: support@vercel.com
- Clerk Support: support@clerk.com
- Convex Support: support@convex.dev
- OpenAI Support: support.openai.com

---

## Changelog

Track major deployment changes here:

### v1.0.0 - 2025-10-13
- Initial production deployment
- Phases 3-6 implementation complete
- AI features: Generate, Tailor, Tidy
- Inline suggestions system
- Onboarding tour
- Error boundaries and comprehensive testing
