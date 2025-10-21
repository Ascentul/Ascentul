# Resume Builder V2 - Pre-Production QA Checklist

**Version:** 1.0  
**Date:** 2025-10-20  
**Status:** Ready for Testing

---

## Overview

This document provides a comprehensive QA checklist for Resume Builder V2 before production deployment. All items should be verified in staging environment with `NEXT_PUBLIC_RESUME_V2_STORE=true`.

## Smoke Tests (Critical Path)

Run these tests before every deployment:

1. [ ] Create resume from profile
2. [ ] Edit block in inspector
3. [ ] Undo/redo
4. [ ] Switch layout
5. [ ] Switch theme
6. [ ] Add page
7. [ ] AI Coach suggestion apply
8. [ ] AI Authoring stream and cancel
9. [ ] Export PDF
10. [ ] Records grid rename

**All 10 smoke tests must pass** before deploying to production.

For full checklist, see detailed sections in this file.
