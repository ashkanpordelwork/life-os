# "Right now" engine

The app's core idea (owner decision, 2026-11-16): you open the app in the moment you're in
("my neck hurts", "I'm stressed") and get one small thing to do. Weekly habits come second.

There is **no screen for it yet**. This is the logic and the data, with tests.

| File | What it is |
|---|---|
| `src/data/rightNow.ts` | The 12 states, 11 actions, evidence strength and DOI sources per row |
| `src/engine/rightNow.ts` | `rightNow()` picks what to offer; `habitOffer()` turns a repeat winner into a weekly habit |
| `src/engine/rightNow.test.ts` | 27 tests for every rule below |
| `src/i18n/en.json` → `now.*` | All texts, red-flag questions included |
| `docs/problem-solution-matrix.md` | Where every row comes from (PubMed) |

## Order of rules

1. **Red flag** → `stop`: "talk to a doctor", no tips. Runs before anything else.
2. **Food gate** (craving, stress eating, weight): closed if the eating screen is not `clear`, or the user is under 18, has diabetes or kidney disease, takes weight medicine, or reported pregnancy, a heart condition or illness. Closed gate → only calm non-food options (a walk, daylight) and "talk to a professional".
3. **Doctor lock** (`REQUIRE_DOCTOR_REVIEW = true`): an option is offered only when its `review` is `'approved'`. Today every row is `'draft'`, so the engine offers nothing to users.
4. **Pending research** is never offered (`strength: 'pending'`).
5. **What fits**: time available, daylight, time of day (warm shower is evening or night only), and health answers.
6. **Your own answers** ("Did it help?", last 14 days): two "no" in a row drops an action; "yes" and "a bit" lift it by at most 2. Evidence strength still counts most (moderate 3, low 2, indirect 1).
7. **Result**: one main suggestion, up to two alternatives, and `talkToPro` for food and low mood.

## Turning it into a habit

After the same action helped 3 times in 14 days, `habitOffer()` returns the matching weekly habit
(for example, "Take a short walk" → Sitting break). Actions without a habit never get an offer.

## What a doctor must do before it ships

- Approve or change each row in the matrix, then set that option to `review: 'approved'`.
- Write and approve the red-flag lists (`now.states.*.redFlags`). The counts in `RED_FLAG_COUNT` must match.
- Write the eating-problem screen. The engine only needs its result (`clear`, `risk`, `unknown`).
- Confirm who is excluded from food tips and from the warm shower.

## What it does not do yet

- No screen, no storage of "Did it help?" answers, no Health check questions for diabetes, kidney disease, weight medicine or age.
- Pending rows: physiological sigh, water for headache, a walk for low energy, and everything in the matrix marked `pending`.
