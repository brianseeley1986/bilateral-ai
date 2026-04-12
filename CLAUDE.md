# Bilateral AI — project bible

## What this is
An AI news debate platform. User inputs a headline. Four agents fire in sequence. Output is a structured debate with depth layers.

## Stack
- Next.js 14, App Router, TypeScript
- Tailwind CSS
- Anthropic Claude claude-sonnet-4-6 for all agents

## Brand
- Name: Bilateral
- Tagline: The argument behind every headline.
- Colors: #0A0A0A near-black, #F5F5F0 off-white, #C1121F Conservative red, #1B4FBE Liberal blue, #6B6B6B neutral gray

## Agent rules — never violate
1. Researcher fires first. Conservative and Liberal both receive the same briefing.
2. Conservative agent makes the strongest conservative case. Must name its own weakest point.
3. Liberal agent makes the strongest progressive case. Must name its own weakest point.
4. Rebuttal round: each side responds to the other's named weak point.
5. Arbiter never picks a winner. Maps agreements, genuine conflicts, open questions only.
6. No caricatures. No talking points. Economist-level depth, readable prose.

## File structure
app/page.tsx — homepage with headline input
app/api/debate/route.ts — pipeline API route
app/debate/[id]/page.tsx — debate output page
components/HeadlineInput.tsx
components/DebateViewer.tsx
components/SourceBadge.tsx
lib/agents.ts — all four system prompts
lib/pipeline.ts — orchestration
lib/search.ts — web search wrapper
lib/store.ts — in-memory debate store
types/debate.ts — shared types
