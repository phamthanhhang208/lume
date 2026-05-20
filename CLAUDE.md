# CLAUDE.md

This file is your primary guide. Read this first, then read the other markdown files in `/docs` before doing any work.

## Project: Lume

A beauty and skincare collection app where users log makeup and skincare products, get AI-powered analysis of which products work for their skin, and generate makeup looks using products they own.

**Hackathon:** DevNetwork AI/ML Hackathon 2026 — Perfect Corp track. Deadline: May 28, 2026. Cash prize: $1,500.

## Who you're working with

Jen — frontend engineer with 3+ years experience. Comfortable with React, TypeScript, Zustand, Tailwind. She works fast and wants direct, committed advice. She would rather you push back on a bad idea than build it silently.

## Working principles

1. **Ask before assuming.** If a requirement is ambiguous, ask. Do not invent product behavior or technical decisions.
2. **Confirm phase completion before moving on.** When a phase is done, stop and summarize. Wait for explicit approval.
3. **Logic before UI.** This project is logic-first. Build flows, state, and data correctly before styling. Visual design is a separate workstream that happens later.
4. **No premature abstraction.** Build the thing first. Refactor when a pattern repeats three times.
5. **Strict TypeScript.** No `any`. No `@ts-ignore`. If types fight you, ask.
6. **One file per component.** No file should exceed ~200 lines without a good reason.

## Tech stack

- Vite + React 19 + TypeScript (strict mode)
- Tailwind CSS v4
- React Router v7 (data routes mode)
- Zustand for client state
- TanStack Query for server state and caching
- Supabase (auth, Postgres, Storage)
- Perfect Corp YouCam API (skin analysis, background removal, makeup VTO)
- Google Gemini 2.5 Flash (vision OCR, verdict reasoning, look orchestration)
- pnpm as package manager

## What you must read before coding

1. `/docs/architecture.md` — system architecture, data flow, API surface
2. `/docs/data-model.md` — Supabase schema, types, relationships
3. `/docs/flows.md` — user flows in detail
4. `/docs/api-integration.md` — Perfect Corp and Gemini integration patterns
5. `/docs/conventions.md` — code style, naming, file organization
6. `/docs/phases.md` — phased build plan with exit criteria per phase
7. `/docs/design-system.md` — how to use the design package in `/design/` (read when starting visual work)
8. `/docs/chrome-extension.md` — Chrome extension planning (read only if/when starting stretch phase)

If something in these docs conflicts with what Jen says in chat, ask which is authoritative.

## What NOT to do

- Do not add UI styling, colors, fonts, or design tokens unless explicitly instructed
- Do not install dependencies not listed in `/docs/architecture.md` without asking
- Do not write business logic before the data model is locked in
- Do not commit secrets to git
- Do not assume Perfect Corp or Gemini API shapes — verify against their docs
- Do not skip the verification steps at the end of each phase

## Current phase

**Phase 0: Project setup.** See `/docs/phases.md` for the full phase plan and current exit criteria.
