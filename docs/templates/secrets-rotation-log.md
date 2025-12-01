# Secrets Rotation Log

This log tracks all secret rotations for audit and compliance purposes.

**IMPORTANT:** Never record actual secret values in this log. Only record the secret name/alias.

## Log Format

| Date | Secret Name | Category | Environment | Rotated By | Reason | Notes |
|------|-------------|----------|-------------|------------|--------|-------|
| YYYY-MM-DD | Secret alias | HIGH/MEDIUM/LOW | prod/staging/dev | Name | scheduled/incident/personnel | Any relevant details |

---

## Rotation Log

### 2025

| Date | Secret Name | Category | Environment | Rotated By | Reason | Notes |
|------|-------------|----------|-------------|------------|--------|-------|
| _Example:_ | | | | | | |
| 2025-01-15 | CLERK_SECRET_KEY | HIGH | production | J. Smith | scheduled | Quarterly rotation |
| 2025-01-15 | CLERK_SECRET_KEY | HIGH | staging | J. Smith | scheduled | Quarterly rotation |

---

## Scheduled Rotation Calendar

### High Sensitivity (90 days)

| Secret Name | Last Rotated | Next Due | Owner |
|-------------|--------------|----------|-------|
| CLERK_SECRET_KEY | - | - | Engineering Lead |
| OPENAI_API_KEY | - | - | Engineering Lead |
| STRIPE_SECRET_KEY | - | - | Engineering Lead |
| MAILGUN_SENDING_API_KEY | - | - | Engineering Lead |

### Medium Sensitivity (180 days)

| Secret Name | Last Rotated | Next Due | Owner |
|-------------|--------------|----------|-------|
| CLERK_WEBHOOK_SECRET | - | - | Backend Engineer |
| STRIPE_WEBHOOK_SECRET | - | - | Backend Engineer |

### Low Sensitivity (Annual)

| Secret Name | Last Rotated | Next Due | Owner |
|-------------|--------------|----------|-------|
| NEXT_PUBLIC_* keys | - | - | Any Engineer |

---

## Incident-Driven Rotations

Document any emergency rotations here with full incident details.

### Template

**Date:** YYYY-MM-DD
**Incident ID:** (if applicable)
**Secrets Affected:**
- Secret 1
- Secret 2

**Reason for Rotation:**
(Describe the incident or reason)

**Actions Taken:**
1. Step 1
2. Step 2

**Verification:**
- [ ] New secrets deployed to all environments
- [ ] Old secrets invalidated
- [ ] Systems verified working
- [ ] Incident documented

---

## References

- [Secrets Management Standard](../SECRETS_MANAGEMENT.md)
- [Coding Standards](../CODING_STANDARDS.md)
