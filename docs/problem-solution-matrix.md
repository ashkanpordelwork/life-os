# Problem → solution matrix (draft 2)

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

1. Red-flag symptoms never get a "try this" suggestion. They get "talk to a doctor now" and stop. Examples: sudden severe headache, chest pain, new numbness or weakness, pain after an injury, thoughts of harming yourself.
2. No claims about treating a disease, losing weight, or curing anxiety or depression.
3. Never diagnose. Never say a user "has" a condition.
4. Weight and mood wording: no shame words, no "should".
5. A doctor must approve the red-flag list and the wording before anything ships.

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

**Strength:** `low`. **Not verified yet:** the "physiological sigh" (double inhale, long exhale) is in the app from the Huberman source; this search found no review of it. **Safety:** panic with chest pain, or thoughts of self-harm, go to "get help now", not to breathing.
**Doctor review:** draft

## 4. Tension headache

**Right now:** gentle neck and shoulder relaxation and movement. Water if you have not drunk for hours **(app inference)**.

**Evidence** (all in people with diagnosed headache, often therapist-led)
- Strength training lowered tension-type headache pain (SMD −0.84), very low certainty; aerobic training helped migraine, very low certainty. [J Pain 2021](https://doi.org/10.1016/j.jpain.2021.12.003)
- In chronic tension-type headache, neck-shoulder strengthening and muscle relaxation reduced intensity, duration and frequency. [J Oral Facial Pain Headache 2025](https://doi.org/10.22514/jofph.2025.003)
- Myofascial release reduced tension-type headache pain (SMD −0.86); quality of evidence low to very low. [Pain Res Manag 2024](https://doi.org/10.1155/2024/2042069)

**Strength:** `low` and `indirect`. **Red flags (must show):** sudden "worst ever" headache, after a head injury, with fever and stiff neck, with weakness, speech or vision problems.
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

**Right now:** drink water if you have not had any for a long time.

**Evidence**
- Dehydration impaired cognition (effect −0.21), and attention most (−0.52), mainly when body-water loss was above about 2%. A normal desk day usually does not reach that. [Med Sci Sports Exerc 2018](https://doi.org/10.1249/MSS.0000000000001682)

**Strength:** `low` and narrow. **Pending:** short exercise or walking breaks for attention in healthy adults. Our first query returned only studies in children and in dementia, so none are cited.
**Doctor review:** draft

## 7. Low mood, no motivation

**Right now:** a walk or other movement. For the longer run: regular exercise.

**Evidence** (adults with depression or depressive symptoms; not "I feel flat today")
- 73 trials: exercise lowered depressive symptoms vs control (SMD −0.67, low certainty); no clear difference from psychological therapy (moderate certainty) or from medication (low certainty). [Cochrane 2026](https://doi.org/10.1002/14651858.CD004366.pub7)
- 41 trials: large effect (SMD −0.95), moderate (−0.67) when only low-risk-of-bias studies were kept. Authors point to supervised, moderate-intensity, aerobic exercise. [Br J Sports Med 2023](https://doi.org/10.1136/bjsports-2022-106282)

**Strength:** `moderate` for ongoing exercise and depressive symptoms; `indirect` for "right now". **Pending:** the acute effect of one short walk on mood. **Safety (hard rule):** low mood for more than about two weeks, hopelessness, or any thought of self-harm → "talk to a professional now". The app does not treat depression.
**Doctor review:** draft

## 8. Can't fall asleep tonight

**Right now:** not established. See the warning below.

**Evidence** (chronic insomnia disorder, mostly therapist-led CBT-I)
- The parts that mattered most: cognitive restructuring, sleep restriction, stimulus control. Sleep-hygiene education was not essential (iOR 1.01), and relaxation procedures were "potentially counterproductive" (iOR 0.81, CI 0.64–1.02). [JAMA Psychiatry 2024](https://doi.org/10.1001/jamapsychiatry.2023.5060)
- CBT-I shortened time to fall asleep by about 19 minutes in chronic insomnia. [Ann Intern Med 2015](https://doi.org/10.7326/M14-2841)

**Strength:** `indirect`. **Warning for the engine:** the app currently offers relaxation (NSDR, breathing) and sleep-hygiene habits for sleep. This evidence is about *chronic insomnia*, not one bad night, so it does not prove they are wrong, but it does not support selling them as the fix either. Doctors should decide the wording. **Pending:** evidence for one sleepless night; warm bath or shower before bed (our query returned nothing usable).
**Doctor review:** draft

## 9. Hungry, craving something sweet

**Status: `pending`.** Our search found no review of cravings.
Only indirect result: eating carbohydrate after vegetables or protein lowered after-meal glucose and insulin (moderate certainty), but hunger and fullness did not differ consistently (very low certainty). [J Am Nutr Assoc 2022](https://doi.org/10.1080/27697061.2022.2161664) This is about blood sugar, not cravings.

## 10. Low energy in the afternoon

**Status: `pending`.** Two searches returned nothing usable for short-term fatigue or sleepiness in healthy adults (one returned unrelated studies).

---

## Weight and food (strictest rules)

This is the most sensitive area. The app helps with **habits and feelings around food**, never with a weight number. Weight-loss claims are not made anywhere.

### Hard rules (draft, for doctor approval)

1. **No weight, BMI, body measurements or calories**: the app never asks for them, shows them, or sets a goal on them. No "lose X kg", no before/after.
2. **No food logging with numbers, no streaks or points on eating.** Reason: a review of 38 articles found diet and fitness apps are linked to more disordered-eating symptoms and body-image concerns, more so with more frequent use, and users described pressure to meet goals and guilt. It is cross-sectional, so cause is not proven. [Body Image 2024](https://doi.org/10.1016/j.bodyim.2024.101836)
3. **No shame words.** Do not use "fat", "overweight", "obese", "cheat", "bad food", "guilt", "clean eating". Use people-first, neutral wording. Reason: a review of Canadian evidence links obesity with poorer mental health, and says the way care providers talk can add to bias and stigma. It is observational, and its authors are partly from a drug company, so treat it as a caution, not proof. [Adv Ther 2026](https://doi.org/10.1007/s12325-026-03736-8)
4. **Screen first, then show food suggestions.** Before any food-related suggestion, the app asks in a kind way about past or present eating problems and past dieting. If the answer is yes or unsure, the user sees only "talk to a professional" plus habits that don't involve food or weight (sleep, movement for mood). Trials of weight programmes track exactly these areas as relevant to eating-disorder risk: dieting and weight-loss history, mental health, eating behaviours, sleep, and weight stigma. This is a consensus mapping, not a tested screening tool. [Eat Weight Disord 2026](https://doi.org/10.1007/s40519-026-01866-0) **A doctor must pick the real screening questions.**
5. **Do not show food-change suggestions at all** (doctor to confirm the list) to: under 18, pregnant or breastfeeding, with diabetes or on blood-sugar medicine, with kidney or heart disease, or on weight-loss medicine. They get "ask your doctor or dietitian".
6. **No fasting, diets, detoxes, supplements or "fat-burning" tips** in the "right now" mode.
7. **Never tie mood or self-worth to weight** in any text.
8. **"Binge" or "loss of control" is a stop sign:** if a user says they have episodes of eating a lot and can't stop, show "talk to a professional" first.

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

**Strength:** `low` (small studies, wide ranges). Note the win is in the behaviour, not in weight. **Safety:** binge eating can be a clinical sign: see hard rule 8.
**Doctor review:** draft

### Still unresearched for weight and food

- Whether protein or fibre keep people full (the search for protein and satiety returned unrelated studies).
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
6. **Food and weight need a gate, not a score.** The engine should not suggest food habits until the eating-problem screen is passed, and should hide them for the excluded groups. This is a safety filter that runs before scoring.
7. **Tracking can harm here.** The streak, points, goals and logging that work for movement must be switched off for food habits. The current app counts food habits like any other (for example, protein and water amounts); doctors should decide which of those stay.

## Not done yet

- Problems 9 and 10, plus the focus and sleep-onset gaps above.
- Weight and food: a first pass is above (rules and two rows). The unresearched parts are listed there.
- Eating-disorder and mental-health screening wording (a doctor must write it).
- Check each claim against the full text, not only the abstract (done here for abstracts only).
- Doctor review of every row, and the red-flag list in Persian and English.

## Notes on the search tool

- Long natural-language queries often return unrelated studies (for example, childhood stunting for "food craving", COPD rehab for "fatigue").
- Short, exact queries with a publication-type filter work best; each problem needs 2–3 query tries and a manual read of the abstracts.
- Always read the abstract before citing. Do not rely on the title.
