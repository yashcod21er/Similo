/** `aria-describedby` value for a field: its error if there is one, else its hint. */
export function describedBy(id: string, hasError: boolean, hasHint = false): string | undefined {
  if (hasError) return `${id}-error`;
  return hasHint ? `${id}-hint` : undefined;
}
