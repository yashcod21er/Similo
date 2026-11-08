import { ExampleTag } from '@/components/ui/layout';

/*
 * The "How it works" page shows one illustrative product visual: a risk score
 * broken into the reasons that make it up. All values are sample data.
 */

const SCORE_PARTS = [
  { plain: 'Uses “rn” to look like “m”', code: 'HOMOGLYPH', points: 30 },
  { plain: 'Name is very close to yours', code: 'FUZZY_NAME', points: 20 },
  { plain: 'Page asks for a password', code: 'CREDENTIAL_FORM', points: 18 },
  { plain: 'Registered less than a week ago', code: 'NEW_REGISTRATION', points: 14 },
  { plain: 'Set up to send email', code: 'MX_CONFIGURED', points: 9 },
];

const MAX_POINTS = Math.max(...SCORE_PARTS.map((part) => part.points));

/** A risk score broken into named reasons, each with its share of the total. */
export function ScoreBreakdown() {
  const total = SCORE_PARTS.reduce((sum, part) => sum + part.points, 0);
  return (
    <figure>
      <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-muted">Priority for acrne-login.com</p>
            <p className="mt-1 flex items-baseline gap-3">
              <span className="text-5xl font-semibold tracking-tight">{total}</span>
              <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[13px] font-semibold text-accent-ink">
                High
              </span>
            </p>
          </div>
          <ExampleTag tone="light" />
        </div>
        <ul className="mt-5 divide-y divide-line border-t border-line">
          {SCORE_PARTS.map((part) => (
            <li key={part.code} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[14.5px]">{part.plain}</p>
                <span className="shrink-0 font-mono text-[13px]">+{part.points}</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-deep">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(part.points / MAX_POINTS) * 100}%` }}
                  />
                </div>
                <span className="w-36 shrink-0 text-right font-mono text-[11.5px] text-muted">
                  {part.code}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="mt-3 text-[13px] text-muted">
        Illustrative example with sample values. Weights can be edited, and every reason is stored
        with the alert.
      </figcaption>
    </figure>
  );
}
