# Problem → solution matrix (draft 3)

**Status: DRAFT. Nothing here has been reviewed by a doctor.** Every row is marked `Doctor review: draft`.
Source of evidence: PubMed (systematic reviews and meta-analyses), searched 2026-11-16.
Rule: an action is only listed with a claim the abstract supports. Anything that is the app team's own idea is marked **(app inference)**.

## How to read a row

- **Right now**: what the user can do in 1–10 minutes while the problem is happening.
- **Evidence**: what the reviews say, with the certainty the authors gave. DOI links are the source.
- **Strength** (our own label, for the decision engine):
  - `moderate`: a review with at least moderate-certainty results for this very question
  - `low`: a review exists, but its authors rate certainty low or very low, or most trials have high risk of bias
  - `indirect`: the evidence is about a related population or outcome (for example, people with a diagnosis, or lab markers)
  - `pending`: not researched well enough yet
- **Say it softly**: the app should write "may help", never "will fix".

## Safety rules (apply to every row)

**Owner decision (2026-11-16): the app never blocks the user.** There is no "stop", no gate and no empty answer. A red flag, a food topic or a health group only adds a **small, gentle note** next to the suggestion ("a professional can help with this too"). Doctors supervise the rows; nobody waits for them.

1. **Never block, only note.** A "yes" to a red-flag question keeps the suggestion and adds one gentle sentence to check with a doctor. Food topics and low mood get a quieter line.
2. **Each action stays safe for the person.** Where one action may not suit a group (for example a warm bath with a heart condition or pregnancy), the app picks a different action. It does not close the app.
3. No claims about treating a disease, losing weight, or curing anxiety or depression.
4. Never diagnose. Never say a user "has" a condition.
5. Weight and mood wording: no shame words, no "should".
6. Doctors review the rows and the red-flag questions as supervisors. A doctor's word can change a row; it never freezes the app.

---

## 1. Neck, shoulder or back ache from sitting

**Right now:** stand up, move the neck and shoulders gently, walk a minute. For the longer run: a regular neck, shoulder and shoulder-blade strengthening routine.

**Evidence**
- Strengthening the neck, shoulder and scapular muscles reduced neck pain and disability in office workers with chronic neck pain (8 trials, meta-analysis). All trials had high risk of bias; certainty low. [Appl Ergon 2024](https://doi.org/10.1016/j.apergo.2023.104216)
- Workplace exercise reduced musculoskeletal pain in office workers (7 trials, 967 people). High risk of bias in 6 of 7; the authors say no firm conclusion. [BMJ Open 2022](https://doi.org/10.1136/bmjopen-2021-054288)
- Extra work breaks lowered neck discomfort, but at very low certainty. Sit-stand desks and workstation changes showed no effect on upper-limb pain. [Cochrane 2018](https://doi.org/10.1002/14651858.CD008570.pub3)
- Preventing back pain: physical activity plus ergonomics may lower pain a little (SMD −0.41); most effects were small and low certainty, and the authors question practical relevance. [Scand J Work Environ Health 2022](https://doi.org/10.5271/sjweh.4070)

**Strength:** `low`. **Caveats:** do not promise relief. Red flags: pain after a fall or injury, numbness or weakness, fever, loss of bladder or bowel control. **App inference:** a 2-minute "right now" version of the routine; the trials used longer programmes.
**Doctor review:** draft

## 2. Tired, dry or burning eyes from screens

**Right now:** look away from the screen for a bit, blink, and take regular breaks.

**Evidence**
- Across 63 studies, 77% of computer workers reported asthenopia. People who took regular breaks had lower odds of it (OR 0.21, 95% CI 0.09–0.51); anti-glare filters too (OR 0.34). Short sleep and long screen time raised the odds. [J Glob Health 2026](https://doi.org/10.7189/jogh.16.04053)
- This is an association from observational studies, not a trial of a break routine.

**Strength:** `indirect`. **Not verified yet:** the "20-20-20" rule. We have not found a review testing it. Do not cite it as proven. Red flags: sudden vision loss, flashes, eye pain with redness.
**Doctor review:** draft

## 3. Stressed or anxious right now

**Right now:** slow, controlled breathing for a few minutes.

**Evidence**
- 19 studies of breathing exercises in adults: 12 showed less anxiety, 9 less stress, no adverse events reported. The authors note few large randomised trials. [J Holist Nurs 2024](https://doi.org/10.1177/08980101241273860)
- Diaphragmatic breathing: all 3 included studies showed lower stress, from a single 20-minute session up to 9 months. Very small evidence base. [JBI 2019](https://doi.org/10.11124/JBISRIR-2017-003848)
- Brief interventions with deep breathing and gratitude "may be beneficial"; mindfulness and CBT-based programmes reduced stress, anxiety and depression in physicians and nurses. [Am J Health Promot 2020](https://doi.org/10.1177/0890117120920451)

**Strength:** `low`. **Not verified yet:** the "physiological sigh" (double inhale, long exhale) is in the app from the Huberman source; this search found no review of it. **Safety:** if the user ticks chest pain or thoughts of self-harm, breathing still shows, with a gentle sentence to check with a doctor.
**Doctor review:** draft

## 4. Tension headache

**Right now:** gentle neck and shoulder relaxation and movement. Water if you have not drunk for hours **(app inference)**.

**Evidence** (all in people with diagnosed headache, often therapist-led)
- Strength training lowered tension-type headache pain (SMD −0.84), very low certainty; aerobic training helped migraine, very low certainty. [J Pain 2021](https://doi.org/10.1016/j.jpain.2021.12.003)
- In chronic tension-type headache, neck-shoulder strengthening and muscle relaxation reduced intensity, duration and frequency. [J Oral Facial Pain Headache 2025](https://doi.org/10.22514/jofph.2025.003)
- Myofascial release reduced tension-type headache pain (SMD −0.86); quality of evidence low to very low. [Pain Res Manag 2024](https://doi.org/10.1155/2024/2042069)

**Strength:** `low` and `indirect`. **Red flags (a small note appears if ticked):** sudden "worst ever" headache, after a head injury, with fever and stiff neck, with weakness, speech or vision problems.
**Doctor review:** draft

## 5. Stiff and heavy from sitting too long

**Right now:** stand and walk lightly for a few minutes, about every 30 minutes.

**Evidence** (acute effects on blood markers, not on feeling "stiff")
- Breaking up sitting with activity lowered after-meal glucose (SMD −0.54) and insulin (−0.56) across 42 studies. [Sports Med 2020](https://doi.org/10.1007/s40279-019-01183-w)
- Interrupting at least every 30 minutes lowered glucose more than less frequent breaks; GRADE low. [Scand J Med Sci Sports 2024](https://doi.org/10.1111/sms.14769)
- Light walking beat standing for glucose and insulin; neither changed blood pressure (7 one-day trials). [Sports Med 2022](https://doi.org/10.1007/s40279-022-01649-4)
- Workplace programmes cut sitting by about 38 minutes per workday; no consistent effect on physical or psychological outcomes apart from HDL cholesterol. [Public Health 2024](https://doi.org/10.1016/j.puhe.2024.02.013)

**Strength:** `moderate` for after-meal glucose, `indirect` for how the user feels. Do not claim it fixes pain, mood or energy.
**Doctor review:** draft

## 6. Can't focus

**Right now:** get brighter light (a window, outside, a well-lit spot) and drink water if you have not had any for a long time.

**Evidence**
- Light during the day: across 62 studies in healthy adults, alertness and working memory were the most affected; bright white light improved self-reported alertness and working memory. Sustained attention and attentional control were inconclusive, and the studies differed a lot. [Biol Psychol 2024](https://doi.org/10.1016/j.biopsycho.2024.108845)
- Dehydration impaired cognition (effect −0.21), and attention most (−0.52), mainly when body-water loss was above about 2%. A normal desk day usually does not reach that. [Med Sci Sports Exerc 2018](https://doi.org/10.1249/MSS.0000000000001682)

**Strength:** `low`. **App inference:** "go near daylight" for the light advice; the studies used lab or office lights. **Pending:** short exercise or walking breaks for attention in healthy adults. Two queries returned only older adults, brain stimulation or children, so none are cited.
**Doctor review:** draft

## 7. Low mood, no motivation

**Right now:** a walk or other movement. For the longer run: regular exercise.

**Evidence** (adults with depression or depressive symptoms; not "I feel flat today")
- 73 trials: exercise lowered depressive symptoms vs control (SMD −0.67, low certainty); no clear difference from psychological therapy (moderate certainty) or from medication (low certainty). [Cochrane 2026](https://doi.org/10.1002/14651858.CD004366.pub7)
- 41 trials: large effect (SMD −0.95), moderate (−0.67) when only low-risk-of-bias studies were kept. Authors point to supervised, moderate-intensity, aerobic exercise. [Br J Sports Med 2023](https://doi.org/10.1136/bjsports-2022-106282)

**Strength:** `moderate` for ongoing exercise and depressive symptoms; `indirect` for "right now". **Pending:** the acute effect of one short walk on mood. **Safety:** low mood for more than about two weeks, hopelessness, or any thought of self-harm: the suggestion stays and a gentle sentence points to a professional. The app does not treat depression.
**Doctor review:** draft

## 8. Can't fall asleep tonight

**Right now:** a warm shower or bath 1–2 hours before bed. The rest is not established; see the warning below.

**Evidence**
- A warm shower or bath at 40–42.5 °C improved self-rated sleep quality and sleep efficiency (17 studies, 13 in the meta-analysis). Scheduled 1–2 hours before bedtime, even 10 minutes shortened the time to fall asleep. The authors say research is scarce and the best timing and length are not settled. [Sleep Med Rev 2019](https://doi.org/10.1016/j.smrv.2019.04.008)
- In chronic insomnia disorder (mostly therapist-led CBT-I): the parts that mattered most were cognitive restructuring, sleep restriction and stimulus control. Sleep-hygiene education was not essential (iOR 1.01), and relaxation procedures were "potentially counterproductive" (iOR 0.81, CI 0.64–1.02). [JAMA Psychiatry 2024](https://doi.org/10.1001/jamapsychiatry.2023.5060)
- CBT-I shortened time to fall asleep by about 19 minutes in chronic insomnia. [Ann Intern Med 2015](https://doi.org/10.7326/M14-2841)

**Strength:** `low` for the warm bath; `indirect` for the CBT-I findings. **Warning for the engine:** the app offers relaxation (NSDR, breathing) and sleep-hygiene habits for sleep. The insomnia evidence is about *chronic insomnia*, not one bad night, so it does not prove them wrong, but it does not support selling them as the fix either. Doctors should decide the wording. **Safety (doctor to confirm):** hot baths may not suit people with heart conditions, low blood pressure, or pregnancy; sleeplessness for weeks goes to "talk to a professional".
**Doctor review:** draft

## 9. Hungry, craving something sweet

**Right now:** a short pause to notice the urge before eating **(app inference on the format)**. Longer run: meals with legumes.

**Evidence**
- Meals with pulses (40 acute studies): lower glucose (28 of 40) and insulin (16 of 24) responses than other starchy foods. Hunger fell in 3 of 5 studies and not significantly in the other 2; fullness was higher in 3 of 6; satiety was higher in only 1 of 6. [Nutr Rev 2026](https://doi.org/10.1093/nutrit/nuaf190)
- Mindfulness-based interventions reduced attention to high-energy food cues; other mindfulness programmes eased hedonic hunger and craving without changing attention. Six small, mixed studies, described as preliminary. [Nutrients 2025](https://doi.org/10.3390/nu17243885)
- Eating carbohydrate after vegetables or protein lowered after-meal glucose and insulin (moderate certainty), but hunger and fullness did not differ consistently. [J Am Nutr Assoc 2022](https://doi.org/10.1080/27697061.2022.2161664)
- **Safety link:** in people with diagnosed eating disorders, craving was consistently linked to binge eating (trait craving more than state craving). The app must not treat "craving" as a failing, and the food gate (see "Weight and food") applies. [Neurosci Biobehav Rev 2025](https://doi.org/10.1016/j.neubiorev.2025.106515)

**Strength:** `low`. Fibre and protein: a search on glucomannan and resistant starch found mostly animal studies and several null human results; a search on protein and appetite returned unrelated studies. Neither is cited as support.
**Doctor review:** draft

## 10. Low energy in the afternoon

**Right now:** brighter light and a short break to move **(app inference on pairing them)**.

**Evidence**
- Daytime light: bright white light improved self-reported alertness (62 studies, healthy adults, very different set-ups). [Biol Psychol 2024](https://doi.org/10.1016/j.biopsycho.2024.108845)
- Workplace lighting (5 studies, 282 workers): cool, high-colour-temperature light may improve alertness (SMD −0.69, CI −1.28 to −0.10) but not mood; the authors rate the evidence very low and two studies were industry-sponsored. [Cochrane 2018](https://doi.org/10.1002/14651858.CD012243.pub2)
- Sitting breaks: see row 5 (they act on blood glucose, not on feeling energetic).

**Strength:** `low`. **Pending:** naps and caffeine (queries returned unrelated or no results) and exercise for fatigue in healthy adults (no usable review found).
**Doctor review:** draft

---

## Weight and food (strictest rules)

This is the most sensitive area. The app helps with **habits and feelings around food**, never with a weight number. Weight-loss claims are not made anywhere.

### Hard rules (draft, for doctor supervision)

Content rules stay. The app helps with **habits and feelings around food**, never with a weight number. Nothing below blocks the user; where a topic is sensitive, a small note appears instead.

1. **No weight, BMI, body measurements or calories**: the app never asks for them, shows them, or sets a goal on them. No "lose X kg", no before/after.
2. **No food logging with numbers, no streaks or points on eating.** Reason: a review of 38 articles found diet and fitness apps are linked to more disordered-eating symptoms and body-image concerns, more so with more frequent use, and users described pressure to meet goals and guilt. It is cross-sectional, so cause is not proven. [Body Image 2024](https://doi.org/10.1016/j.bodyim.2024.101836)
3. **No shame words.** Do not use "fat", "overweight", "obese", "cheat", "bad food", "guilt", "clean eating". Use people-first, neutral wording. Reason: a review of Canadian evidence links obesity with poorer mental health, and says the way care providers talk can add to bias and stigma. It is observational, and its authors are partly from a drug company, so treat it as a caution, not proof. [Adv Ther 2026](https://doi.org/10.1007/s12325-026-03736-8)
4. **A quiet note, not a gate.** Food topics always show a small "a professional can help too" line. If the optional eating-problem check says "risk", or the user is in a group a doctor flags (under 18, pregnancy, diabetes, kidney or heart disease, weight medicine), the note stays and the suggestion stays too. The food suggestions are only a walk and a mindful pause: no diet, fasting, supplement or "fat-burning" advice, ever. Trials of weight programmes track these areas as relevant to eating-disorder risk: dieting and weight-loss history, mental health, eating behaviours, sleep, and weight stigma. This is a consensus mapping, not a tested tool. [Eat Weight Disord 2026](https://doi.org/10.1007/s40519-026-01866-0) **A doctor writes the real check questions.**
5. **Never tie mood or self-worth to weight** in any text.
6. **"Binge" or "loss of control":** if a user ticks it, the suggestion still shows, with the gentle sentence to check with a doctor.

### Rows

**W1. "My weight is on my mind"** (entry wording is **app inference**; doctors decide the exact words)

**Right now / habits:** movement, sleep, and mindful eating, framed as feeling better, not weight. A "talk to a professional" link is always visible.

**Evidence**
- In lifestyle weight-management programmes (18 trials), daily steps rose to about 8,500 and stayed there; weight loss was 4.39% at about 8 months and 3.28% at the maintenance phase; more steps went with more weight loss. This is a link seen inside structured, supervised programmes, not proof that walking alone causes weight loss. [Int J Environ Res Public Health 2026](https://doi.org/10.3390/ijerph23040522)
- Sleep and weight loss (30 studies): evidence mixed. Restricting sleep reduced fat loss in manipulation studies; better sleep satisfaction and efficiency may support weight loss; sleep length showed inconsistent links. [Obes Rev 2026](https://doi.org/10.1111/obr.70199)
- More legumes lowered total cholesterol, LDL and fasting glucose (moderate certainty). It did not report weight. [Eur J Nutr 2024](https://doi.org/10.1007/s00394-024-03576-8)

**Strength:** `low` and `indirect`. **Doctor review:** draft

**W2. "I eat when I'm stressed or upset"**

**Right now:** a short mindfulness pause before eating **(app inference on format; the trials were multi-week digital programmes)**.

**Evidence**
- Mindfulness-based digital programmes (10 studies, 902 people) reduced emotional eating (SMD −0.23) and binge eating (SMD −0.59). BMI did not change significantly (MD −0.44, CI −1.70 to 0.82). [Front Nutr 2026](https://doi.org/10.3389/fnut.2026.1874656)

**Strength:** `low` (small studies, wide ranges). Note the win is in the behaviour, not in weight. **Safety:** binge eating can be a clinical sign: see hard rule 6.
**Doctor review:** draft

### Still unresearched for weight and food

- Whether protein or fibre keep people full (searches found cancer-care studies and mostly animal studies).
- Sugary drinks and weight (the results were about blood pressure and a secondary analysis, not usable).
- Meal timing and breakfast, portion size, ultra-processed food.
- A validated eating-problem screen for adults, and who may see food suggestions (doctor and dietitian).

---

## What this tells the decision engine

1. **Evidence is weak for most small desk-time actions.** Most reviews say low or very low certainty. The app has to speak softly ("may help") and should not rank a tiny action above a clear safety message.
2. **Movement is the most consistent winner** across neck, headache, sitting, and mood. It is the best default "right now" family.
3. **Some of the current app ideas are not supported as a fix:** sleep-hygiene education and relaxation for insomnia; sit-stand desks for pain. Doctors should review the sleep habits.
4. **Most evidence is in clinical groups** (diagnosed headache, depression, chronic insomnia). Using it for "I feel it right now" is an **extrapolation** that doctors must sign off.
5. **All 35 current habits have `evidence_level: null`.** This matrix is the first source to fill that in, for the matching habits only.
6. **Food and weight need a quiet note, not a gate.** The engine keeps suggesting (a walk, a mindful pause) and adds a small professional hint. The risk is in the wording and in tracking, not in these two actions.
7. **Tracking can harm here.** The streak, points, goals and logging that work for movement must be switched off for food habits. The current app counts food habits like any other (for example, protein and water amounts); doctors should decide which of those stay.
8. **The 35 habits are not enough for "right now".** Several actions with some support are not habits in the app: bright daytime light (only "morning light" exists), a warm shower 1–2 hours before bed, a sitting break about every 30 minutes, slow breathing for stress (the sigh is there, but not tested here), and a mindful pause before eating. "Right now" needs its own small set of actions, separate from the weekly habits.

## Not done yet

- Gaps: exercise for fatigue and attention in healthy adults, naps, caffeine for sleepiness. Several queries returned unrelated results (brain stimulation, older adults, adolescent sleep, cancer care) or nothing.
- Weight and food: a first pass is above (rules and two rows). The unresearched parts are listed there.
- Eating-disorder and mental-health check wording (a doctor writes it; it only changes the small note).
- Check each claim against the full text, not only the abstract (done here for abstracts only).
- Doctor review of every row, and the red-flag list in simple English (owner decision: the app stays in plain English for now).

## Notes on the search tool

- Long natural-language queries often return unrelated studies (for example, childhood stunting for "food craving", COPD rehab for "fatigue").
- Short, exact queries with a publication-type filter work best; each problem needs 2–3 query tries and a manual read of the abstracts.
- Always read the abstract before citing. Do not rely on the title.
