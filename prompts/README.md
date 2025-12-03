# AI Prompts Directory

This directory contains versioned prompt files for all AI tools in the Ascentul platform.

## Structure

```
prompts/
├── README.md
├── {tool-id}/
│   ├── system.md      # Main system prompt
│   └── rubric.md      # Evaluation rubric (optional)
```

## Prompt File Format

Each prompt file uses markdown with YAML frontmatter:

```markdown
---
tool_id: resume-generation
kind: system           # system, rubric, or other
version: 1.0.0         # Semantic version (MAJOR.MINOR.PATCH)
risk_level: medium     # low, medium, or high
model: gpt-4o          # Default model (optional)
temperature: 0.7       # Default temperature (optional)
max_tokens: 4096       # Max tokens (optional)
pcr_link: https://...  # Change request link (required for medium/high in prod)
notes: Description     # Notes about this version
---

The actual prompt content goes here...
```

## Versioning Rules

- **MAJOR** (x.0.0): Breaking changes, new capabilities, safety rule changes
- **MINOR** (0.x.0): Structure changes, better examples, no new capabilities
- **PATCH** (0.0.x): Typos, minor clarifications, no behavior change

## Risk Levels

| Level | Description | Prod Requirements |
|-------|-------------|-------------------|
| Low | Typos, formatting | None |
| Medium | Structure changes | PCR link required |
| High | Safety/behavior changes | PCR + 1 approval + eval run |

## Syncing to Convex

Prompts are synced to Convex using the sync script:

```bash
# Preview what would be synced
npx ts-node scripts/ai-quality/sync-prompts.ts --dry-run

# Sync all prompts
npx ts-node scripts/ai-quality/sync-prompts.ts

# Sync specific tool
npx ts-node scripts/ai-quality/sync-prompts.ts --tool=resume-generation
```

## Creating a New Version

1. Edit the markdown file with your changes
2. Update the `version` in frontmatter based on risk level
3. Set appropriate `risk_level`
4. Add `pcr_link` for medium/high risk changes
5. Add `notes` describing what changed
6. Run sync script to upload to Convex
7. Activate in the AI Quality Center UI

## Tools

| Tool ID | Description | Default Model |
|---------|-------------|---------------|
| resume-generation | Generate tailored resumes | gpt-4o |
| resume-analysis | Analyze resume quality | gpt-4o |
| resume-optimization | Optimize for job descriptions | gpt-4o |
| resume-suggestions | Quick improvement suggestions | gpt-4o-mini |
| resume-parse | Extract data from uploaded resumes | gpt-4o-mini |
| cover-letter-generation | Generate cover letters | gpt-4o |
| cover-letter-analysis | Analyze cover letter quality | gpt-4o-mini |
| ai-coach-response | Career coaching responses | gpt-4o |
| ai-coach-message | Conversational coach messages | gpt-4o |
| career-path-generation | Generate career paths | gpt-4o |
| career-path-from-job | Career path from target job | gpt-4o |
| career-paths-generation | Multiple career path options | gpt-4o |
| career-certifications | Certification recommendations | gpt-4o-mini |
| ai-evaluator | Evaluate AI output quality | gpt-4o-mini |
