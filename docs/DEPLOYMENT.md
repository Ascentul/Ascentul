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
CONVEX_DEPLOY_KEY=  # Required for production deployments

# OpenAI API
OPENAI_API_KEY=

# Payment Processing (Required if using paid features)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

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

# Check for security vulnerabilities in production dependencies (fails on high/critical)
# Note: Exits with code 1 when vulnerabilities are found - ensure your CI/CD pipeline
# is configured to fail the build on non-zero exit codes
npm audit --audit-level=high --production
```

**npm audit flags:**
- `--audit-level=high`: Fails on high and critical vulnerabilities (recommended for production)
- `--production`: Only checks production dependencies, ignoring devDependencies
  - Use this for production builds to focus on runtime security
  - Omit `--production` for development environments to check all dependencies

**npm audit levels:**
- `low`: Informational only, doesn't fail build
- `moderate`: Fails on moderate, high, and critical vulnerabilities
- `high`: Fails on high and critical vulnerabilities (recommended for production)
- `critical`: Only fails on critical vulnerabilities

**Exit codes:**
- `0`: No vulnerabilities found at or above the specified level
- `1`: Vulnerabilities found - ensure your CI/CD pipeline treats this as a build failure

**In CI/CD pipelines**, always verify that non-zero exit codes halt the deployment stage:
- Most providers (GitHub Actions, GitLab CI, CircleCI) fail steps on non-zero exit codes by default, but confirm this in your workflow.
- Explicitly check that `npm audit` returning `1` stops the pipeline.
- Refer to the sample workflow in [Automated Dependency Updates](#automated-dependency-updates) for a reference implementation.

For CI/CD pipelines, use `npm audit --audit-level=high --production` to prevent deploying code with serious security issues while allowing time to address moderate vulnerabilities in development dependencies.

**Handling audit failures:**
```bash
# View detailed vulnerability report
npm audit

# Attempt automatic fixes
npm audit fix

# Force update dependencies (may cause breaking changes)
npm audit fix --force

# If fixes aren't available, manually update specific packages
npm update <package-name>
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
npm start
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

**Security Note**: Never commit `ecosystem.config.js` with real secrets to version control. Add it to `.gitignore` and use PM2's `--env` flag with encrypted environment variables or integrate with a secret management service (AWS Secrets Manager, HashiCorp Vault, etc.) for production deployments.
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
pm2 start ecosystem.config.js --env production
# Update environment variables on restart when needed
pm2 restart ecosystem.config.js --update-env
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

**Security Note**: Avoid using `-e` flags for secrets in production. Instead:
- Use Docker secrets: `docker secret create` and mount in containers
- Use env files: `docker run --env-file .env.production` (ensure file is in `.gitignore`)
- Use orchestration tools (Kubernetes Secrets, Docker Swarm secrets)
- Never expose secrets in shell history or process listings

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
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
EOF

# Build and run
# IMPORTANT: Ensure .env.production exists in the current directory before running Docker commands.
# See "Option B: Use a .env.production file" above for setup steps.
docker build -t resume-builder .
docker run -d -p 3000:3000 --name resume-builder \
  --env-file .env.production \
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
# /etc/nginx/nginx.conf
# Add this to the http block (before server blocks)
http {
    # ... existing http configuration ...

    # Cache configuration for Next.js static files
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=next_cache:10m max_size=1g inactive=60m use_temp_path=off;

    # ... rest of http configuration ...
}

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

    # Cache static files (Next.js static assets)
    # Next.js includes content hashes in /_next/static/ filenames, making them immutable
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache next_cache;
        proxy_cache_valid 200 365d;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_lock on;
        add_header X-Cache-Status $upstream_cache_status;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Cache image assets
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://localhost:3000;
        proxy_cache next_cache;
        proxy_cache_valid 200 60m;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        add_header X-Cache-Status $upstream_cache_status;
    }

    # API routes - bypass cache for authenticated requests
    # SECURITY: Prevents serving cached responses to authenticated users
    #
    # Cache bypass triggers (update if authentication mechanism changes):
    # - $http_authorization: Bearer tokens or Basic auth
    # - $cookie_session: Generic session cookie (if used)
    # - $cookie___clerk_session: Clerk authentication session cookie
    #
    # To verify your Clerk cookie name:
    #   1. Browser DevTools → Application → Cookies
    #   2. curl -i https://your-domain.com/sign-in | grep -i "set-cookie"
    #   3. Common names: __session, __clerk_session, __client_uat
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Forward Authorization header to backend (required for API authentication)
        proxy_set_header Authorization $http_authorization;

        # Bypass cache for ANY authenticated request
        # proxy_cache_bypass: Don't serve from cache if conditions are met
        # proxy_no_cache: Don't store response in cache if conditions are met
        proxy_cache_bypass $http_authorization $cookie_session $cookie___clerk_session;
        proxy_no_cache $http_authorization $cookie_session $cookie___clerk_session;
    }

    # TODO/MAINTENANCE: Review this cache bypass logic when upgrading authentication:
    # - If switching from Clerk to a different provider, update cookie names
    # - If adding new authentication methods, extend the bypass conditions
    # - Document any custom session/auth cookies in team runbooks
}

# Create cache directory and set permissions
sudo mkdir -p /var/cache/nginx
sudo chown -R nginx:nginx /var/cache/nginx
sudo chmod -R 755 /var/cache/nginx

# Enable configuration and restart nginx
sudo ln -s /etc/nginx/sites-available/resume-builder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Cache Configuration Details:**

**Basic parameters:**
- `proxy_cache_path`: Defines cache storage location and parameters
- `keys_zone=next_cache:10m`: Allocates 10MB for cache keys (stores ~80,000 keys)
- `max_size=1g`: Limits cache to 1GB
- `inactive=60m`: Removes cached items not accessed for 60 minutes
- `X-Cache-Status`: Header shows cache HIT/MISS/BYPASS for debugging

**Cache key strategy:**
- `proxy_cache_key "$scheme$request_method$host$request_uri"`: Caches based on protocol, method, host, and URI
- **Static assets**: Cache key does NOT include auth headers (everyone gets same files)
- **API routes**: Cache is bypassed entirely for authenticated requests (see below)
- **Edge case**: For public APIs where responses vary by authentication status (e.g., different data for logged-in vs logged-out users), add `$http_authorization` to the cache key or use separate cache zones

**Authenticated request handling:**
- API routes (`/api/*`) bypass cache when `Authorization` header or session cookie is present
- Prevents serving cached responses with wrong user data
- **Cookie names to verify**:
  - `$cookie_session`: Generic session cookie (if used)
  - `$cookie___clerk_session`: Clerk's default session cookie name
  - **Important**: Verify your actual Clerk cookie name by checking browser DevTools → Application → Cookies, or by running:
    ```bash
    curl -i https://your-domain.com/sign-in | grep -i "set-cookie"
    ```
  - Common Clerk cookie names: `__session`, `__clerk_session`, `__client_uat`
  - Update the nginx config if your app uses different cookie names

**Stale content serving:**
- `proxy_cache_use_stale`: Serves stale content during upstream failures for resilience
- Applies to error, timeout, updating, and 5xx responses
- **Important**: Ensure your application can tolerate slightly stale data during outages
- Consider adding `stale-while-revalidate` for critical endpoints

**Browser compatibility notes:**
- `immutable` directive (line 560): Prevents revalidation of hashed assets
- Supported by Firefox 49+, Safari 11+, and most modern browsers
- Older browsers ignore it gracefully (falls back to max-age behavior)
- Safe to use for Next.js `/_next/static/*` assets with content hashes

**Security considerations:**
- Never cache authenticated API responses at the proxy level
- Always bypass cache for routes handling sensitive data (PII, payment info)
- Use `Vary: Cookie` header if responses vary by cookie values
- Monitor `X-Cache-Status` header in production to detect cache misses


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
- [Vercel Analytics](https://vercel.com/docs/analytics) (built-in for Vercel deployments)
- [Sentry](https://docs.sentry.io/) (error tracking and performance monitoring)
- [LogRocket](https://docs.logrocket.com/) (session replay and debugging)
- [Datadog](https://docs.datadoghq.com/) (application performance monitoring)

> **Note:** Detailed setup instructions for monitoring tools are beyond the scope of this deployment guide. Refer to each tool's official documentation (linked above) for integration steps, API keys, and configuration. Most tools provide Next.js-specific integration guides and SDK packages available via npm.

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
  const nonce = crypto.randomBytes(16).toString('base64');
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

# IMPORTANT: Commit the updated lock file
# package-lock.json is automatically updated by npm and must be committed
# to ensure consistent dependency versions across environments
git add package-lock.json
git commit -m "chore: update dependencies"

# Run tests after updates to verify compatibility
npm run test:ci
npm run type-check
npm run build
```

**Lock file best practices:**
- Always commit `package-lock.json` after dependency updates
- Never manually edit `package-lock.json` - let npm manage it
- Use `npm ci` in CI/CD pipelines (installs from lock file, ensures reproducibility)
  - **CI/CD**: Always use `npm ci` - it fails if lock file is out of sync
  - **Docker builds**: Use `npm ci --production` for production images (npm 7+)
  - **Local development**: Use `npm install` (updates lock file when adding/removing packages)
- Review lock file changes in PRs to spot unexpected transitive dependency updates
- **Why `npm ci` matters**:
  - Prevents accidental lock file mutations in automated environments
  - Faster than `npm install` (skips package resolution)
  - Fails fast if package.json and lock file are out of sync
  - Guarantees identical dependency tree across all environments

### Automated Dependency Updates

For proactive security and maintenance, consider setting up automated dependency management tools:

#### GitHub Dependabot (Recommended for GitHub repos)

**Advantages:**
- Built-in to GitHub (no additional services needed)
- Automatically creates PRs for dependency updates
- Supports security vulnerability alerts
- Free for public and private repositories

**Setup:**

1. Create `.github/dependabot.yml` in your repository:

```yaml
version: 2
updates:
  # Enable version updates for npm
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 10

    # Grouping strategy to reduce PR noise
    groups:
      # Group all patch and minor updates together
      production-dependencies:
        dependency-type: "production"
        update-types:
          - "version-update:semver-minor"
          - "version-update:semver-patch"

      development-dependencies:
        dependency-type: "development"
        update-types:
          - "version-update:semver-minor"
          - "version-update:semver-patch"

    # Auto-merge patch updates (configure branch protection rules)
    labels:
      - "dependencies"
      - "automated"

    # Version requirements
    versioning-strategy: increase

    # Ignore specific packages if needed
    ignore:
      - dependency-name: "@types/*"
        update-types: ["version-update:semver-patch"]
```

2. Configure auto-merge for low-risk updates (optional):

```bash
# Enable auto-merge for dependency PRs after CI passes
# Requires branch protection rules with status checks
gh pr merge <PR-NUMBER> --auto --squash
```

#### Renovate (More Configurable Alternative)

**Advantages:**
- More flexible configuration options
- Better grouping and scheduling
- Supports monorepos
- Works with GitHub, GitLab, Bitbucket

**Setup:**

1. Install [Renovate GitHub App](https://github.com/apps/renovate)

2. Create `renovate.json` in your repository:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:base",
    ":preserveSemverRanges",
    ":prHourlyLimitNone",
    "group:allNonMajor"
  ],
  "schedule": ["before 10am on monday"],
  "labels": ["dependencies"],
  "npm": {
    "minimumReleaseAge": "3 days"
  },
  "vulnerabilityAlerts": {
    "labels": ["security"],
    "minimumReleaseAge": null
  },
  "packageRules": [
    {
      "matchUpdateTypes": ["patch", "pin", "digest"],
      "automerge": true,
      "automergeType": "pr",
      "ignoreTests": false
    },
    {
      "matchDepTypes": ["devDependencies"],
      "matchUpdateTypes": ["minor"],
      "automerge": true
    },
    {
      "matchPackagePatterns": ["^@types/"],
      "automerge": true
    },
    {
      "matchPackageNames": ["next", "react", "react-dom"],
      "groupName": "React and Next.js"
    }
  ]
}
```

#### Best Practices for Automated Updates

**1. Configure CI/CD to run on dependency PRs:**
```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write  # Allow posting comments
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:ci
      - run: npm run build

      # Run audit and capture results
      - name: Security audit
        id: audit
        run: |
          npm audit --audit-level=high --production > audit-results.txt 2>&1 || echo "AUDIT_FAILED=true" >> $GITHUB_ENV
          cat audit-results.txt
        continue-on-error: true

      # Post audit results as PR comment
      - name: Comment audit results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const auditResults = fs.readFileSync('audit-results.txt', 'utf8');
            const failed = process.env.AUDIT_FAILED === 'true';

            const body = `## Security Audit Results

            ${failed ? '❌ **Audit Failed** - High or critical vulnerabilities found' : '✅ **Audit Passed** - No high or critical vulnerabilities'}

            <details>
            <summary>View full audit report</summary>

            \`\`\`
            ${auditResults}
            \`\`\`

            </details>`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });

      # Fail the workflow if audit found vulnerabilities
      - name: Fail on audit issues
        if: env.AUDIT_FAILED == 'true'
        run: exit 1
```

**2. Set up auto-merge rules:**
- Only auto-merge patch and minor updates
- Require all CI checks to pass
- Never auto-merge major version updates (require manual review)
- Use a 3-day "soak time" for new package versions
  - **Rationale**: 3 days allows the community to surface critical bugs in new releases
  - Based on npm package adoption patterns: ~70% of critical issues are reported within 72 hours
  - Balances risk mitigation with staying reasonably up-to-date
  - Adjust based on your risk tolerance (conservative: 7 days, aggressive: 1 day)
- **Exception**: Bypass soak time for security vulnerability patches (use `minimumReleaseAge: null` for vulnerability alerts)
  - Security patches require immediate action regardless of soak time
  - Still run full CI/CD pipeline before merging

**3. Review strategy:**
- **Patch updates**: Auto-merge after CI passes (low risk)
- **Minor updates**: Auto-merge for dev dependencies, review for production
- **Major updates**: Always require manual review and testing
- **Security updates**:
  - Prioritize and review immediately (bypass soak time)
  - Check for breaking changes in security patches
  - Test critical paths after merging
  - Consider hotfix deployment for critical vulnerabilities

**4. Monitor and audit:**
```bash
# Weekly: Review merged dependency updates
git log --oneline --grep="dependabot" --since="1 week ago"

# Monthly: Audit dependency health
npm outdated
npm audit
```

**Security Considerations:**

⚠️ **Supply Chain Security**: Automated updates can introduce malicious packages. Mitigate risks by:
- Enabling [GitHub Advanced Security](https://docs.github.com/en/code-security) for dependency review
- Using [npm audit signatures](https://docs.npmjs.com/about-registry-signatures) to verify package authenticity
  - **Note**: Package signatures are an emerging feature (as of late 2024). Not all packages are signed yet, and signature verification is optional. Check signature status with `npm audit signatures`.
- Reviewing changelogs for major updates, especially for dependencies with elevated privileges
- Running security scans in CI (npm audit, Snyk, Dependabot Security, Socket Security)
- Using lockfiles (`package-lock.json`) and verifying integrity with `npm ci` (not `npm install`)
- Monitoring security advisories: [GitHub Security Advisories](https://github.com/advisories), [npm Security Advisories](https://www.npmjs.com/advisories)

**Resources:**
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Renovate Documentation](https://docs.renovatebot.com/)
- [GitHub Actions for Auto-Merge](https://github.com/marketplace/actions/dependabot-auto-merge)

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
