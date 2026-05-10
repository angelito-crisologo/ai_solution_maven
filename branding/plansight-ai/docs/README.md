# PlanSight AI — Brand System

This directory contains the complete brand system for PlanSight AI, organized for AI-assisted development. Each file is focused and standalone — load only what you need for the task at hand.

## Quick lookup

| If you're building... | Read these |
|---|---|
| Marketing landing page | `voice.md`, `colors.md`, `typography.md`, `logo.md`, `components.md` |
| In-product UI (Gantt, tables, dashboards) | `colors.md`, `typography.md`, `components.md`, `data-display.md` |
| Stakeholder share view | `voice.md`, `colors.md`, `logo.md`, `share-view.md` |
| Email or notification copy | `voice.md` |
| Logo placement, favicon, icon | `logo.md`, `assets.md` |
| Tailwind / CSS setup | `tokens.md` |
| Anything else | `brand-essence.md` first, then specific files |

## File map

```
docs/
├── README.md            ← you are here
├── brand-essence.md     ← what PlanSight is, who it's for, the one-liner
├── voice.md             ← how to write copy, do-say / don't-say, examples
├── colors.md            ← full palette with hex, usage rules, semantic mapping
├── typography.md        ← type stack, scale, weight rules
├── logo.md              ← which lockup when, clear space, don'ts
├── components.md        ← buttons, cards, inputs — opinionated defaults
├── data-display.md      ← Gantt, task tables, RAG indicators, metrics
├── share-view.md        ← stakeholder-facing read-only page conventions
├── tokens.md            ← copy-paste Tailwind config + CSS variables
├── assets.md            ← every SVG and favicon file with usage
└── donts.md             ← the explicit "do not do this" list
```

## How to use these docs with Claude

When prompting Claude to build a UI, paste the relevant 2–4 docs into the conversation along with the task. Don't paste all of them — they're sized for selective use.

For most front-end tasks, the minimum useful set is: `colors.md` + `typography.md` + `tokens.md` + the task-specific doc (e.g. `components.md`).

## Source of truth

These docs derive from `PlanSight-AI-Brand-Guidelines.pdf` (the human-facing brand book). If anything conflicts, the PDF wins for visual/aesthetic decisions, and these docs win for implementation specifics (token values, code conventions). Open a PR against this directory if either drifts.
