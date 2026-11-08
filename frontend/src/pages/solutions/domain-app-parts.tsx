import { AlertCard, type AlertKind, type AlertLevel } from '@/components/visuals/AlertCard';
import { ProductFigure } from './page-kit';

/* Building blocks shared by the Domain, App and Trademark pages. */

/**
 * The one illustrative product visual on a page: a finding as the team sees it,
 * with a caption that says it is an example with made-up names.
 */
export function FindingExample({
  kind,
  name,
  facts,
  level,
  caption,
}: {
  kind: AlertKind;
  name: string;
  facts: string[];
  level: AlertLevel;
  caption: string;
}) {
  return (
    <ProductFigure caption={caption}>
      <AlertCard kind={kind} name={name} facts={facts} level={level} />
    </ProductFigure>
  );
}
