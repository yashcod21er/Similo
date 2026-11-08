import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError, validationDetails } from '@/lib/api-client';

/**
 * Puts the API's field-level validation messages (400 details) on the matching form fields.
 * Returns a message for the whole form when the problem isn't about a field we show
 * (another kind of error, or a field that isn't on this form), otherwise `null`.
 */
export function applyServerErrors<TValues extends FieldValues>(
  error: unknown,
  fields: readonly (keyof TValues & string)[],
  setError: UseFormSetError<TValues>,
): string | null {
  const details = validationDetails(error);
  if (details.length === 0) {
    // "You already have a brand with this name." belongs next to the name.
    if (
      error instanceof ApiError &&
      error.status === 409 &&
      /name/i.test(error.message) &&
      fields.includes('name' as keyof TValues & string)
    ) {
      setError('name' as Path<TValues>, { message: error.message });
      return null;
    }
    return error instanceof Error ? error.message : 'Something went wrong.';
  }
  let general: string | null = null;
  for (const detail of details) {
    const field = fields.find((name) => detail.path === name || detail.path.startsWith(`${name}.`));
    if (field) setError(field as Path<TValues>, { message: detail.message });
    else general ??= detail.message;
  }
  return general;
}
