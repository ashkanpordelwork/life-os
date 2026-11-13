# Life OS · Figma map (source of truth for UI)

Figma file: https://www.figma.com/design/EI4fGzmwkiRz6SwDlHk2XX
File key: `EI4fGzmwkiRz6SwDlHk2XX`
Pages: `Design` (all flows), `Components`, `Icon`.

Rule: when a screen is built, read its node with Figma MCP (`get_design_context`) and screenshot (`get_screenshot`). Do not guess spacing, color or copy.

## 1. Tokens (Light mode only)

Naming rule: Figma `Color/bg/app` becomes `--color-bg-app`. `Layout/space/16` becomes `--space-16`. `radius/md` becomes `--radius-md`.
Components must use semantic tokens (`Color/*`) only. Primitives are for `tokens.css` definitions.

### Primitives
orange: 50 #fff4ec, 100 #ffe6d4, 200 #ffcba6, 300 #ffa977, 400 #ff8446, 500 #f2601f, 600 #d4440f, 700 #b03a0d, 800 #7f2a0a
neutral: 0 #ffffff, 50 #fffaf6, 100 #f7f0ea, 200 #ede3dc, 300 #d9ccc4, 400 #b8a89e, 500 #7a6a60, 700 #4a3b33, 900 #1f1612
green: 100 #ddf3e8, 600 #1b7f53
indigo: 50 #eceaf5, 100 #e6e6fb, 600 #4c4cc2, 800 #403771
teal: 100 #d8f0f5, 700 #12708a
red: 100 #fde3e1, 600 #c4302b
yellow: 100 #fff1cc, 700 #8a5a00
white alpha: a30, a60, a70

### Semantic (Color collection)
bg/app = neutral/50
bg/subtle = neutral/100
surface/card = neutral/0
surface/glass = white/a60
text/primary = neutral/900
text/secondary = neutral/500
text/on-action = neutral/0
text/brand = orange/700
text/disabled = neutral/500
border/default = neutral/200
border/glass = white/a70
border/focus = orange/600
action/primary = orange/600
action/primary-pressed = orange/700
action/secondary = neutral/0
action/disabled = neutral/200
status/success = green/600, status/success-bg = green/100
status/danger = red/600, status/danger-bg = red/100
status/gold = yellow/700, status/gold-bg = yellow/100
area/move = teal/700, area/move-bg = teal/100
area/nutrition = green/600, area/nutrition-bg = green/100
area/sleep = indigo/600, area/sleep-bg = indigo/100
area/mind = indigo/800, area/mind-bg = indigo/50
heat/0 = neutral/200, heat/1 = orange/200, heat/2 = orange/300, heat/3 = orange/500, heat/4 = orange/700
brand/soft = orange/100, brand/main = orange/500
progress/track = neutral/400

### Layout
space: 4, 8, 12, 16, 20, 24, 32, 40
radius: sm 8, md 12, lg 20, xl 28, pill 999
size: touch 44, icon 24

### Text styles (fonts: Manrope, JetBrains Mono)
Display: Manrope ExtraBold 32/40, ls -1
Display/XL: Manrope ExtraBold 64/68, ls -2
Title/L: Manrope Bold 24/30, ls -0.5
Title/M: Manrope Bold 20/26
Title/S: Manrope SemiBold 16/22
Body/M: Manrope Regular 16/24
Body/M Strong: Manrope SemiBold 16/24
Body/S: Manrope Regular 14/20
Caption: Manrope Medium 12/16
Label: Manrope SemiBold 12/16, ls 4 (uppercase)
Number: Manrope ExtraBold 28/32, ls -0.5
Mono/Label: JetBrains Mono Medium 12/16, ls 4
Mono/Caption: JetBrains Mono Medium 12/16
Mono/Value: JetBrains Mono Bold 24/28, ls -2

Effects: Shadow/Card, Shadow/Button, Shadow/Floating, Glass/Card, Glass/Floating.
Paints: Gradient/Hero, Gradient/Soft, Glass/Fill.

## 2. Components (page `Components`)
Variant sets: Button (9), Chip (2), Tag (4), EvidenceBadge (4), HeatCell (5), SprintDot (3), NavItem (2), HabitCard (2), AnswerRow (2), Toggle (2), IconTile (18), PatchCard (2), VersionTab (2).
Single: Progress, NavBar, TopBar, ListRow, StatTile, StatChip, MetaChip.
Mascots: many (`Mascot/Core/Welcome`, `Mascot/Milestone/Small win`, `Mascot/Safety/Safety`, ...). Use them as images exported from Figma.

Screen size: 390 x 844 (mobile). Content padding 16.

## 3. Screens by flow (page `Design`)

### Flow 0 · Sign in
Log in `2046:2963`, Create account `2046:3052`

### Flow 1 · Onboarding (BUILD FIRST)
Welcome `55:163`
Symptoms `55:196`
Question 1 Movement `55:229`
Question 2 Nutrition `55:262`
Question 3 Sleep `55:293`
Question 4 Mind `55:324`
Starting score `55:355`
Pick patches `55:390`
Sprint ready `55:450`
Today (day 1) `2034:3528`

### Flow 2 · Daily loop
Today `2033:2739`, Patch detail `2033:2855`, Done `56:393`, Today (2 of 3) `2033:2883`, Today (all done) `2033:3011`, Busy day sheet `2033:3276`, Rest day sheet `2033:3392`, Today (rest day) `2033:3151`

### Flow 3 · Sprint planning
Roadmap `48:109`, Sprint 4 review `58:696`, Suggestions `58:748`, Browse patches `58:809`, Confirm Sprint 5 `58:881`, Today (Sprint 5 set) `2035:3469`

### Flow 4 · Progress review
Progress `50:161`, Day detail `59:891`, Progress · Sleep `59:1156`, Score by area `59:1430`, Release notes `59:1494`, Season complete `59:1516`

### Flow 5 · Presence
Reminders intro `2031:2563`, Work hours `2031:2691`, Calendar `2031:2746`, Telegram `2031:2796`, Your nudges `2031:2880`, Weekly note `2031:2955`

### Flow 6 · Return and modes
Welcome back `2031:3072`, Mode picker `2031:3140`, Today in Release week `2031:3199`, Make it smaller `2031:3317`, Recovery mode `2031:3395`

### Flow 7 · You and trust
You `2032:2654`, Reminder settings `2032:2782`, My patches `2032:2837`, Data `2032:2915`, Delete `2032:2973`, Help `2032:3093`

### Flow 8 · System states
Empty `2032:3166`, Error `2032:3251`, Offline `2032:3320`, Loading `2032:3382`, Notifications blocked `2032:3464`, Safety `2032:3562`

## 4. Product facts visible in Figma (must be reflected in code and data)
- A Patch has THREE versions (VersionTab in Patch detail `2033:2855`). Read the tab names there.
- A Patch has a tiny version (about 20 s) used by the Busy day sheet. Example copy: "Morning light · 1 min", "Chin tucks · 3 reps", "Protein · 1 yogurt".
- Sprints have themes shown in Roadmap: Morning basics, Move more, Eat on time, Sleep base, Calm focus. Sprint = 14 days, 3 patches, about 12 minutes a day.
- Release at the end of a Sprint: each patch is Keep, Swap or Drop.
- Rest day keeps the streak ("Streak safe. Nothing owed.").
- Known inconsistencies in Figma (do not copy): `Today (Sprint 5 set)` still says "SPRINT 04"; "Sprint 04" vs "SPRINT 04" casing is mixed.
