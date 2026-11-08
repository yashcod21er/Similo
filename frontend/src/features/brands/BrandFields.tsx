import { Controller, type UseFormReturn } from 'react-hook-form';
import { Field, inputClass } from '@/components/ui/form';
import { describedBy } from '@/components/ui/form-helpers';
import type { BrandFormValues } from './schema';
import { parseKeyword } from './rules';
import { ChipInput } from './ui/ChipInput';

/** Name, description and keywords: the same three fields when adding a brand and when editing it. */
export function BrandFields({
  form,
  idBase,
}: {
  form: UseFormReturn<BrandFormValues>;
  idBase: string;
}) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const nameId = `${idBase}-name`;
  const descriptionId = `${idBase}-description`;
  const keywordsId = `${idBase}-keywords`;

  return (
    <>
      <Field
        label="Brand name"
        htmlFor={nameId}
        error={errors.name?.message}
        hint="The name your customers know, for example “Acme”."
      >
        <input
          id={nameId}
          autoComplete="off"
          className={inputClass}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy(nameId, Boolean(errors.name), true)}
          {...register('name')}
        />
      </Field>

      <Field
        label="Description (optional)"
        htmlFor={descriptionId}
        error={errors.description?.message}
        hint="A sentence for your team about what this brand is. Up to 500 characters."
      >
        <textarea
          id={descriptionId}
          rows={3}
          className={inputClass}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={describedBy(descriptionId, Boolean(errors.description), true)}
          {...register('description')}
        />
      </Field>

      <Field
        label="Keywords and other spellings (optional)"
        htmlFor={keywordsId}
        error={errors.keywords?.message}
        hint="Product names, nicknames or common misspellings to watch for. Press Enter or type a comma after each one."
      >
        <Controller
          control={control}
          name="keywords"
          render={({ field }) => (
            <ChipInput
              id={keywordsId}
              items={field.value}
              onChange={field.onChange}
              parse={parseKeyword}
              noun="keyword"
              placeholder="Type a keyword, then press Enter"
              invalid={Boolean(errors.keywords)}
              describedBy={describedBy(keywordsId, Boolean(errors.keywords), true)}
            />
          )}
        />
      </Field>
    </>
  );
}
