# Resume Builder V2 - Changelog

## Version 2.0.0 - General Availability (2025-10-20)

### User-Facing Features

#### Visual Editor
- ✨ **Live canvas preview** - Real-time editing with <16ms latency
- ✨ **Undo/redo** - Full history with keyboard shortcuts (Cmd+Z / Cmd+Shift+Z)
- ✨ **Block inspector** - Precise control over each resume section
- ✨ **Overflow panel** - Shows unmapped blocks after layout changes

#### Personalization
- 🎨 **Layout picker** - Choose from 3 professional layouts (Classic, Modern, Executive)
- 🎨 **Theme picker** - Select from 4 color schemes (Blue, Slate, Green, Indigo)
- 🎨 **Page operations** - Add, duplicate, reorder, and delete pages
- 🎨 **Smart layout switching** - Content preserved when changing layouts

#### AI-Powered Authoring
- 🤖 **AI Coach** - Analyzes resume and suggests improvements
- 🤖 **AI Authoring Panel** - 6 writing actions:
  - Generate Summary
  - Rewrite Experience
  - Tailor to Job
  - Improve Bullet
  - Fix Tense
  - Translate
- 🤖 **Real-time streaming** - Watch AI generate content word-by-word
- 🤖 **Cancel support** - Stop AI mid-stream with <200ms latency
- 🤖 **Built-in guardrails** - Protects against PII leaks and secrets
- 🤖 **Audit log** - Tracks last 5 AI edits with timestamps

#### Export & Organization
- 📄 **Smart file naming** - Format: `FullName-Template-YYYYMMDD.pdf`
- 📄 **Clickable contact links** - Optional mailto/tel links for digital distribution
- 📄 **Contact validation** - Empty fields handled gracefully (no crashes)
- 📁 **Inline rename** - Rename resumes with Enter to save, Escape to cancel
- 📁 **Auto-refreshing thumbnails** - Updates after edits with 800ms debounce
- 📁 **Sort by date** - Newest resumes first

### Infrastructure Improvements

- 🏗️ **Zustand store** - Reliable state management with broker pattern
- 🏗️ **React Error Boundaries** - Graceful error handling, no white screens
- 🏗️ **Comprehensive test coverage** - 48 Phase 8 tests alone
- 🏗️ **Feature flags** - Safe rollout with `NEXT_PUBLIC_RESUME_V2_STORE`
- 🏗️ **Telemetry framework** - Observability and monitoring
- 🏗️ **Zero new dependencies** - Built with existing tech stack

### Performance

- ⚡ **<16ms edit latency** - Visual updates in one frame
- ⚡ **<200ms AI cancel** - Fast response to user actions
- ⚡ **<10s PDF export** - Reasonable time for 2-page resume (p95)
- ⚡ **800ms thumbnail debounce** - Efficient caching and regeneration

### Bug Fixes

- 🐛 Fixed layout switch dropping blocks
- 🐛 Fixed PDF export with missing contact fields
- 🐛 Fixed thumbnail cache invalidation on save
- 🐛 Fixed inline rename blur/cancel conflict
- 🐛 Fixed undo/redo after save persistence

---

## Rollout Schedule

- **Week 1:** 5% rollout (internal team + early adopters)
- **Week 2:** 25% rollout (monitor error rates and metrics)
- **Week 3:** 50% rollout (if metrics look good)
- **Week 4:** 100% rollout (GA)

---

## Feature Flags

### NEXT_PUBLIC_RESUME_V2_STORE
- **Development:** `true`
- **Staging:** `true`
- **Production (Initial):** `false` (gradual rollout via `NEXT_PUBLIC_V2_ROLLOUT_PERCENT`)

### NEXT_PUBLIC_DEBUG_UI
- **Development:** `true`
- **Staging:** `false`
- **Production:** `false`

---

## Migration Notes

No migration required. V2 is opt-in via feature flag. Users can continue using V1 until rollout completes.

---

## Known Issues

None at release time. Please report issues at [GitHub Issues](https://github.com/ascentful/ascentful/issues).

---

## Credits

Built with [Claude Code](https://claude.com/claude-code)
