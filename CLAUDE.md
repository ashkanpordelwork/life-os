# Life OS: notes for Claude

## UI rules
- **Never cut a shadow.** A card's shadow (`--shadow-card`, `--shadow-floating`) must never be clipped.
  - Don't wrap cards in a box with `overflow: hidden` / `auto` / `scroll`.
  - Opening/closing by height: use `<Collapse>` (src/components/Collapse.tsx). It clips only while moving.
  - A scroll box that holds cards gets the `shadow-room` class (inside a BottomSheet: `shadow-room shadow-room--sheet`).
  - `overflow: hidden` on a card itself is fine (it doesn't clip its own shadow).
  - `src/styles/shadowRules.test.ts` fails the build if an inline `overflow: 'hidden'` comes back in a screen.
- Components use semantic tokens only; no raw hex outside `src/styles/tokens.css`.
- UI text lives in `src/i18n/en.json`. Sprint, Patch, Release and Task stay in English.
- Logical CSS properties (inline/block), touch targets at least 44px, layout 375–430 wide.
