# Third-Party Data Processing & FERPA/GDPR Compliance

## Overview

This document outlines all third-party services that process user data in the Ascentul platform, the types of data sent to each service, and compliance requirements.

## Third-Party Services

### 1. OpenAI API

**Status**: ACTION REQUIRED - Verify DPA is in place

**Usage Locations**:
- `src/app/api/ai-coach/conversations/[id]/messages/route.ts` - AI coaching chat
- `src/app/api/ai-coach/generate-response/route.ts` - AI response generation
- `src/app/api/cover-letters/generate/route.ts` - Cover letter generation
- `src/app/api/cover-letters/analyze/route.ts` - Cover letter analysis
- `src/app/api/resumes/analyze/route.ts` - Resume analysis
- `src/app/api/resumes/optimize/route.ts` - Resume optimization
- `src/app/api/resumes/generate/route.ts` - Resume generation
- `src/app/api/resumes/parse/route.ts` - Resume parsing
- `src/app/api/resumes/suggestions/route.ts` - Resume suggestions
- `src/app/api/career-path/generate/route.ts` - Career path generation
- `src/app/api/career-path/generate-from-job/route.ts` - Career path from job
- `src/app/api/career-paths/generate/route.ts` - Career paths generation
- `src/app/api/career-certifications/route.ts` - Career certifications

**Data Sent to OpenAI**:
| Data Type | Sent | Justification |
|-----------|------|---------------|
| User name | No | Excluded from prompts |
| User email | No | Never sent to AI |
| Bio | No | Excluded (PII risk) |
| Career goals | No | Excluded (PII risk) |
| Current position | Yes | Required for career coaching |
| Current company | Yes | Required for career coaching |
| Skills | Yes | Required for resume/career features |
| Work history | Yes | Required for resume generation |
| Education history | Yes | Required for resume generation |
| Job descriptions | Yes | User-provided for applications |
| Resume content | Yes | Required for analysis features |
| Application notes | No | Excluded (may contain sensitive info) |

**Compliance Requirements**:
1. **Data Processing Agreement (DPA)**: OpenAI offers a DPA for enterprise customers
   - URL: https://openai.com/policies/data-processing-addendum
   - Action: Sign DPA if processing EU resident data (GDPR requirement)
   - Action: Verify DPA covers educational records (FERPA requirement)

2. **Data Retention**: OpenAI's API data retention policy
   - By default, API data is NOT used for training (since March 2023)
   - Verify this is enabled in OpenAI dashboard settings
   - Consider enabling zero data retention if available

3. **Model Selection**: Using `gpt-4o` model
   - Ensure model is covered under DPA
   - Document model version for audit trail

**Risk Mitigation Implemented**:
- Bio and career_goals excluded from AI prompts (commit: current session)
- Application notes excluded from AI coach context (commit: current session)
- No direct user identifiers (email, name) sent to OpenAI

### 2. Clerk (Authentication)

**Status**: Compliant - Standard authentication provider

**Data Processed**:
- Email addresses
- Names
- Profile images
- Authentication tokens
- Session data

**Compliance**:
- Clerk is SOC 2 Type II certified
- GDPR compliant with DPA available
- Data stored in US (consider EU data residency for EU users)

### 3. Convex (Database)

**Status**: Compliant - Primary data store

**Data Processed**:
- All user data (see schema.ts for full inventory)
- Educational records (FERPA-covered)
- Career documents (resumes, cover letters)

**Compliance**:
- Data encrypted at rest and in transit
- SOC 2 Type II certified
- GDPR compliant

### 4. SendGrid / Mailgun (Email)

**Status**: Review Required

**Data Processed**:
- Recipient email addresses
- Email content (may include names, university info)

**Compliance Requirements**:
- Verify DPA is signed for both providers
- Review email templates for PII minimization
- Consider EU-specific email routing for GDPR

### 5. Stripe (via Clerk Billing)

**Status**: Compliant - Payment processing

**Data Processed**:
- Payment information (handled by Stripe)
- Subscription status synced to Convex

**Compliance**:
- PCI DSS compliant (via Stripe)
- GDPR compliant with DPA

## FERPA Compliance Checklist

For university-affiliated users (students, advisors, university_admin):

- [x] Educational records stored securely in Convex
- [x] Access controls enforce university tenant isolation
- [x] Audit logging tracks all data access
- [x] PII redacted from audit log reads
- [ ] Verify OpenAI DPA covers educational records
- [ ] Document data retention policies
- [ ] Establish breach notification procedures

## GDPR Compliance Checklist

For EU resident users:

- [x] Data minimization in AI prompts
- [x] PII-safe logging implemented
- [ ] Verify all third-party DPAs are signed
- [ ] Implement data export functionality (right to portability)
- [ ] Implement data deletion functionality (right to erasure)
- [ ] Document lawful basis for processing
- [ ] Consider EU data residency options

## Action Items

### Immediate (Before Production)

1. **OpenAI DPA**:
   - Contact OpenAI to sign Data Processing Agreement
   - Document DPA effective date and coverage
   - Verify educational records are covered

2. **Email Provider DPAs**:
   - Verify SendGrid DPA status
   - Verify Mailgun DPA status

### Short-term (Within 30 days)

3. **Data Retention Policy**:
   - Define retention periods for each data type
   - Implement automated data deletion for expired records
   - Document in privacy policy

4. **Breach Response Plan**:
   - Document notification procedures
   - Identify responsible parties
   - Test notification workflow

### Long-term

5. **EU Data Residency**:
   - Evaluate EU-based hosting options
   - Consider Convex EU region when available

6. **Privacy Impact Assessment**:
   - Conduct full DPIA for AI features
   - Document risk mitigation measures

## Audit Trail

| Date | Action | Performed By |
|------|--------|--------------|
| 2024-XX-XX | Initial security audit | [Name] |
| 2024-XX-XX | PII logging fixes deployed | [Name] |
| 2024-XX-XX | AI prompt data minimization | [Name] |
| TBD | OpenAI DPA signed | TBD |
| TBD | Email provider DPAs verified | TBD |

## References

- OpenAI DPA: https://openai.com/policies/data-processing-addendum
- OpenAI API Data Usage: https://openai.com/policies/api-data-usage-policies
- Clerk Security: https://clerk.com/security
- Convex Security: https://docs.convex.dev/production/security
- FERPA Overview: https://studentprivacy.ed.gov/faq/what-ferpa
- GDPR Overview: https://gdpr.eu/
