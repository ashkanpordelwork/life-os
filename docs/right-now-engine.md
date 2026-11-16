# "Right now" engine

The app's core idea (owner decision, 2026-11-16): you open the app in the moment you're in
("my neck hurts", "I'm stressed") and get one small thing to do. Weekly habits come second.

**The app never blocks the user** (owner decision, same day). No "stop", no gate, no empty answer.
A red flag, a food topic or a health group only adds a small, gentle note next to the suggestion.

There is **no screen for it yet**. This is the logic and the data, with tests.

| File | What it is |
|---|---|
| `src/data/rightNow.ts` | The 12 states, 11 actions, evidence strength and DOI sources per row, and the fallback action |
| `src/engine/rightNow.ts` | `rightNow()` picks what to offer; `habitOffer()` turns a repeat winner into a weekly habit |
| `src/engine/rightNow.test.ts` | 29 tests for every rule below |
| `src/i18n/en.json` → `now.*` | All texts, red-flag questions and the two notes included |
| `docs/problem-solution-matrix.md` | Where every row comes from (PubMed) |

## What `rightNow()` does

1. **Drops pending research.** An option with `strength: 'pending'` is never offered (no evidence found yet).
2. **Keeps each action safe for the person.** Some actions are hidden for certain health answers (the warm shower with pregnancy, a heart condition or illness). Another action is picked instead.
3. **Fits the moment**: time available, daylight, time of day. If nothing fits, these limits are relaxed. If still nothing, it falls back to slow breathing. The user always gets something.
4. **Uses your own answers** ("Did it help?", last 14 days): two "no" in a row drops an action; "yes" and "a bit" lift it by at most 2. Evidence strength still counts most (moderate 3, low 2, indirect 1).
5. **Returns** one main suggestion, up to two alternatives, and an `advice` value.

## The small note (`advice`)

| Value | When | How it should look |
|---|---|---|
| `none` | Everything else | Nothing |
| `hint` | Food topics, low mood, or a flagged health group on a food topic | A quiet line: "A professional can help with this too." |
| `note` | The user ticked a red-flag question | One gentle sentence: "This is worth checking with a doctor. Here's something small to try meanwhile." |

The suggestion is shown in every case. The red-flag questions are optional.

## Doctor review

Each option has `review: 'draft' | 'approved'`. Doctors supervise the rows, but nobody waits for them.
`REQUIRE_DOCTOR_REVIEW` is **off**. Turn it on to offer only approved rows; the engine then answers `none` when nothing is approved.

## Turning it into a habit

After the same action helped 3 times in 14 days, `habitOffer()` returns the matching weekly habit
(for example, "Take a short walk" → Sitting break). Actions without a habit never get an offer.

## What it does not do yet

- No screen, no storage of "Did it help?" answers, no Health check questions for diabetes, kidney disease, weight medicine or age.
- Pending rows: physiological sigh, water for headache, a walk for low energy, and everything in the matrix marked `pending`.
- Doctors still need to write the red-flag lists and the eating-problem check. They change the note, not access.
