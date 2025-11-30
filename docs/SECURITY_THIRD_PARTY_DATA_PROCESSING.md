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
- Bio and career_goals excluded from AI prompts (commit: [HASH] or PR: [NUMBER])
- Application notes excluded from AI coach context (commit: [HASH] or PR: [NUMBER])
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
- [ ] Establish breach notification procedures (see Action Item #3 - REQUIRED before production)

## GDPR Compliance Checklist

For EU resident users:

- [x] Data minimization in AI prompts
- [x] PII-safe logging implemented
- [ ] Verify all third-party DPAs are signed
- [x] Implement data export functionality (right to portability) - See `convex/gdpr.ts` and `/api/gdpr/export-data`
- [x] Implement data deletion functionality (right to erasure) - See `convex/gdpr.ts` and `/api/gdpr/delete-account`
- [ ] Document lawful basis for processing
- [ ] Consider EU data residency options
- [ ] Establish breach notification procedures (see Action Item #3 - REQUIRED before production)

### GDPR Data Subject Rights Implementation

**Location**: `convex/gdpr.ts`, `src/app/api/gdpr/`, `src/app/(dashboard)/account/page.tsx`

**Features Implemented**:
- **Right of Access (Article 15)**: Users can export all personal data via Account Settings
- **Right to Data Portability (Article 20)**: JSON export format with structured data
- **Right to Erasure (Article 17)**: Account deletion with 30-day grace period
- **Grace Period**: Users can cancel deletion request within 30 days
- **Audit Trail**: All GDPR actions logged for compliance

**Data Included in Export**:
- User profile and settings
- Applications, resumes, cover letters
- Goals, projects, career paths
- Networking contacts and interactions
- AI coaching conversations
- Support tickets
- Activity history
- Payment history (Stripe references)

**Data Handling on Deletion**:
- All user-linked data permanently deleted after grace period
- Audit logs preserved with PII redacted (FERPA compliance)
- Financial records preserved (legal requirement)

## Action Items

### Immediate (Before Production)

| # | Item | Owner | Status | Due Date |
|---|------|-------|--------|----------|
| 1 | **OpenAI DPA** | Legal/Compliance Lead | ⏳ Pending | Before Production |
| 2 | **Email Provider DPAs** | DevOps/Platform Lead | ⏳ Pending | Before Production |
| 3 | **Breach Notification Procedures** | Security Lead + Legal | 🚨 CRITICAL | Before Production |

#### 1. OpenAI DPA
**Owner**: Legal/Compliance Lead
**Reviewers**: CTO, Security Lead
- [ ] Contact OpenAI to sign Data Processing Agreement
- [ ] Document DPA effective date and coverage
- [ ] Verify educational records are covered

#### 2. Email Provider DPAs
**Owner**: DevOps/Platform Lead
**Reviewers**: Legal/Compliance Lead
- [ ] Verify SendGrid DPA status
- [ ] Verify Mailgun DPA status

#### 3. Breach Notification Procedures (CRITICAL - Required for FERPA & GDPR)
**Owner**: Security Lead
**Reviewers**: Legal, CTO, Customer Success
**Priority**: 🚨 BLOCKER - Required before any production deployment with FERPA or GDPR data

**Sub-tasks**:
- [ ] Document notification procedures and timelines
  - GDPR: 72 hours to supervisory authority
  - FERPA: Notify affected students/parents without unreasonable delay
- [ ] Identify responsible parties and escalation chain
- [ ] Create notification templates for different breach types
- [ ] Test notification workflow with tabletop exercise
- [ ] Document contact information for regulatory bodies

**See also**: [Breach Notification Runbook](#breach-notification-runbook) below

### Short-term (Within 30 days)

| # | Item | Owner | Status | Due Date |
|---|------|-------|--------|----------|
| 4 | **Data Retention Policy** | Product/Engineering Lead | ⏳ Pending | +30 days |

#### 4. Data Retention Policy
**Owner**: Product/Engineering Lead
**Reviewers**: Legal/Compliance Lead, Security Lead
- [ ] Define retention periods for each data type
- [ ] Implement automated data deletion for expired records
- [ ] Document in privacy policy

### Long-term

| # | Item | Owner | Status | Due Date |
|---|------|-------|--------|----------|
| 5 | **EU Data Residency** | Platform/Infrastructure Lead | 📋 Planned | TBD |
| 6 | **Privacy Impact Assessment** | Product Lead + Legal | 📋 Planned | TBD |

#### 5. EU Data Residency
**Owner**: Platform/Infrastructure Lead
**Reviewers**: Legal/Compliance Lead
- [ ] Evaluate EU-based hosting options
- [ ] Consider Convex EU region when available

#### 6. Privacy Impact Assessment
**Owner**: Product Lead
**Reviewers**: Legal, Security Lead
- [ ] Conduct full DPIA for AI features
- [ ] Document risk mitigation measures

---

## Breach Notification Runbook

**Purpose**: Step-by-step procedure for handling data breaches in compliance with GDPR (72-hour notification) and FERPA requirements.

### Incident Response Team

| Role | Responsibility | Contact |
|------|----------------|---------|
| **Incident Commander** | Overall coordination, decision authority | TBD |
| **Security Lead** | Technical investigation, containment | TBD |
| **Legal/Compliance** | Regulatory notification, legal guidance | TBD |
| **Communications** | User notifications, PR | TBD |
| **Customer Success** | University/customer liaison | TBD |

### Response Timeline

```
Hour 0: Breach discovered
├── Immediately notify Incident Commander
├── Begin containment measures
└── Start documentation

Hour 1-4: Initial Assessment
├── Determine scope (affected users, data types)
├── Identify root cause if possible
├── Assess if FERPA/GDPR data affected
└── Legal review of notification requirements

Hour 12-24: Notification Preparation
├── Draft notification to supervisory authority (GDPR)
├── Draft affected user notification
├── Prepare university admin notifications (FERPA)
└── Review with legal

Hour 48-72: Notifications Sent (GDPR deadline)
├── Submit to supervisory authority (if EU data affected)
├── Notify affected users
├── Notify university partners (FERPA data)
└── Document all notifications sent

Post-Incident:
├── Root cause analysis
├── Remediation implementation
├── Update security procedures
└── Lessons learned documentation
```

### Notification Templates

**Location**: `docs/templates/breach-notification/` (to be created)
- `supervisory-authority.md` - GDPR authority notification
- `affected-users.md` - User email notification
- `university-partners.md` - University admin notification
- `internal-incident-report.md` - Internal documentation

### Regulatory Contacts

| Authority | Jurisdiction | Contact | Notes |
|-----------|-------------|---------|-------|
| ICO (UK) | UK GDPR | https://ico.org.uk/make-a-complaint/ | 72-hour deadline |
| DPC (Ireland) | EU GDPR | https://www.dataprotection.ie/ | 72-hour deadline |
| US Dept of Education | FERPA | TBD | "Without unreasonable delay" |

---

## Audit Trail

**Maintenance**: Security Lead is responsible for updating this table after each compliance event (security audits, DPA signings, major deployments).

| Date | Action | Performed By |
|------|--------|--------------|
| _YYYY-MM-DD_ | _Initial security audit_ | _Security Lead_ |
| _YYYY-MM-DD_ | _PII logging fixes deployed_ | _Engineering_ |
| _YYYY-MM-DD_ | _AI prompt data minimization_ | _Engineering_ |
| _TBD_ | _OpenAI DPA signed_ | _Legal/Compliance_ |
| _TBD_ | _Email provider DPAs verified_ | _DevOps_ |

> **Note**: Rows in italics are template entries. Replace with actual dates and names as actions are completed. Remove this note once the audit trail contains real entries.

## References

- OpenAI DPA: https://openai.com/policies/data-processing-addendum
- OpenAI API Data Usage: https://openai.com/policies/api-data-usage-policies
- Clerk Security: https://clerk.com/features/security
- Clerk DPA: https://clerk.com/legal/dpa
- Convex Security: https://www.convex.dev/security
- FERPA Overview: https://studentprivacy.ed.gov/faq/what-ferpa
- GDPR Overview: https://gdpr.eu/
