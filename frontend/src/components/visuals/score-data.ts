/*
 * The sample numbers behind "how we score". Four named signals, each 0 to 100, are weighted
 * and added to give a priority. Every number is a sample value, and the weights are a sample
 * workspace's: a team can change them. The priority only decides what is looked at first.
 */

export interface ScoreSignal {
  id: string;
  label: string;
  value: number;
  /** Share of the priority, in percent. The four weights add up to 100. */
  weight: number;
  plain: string;
}

export const SCORE_SIGNALS: ScoreSignal[] = [
  {
    id: 'text',
    label: 'Text similarity',
    value: 94,
    weight: 35,
    plain: '“rn” reads as “m”, and “login” is added',
  },
  {
    id: 'visual',
    label: 'Visual similarity',
    value: 88,
    weight: 25,
    plain: 'The sign-in page layout and logo match yours',
  },
  {
    id: 'meaning',
    label: 'Meaning similarity',
    value: 61,
    weight: 15,
    plain: '“login” suggests an account page',
  },
  {
    id: 'context',
    label: 'Registration context',
    value: 74,
    weight: 25,
    plain: 'Registered 2 days ago, email switched on, owner hidden',
  },
];

export const contribution = (signal: ScoreSignal) =>
  Math.round((signal.value * signal.weight) / 100);

export const PRIORITY = SCORE_SIGNALS.reduce((sum, signal) => sum + contribution(signal), 0);
