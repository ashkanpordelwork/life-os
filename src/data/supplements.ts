// Supplement reference cards (book SL09, SL10, SL13, ST06, FM01, NU07). Info only.
// Owner rule R16: the engine never suggests these. English text; numbers copied from the book.

export interface SupplementCard {
  name: string;
  dose: string;
  when?: string;
  note: string;
  /** Extra safety line (rules R07–R09 and book warnings). */
  caution?: string;
}

export interface SupplementGroup {
  key: 'sleep' | 'stress' | 'focus' | 'omega' | 'avoid';
  cards: SupplementCard[];
}

export const SUPPLEMENTS: SupplementGroup[] = [
  {
    key: 'sleep',
    cards: [
      { name: 'Magnesium threonate or bisglycinate', dose: '145–250 mg', when: '30–60 min before bed', note: 'May deepen sleep.', caution: 'About 5% of people get an upset stomach.' },
      { name: 'Apigenin', dose: '50 mg', when: '30–60 min before bed', note: 'From chamomile. A mild calming effect.' },
      { name: 'L-Theanine', dose: '100–200 mg', when: '30–60 min before bed', note: 'Raises GABA and lowers anxiety.', caution: 'Skip it if you have nightmares, very vivid dreams or sleepwalk.' },
      { name: 'GABA', dose: '250–500 mg', note: 'A calming brain messenger.' },
      { name: 'Glycine', dose: '1–2 g', note: 'Helps lower body temperature for sleep.' },
      { name: 'Myo-inositol', dose: '900 mg', note: 'May help you fall back asleep after waking at night.' },
      { name: 'Melatonin', dose: '0.5–1.5 mg', note: 'Not recommended for most people. Store doses (3–10 mg) are far too high.', caution: 'Mainly for older adults, with a doctor.' },
    ],
  },
  {
    key: 'stress',
    cards: [
      { name: 'Ashwagandha', dose: '200–300 mg, 1–2× a day', when: 'Afternoon or evening only', note: 'Lowers cortisol.', caution: 'Never in the morning. Above 600 mg, no longer than 2–3 weeks in a row.' },
      { name: 'L-Theanine', dose: '100–200 mg, 1–3× a day', note: 'Calms the jitters from caffeine.' },
      { name: 'Phosphatidylserine', dose: '100–400 mg (max 800 mg)', when: 'After 16:00', note: 'Lowers evening cortisol.' },
      { name: 'Rhodiola rosea', dose: '100–200 mg', when: '30–60 min before a challenge', note: 'Reduces mental and physical fatigue.', caution: 'After 3–4 weeks of daily use, take 2 weeks off.' },
    ],
  },
  {
    key: 'focus',
    cards: [
      { name: 'Caffeine + L-Theanine', dose: '100–300 mg + 100–200 mg', note: 'Alert without the shakes.', caution: 'Stay under 400 mg caffeine a day and stop 8–10 h before bed.' },
      { name: 'Alpha-GPC', dose: '300–600 mg', when: '30 min before work, max 2–4× a week', note: 'Feeds the brain’s focus chemical (acetylcholine).', caution: 'Take 600 mg garlic extract the same day.' },
      { name: 'L-Tyrosine', dose: '500–1,000 mg', when: 'Only when tired or stressed, not daily', note: 'Builds dopamine.', caution: 'Some people crash a few hours later.' },
    ],
  },
  {
    key: 'omega',
    cards: [
      { name: 'Fish, krill or algae oil', dose: '1–3 g EPA a day', note: 'Your body can’t make omega-3.', caution: 'Keep liquid oil in the fridge. Krill oil gives some people hives.' },
    ],
  },
  {
    key: 'avoid',
    cards: [
      { name: 'Prescription sleep drugs', dose: 'Only with a doctor', note: 'Not a first choice. If insomnia lasts, ask a sleep doctor about CBT-I.' },
      { name: 'Cannabis (THC) for sleep', dose: 'Avoid', note: 'Like alcohol, it cuts deep dream sleep and builds dependence.' },
      { name: 'Nicotine', dose: 'Avoid', note: 'Highly addictive, raises blood pressure. Never under 18.' },
      { name: 'Stimulant medication', dose: 'Only with a doctor', note: 'For conditions like ADHD, under medical care.' },
    ],
  },
];
