# Ascentful Secrets Management Standard

*Last updated: December 2025*

## 1. Purpose

This document defines how Ascentful stores and rotates environment secrets across dev, staging, and pilot environments.

Scope includes:

- API keys and tokens
- Database connection strings
- Encryption keys
- Third party credentials
- Any other non public configuration values

---

## 2. Principles

- Secrets never committed to git.
- Single source of truth per environment.
- Least privilege for access.
- Regular rotation and rotation on any risk event.

---

## 3. Locations for Environment Secrets

### 3.1 Local Development

**Location**

- `.env.local` files on developer machines
- Backed by a shared vault (for example 1Password or similar) that holds master copies
- `.env.local` is in `.gitignore` and never committed

**Rules**

- Only secrets needed for local development are stored here.
- Each developer is responsible for keeping `.env.local` up to date with the shared vault.
- If a secret is changed in any environment, the shared vault must be updated and developers pull the new value.

---

### 3.2 Vercel (Frontend and Next.js App)

**Location**

- Vercel environment variables per environment:
  - Development
  - Preview or staging
  - Production or pilot

**Rules**

- All secrets used by the Next.js app and server components are defined only in the Vercel project settings, never in code.
- Use clear and consistent names, for example:
  - `NEXT_PUBLIC_` prefix only for values safe to expose in the browser.
  - No secret should ever have `NEXT_PUBLIC_` if it grants access to private resources.
- Only engineering leads and the Head of Security can edit production or pilot environment variables.

---

### 3.3 Convex (Backend and Data)

**Location**

- Convex environment variables and configuration for each deployment:
  - Development
  - Staging
  - Pilot

**Rules**

- Secrets that are used only by Convex functions (for example database connection strings, internal service tokens) live in Convex environment configuration, not in Vercel.
- Convex environment secrets must be stored encrypted at rest using Convex provided mechanisms or an upstream key management service.
- Access to Convex production configuration is restricted to:
  - Head of Engineering
  - Lead Backend Engineer
  - Head of Security and Privacy

---

### 3.4 Third Party Key Vault (Future Hardening)

**Planned target**

- A dedicated key vault service such as Azure Key Vault or AWS Secrets Manager for:
  - Encryption keys
  - High value API keys
  - Long term signing keys

**Interim state**

- Until a dedicated vault is fully integrated, the following rules apply:
  - Vercel and Convex are the only approved storage locations for environment secrets.
  - No secrets in Notion, Slack, email, or plain text docs.
  - Any temporary sharing of a secret (for example during setup) must be followed by rotation.

---

## 4. Secret Categories and Rotation Frequency

Secrets are grouped into three categories with target rotation frequencies.

### 4.1 High Sensitivity

Examples:

- Database root or admin passwords
- Encryption keys for any stored data
- Auth provider signing keys (e.g., `CLERK_SECRET_KEY`)
- Azure OpenAI keys or similar large language model keys tied to student or advisor data
- SMTP provider credentials for system email

Rotation:

- Every 90 days at minimum
- Immediately after:
  - Any suspected compromise
  - Any contractor or staff departure with access to the secret
  - Any significant incident involving the relevant system

Access:

- Restricted to Head of Engineering, Head of Security, and relevant lead engineers.

---

### 4.2 Medium Sensitivity

Examples:

- Non root database user passwords
- API keys for monitoring, logging, analytics
- API keys for dev tools that touch non production data
- Webhook secrets (e.g., `CLERK_WEBHOOK_SECRET`)

Rotation:

- Every 180 days at minimum
- Immediately after:
  - Third party reports incident involving keys or tokens
  - Change of vendor or plan

Access:

- Engineering team members who need them for their work.

---

### 4.3 Low Sensitivity (Non-Public)

Examples:

- Non sensitive configuration values that still should not be public
  - Internal email addresses used for alerts
  - Feature flag tokens
  - Read only analytics access tokens
- Public keys (e.g., `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CONVEX_URL`)

Rotation:

- Annually or when staff with access leave the project.

Access:

- Can be more broadly available, but still only in approved storage locations.

---

## 5. Rotation Policy and Procedure

### 5.1 When to Rotate

Secrets must be rotated:

1. On a fixed schedule based on category:
   - High sensitivity every 90 days
   - Medium sensitivity every 180 days
   - Low sensitivity annually
2. On events:
   - Staff or contractor with access leaves the project or changes roles
   - Any security incident involving the related system
   - Any accidental exposure (for example pasted into a log, Slack, or screenshot)

---

### 5.2 Rotation Steps

Standard rotation steps for a secret:

1. **Identify where the secret is used:**
   - Vercel environment variables
   - Convex environment
   - Local `.env.local` files
   - Any other integration

2. **Generate a new secret:**
   - Use provider tools or secure random generation.
   - Never hand craft predictable secrets.

3. **Update storage locations:**
   - Update Vercel or Convex environment settings.
   - Update the shared vault with the new value and mark the old value as deprecated.
   - Notify engineers to update their local `.env.local` from the vault.

4. **Deploy with the new secret:**
   - Apply configuration changes then trigger a deployment or environment restart if needed.
   - Confirm logs and monitoring around the relevant services show healthy behavior.

5. **Retire the old secret:**
   - Remove or invalidate the old key or password at the provider.
   - Confirm the system does not accept the old secret.

6. **Log the rotation:**
   - Record in the secrets rotation log (see `docs/templates/secrets-rotation-log.md`):
     - Date
     - Secret name or alias (no actual value)
     - Environment
     - Who rotated it
     - Why rotation occurred (scheduled or incident driven)

---

## 6. Access Control

- **Production and pilot secrets:**
  - Only Head of Engineering, Head of Security and Privacy, and designated lead engineers.
- **Staging secrets:**
  - Broader engineering team access permitted.
- **Development secrets:**
  - All engineers and relevant contractors can access, but only via the shared vault.

**Prohibited channels for secrets:**

- Screenshots
- Plain text in Slack or email
- Notion pages or Google Docs

If this ever happens, treat it as exposure and rotate the secret.

---

## 7. Ownership and Review

- **Primary owner:** Head of Security and Privacy
- **Technical co-owner:** Head of Engineering

Responsibilities:

- Maintain the list of active secrets and their categories.
- Ensure rotation schedules are followed.
- Review this standard at least annually or after any major security incident.

Changes to this standard that relax controls or reduce rotation frequency must be approved by:

- Head of Security and Privacy
- Head of Engineering

---

## Quick Reference

| Category | Examples | Rotation | Access |
|----------|----------|----------|--------|
| High | Auth signing keys, DB admin, OpenAI keys | 90 days | Leads only |
| Medium | Webhook secrets, monitoring API keys | 180 days | Engineering team |
| Low | Public keys, feature flags | Annually | Broader access |

---

## Related Documents

- [Coding Standards](./CODING_STANDARDS.md)
- [Secrets Rotation Log Template](./templates/secrets-rotation-log.md)
