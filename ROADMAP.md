# Life OS · Roadmap (owner view)

## Where we are
- Design: done. 9 flows + full design system in Figma (cleaned for handoff).
- Logic: done. Engine spec (47 protocols, safety rules) in docs/engine-spec.md.
- Code: not started.

## Decision
Figma is frozen as a reference. After Step 2, code is the source of truth.
The design system lives in the app at /styleguide.
Only big new features (Pro, payment) get quick sketches in Figma first.

## Goal 1
A link I can send to 5–10 people. They do onboarding, start Sprint 1, and tick patches for 14 days.

## Steps
| Step | What | Who | Output |
| --- | --- | --- | --- |
| 1. Setup | GitHub repo, Figma MCP in Claude Code, docs added | Owner | Empty repo, ready |
| 2. Design system + Onboarding | Import full design system to code, /styleguide, 9 screens of Flow 1 | Claude Code | First link on GitHub Pages |
| 3. Save + Today | Supabase login, Today screen, daily ticks, streak | Claude Code | Testable link |
| 4. Test | 5–10 people for 14 days | Owner | Decide next, Free vs Pro |

## Not now
Payment, Pro lock, Flows 3–8, Persian, Telegram.

## Owner's role
Approve each step. Check the result on your phone. Say what does not match the design. No coding.
