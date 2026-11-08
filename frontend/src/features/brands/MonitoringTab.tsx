import { Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { FormAlert, SubmitButton } from '@/components/ui/form';
import { formatDateTime } from '@/lib/format';
import { useSaveMonitoring, type Brand, type MonitoringInput } from './api';
import { SENSITIVITY_OPTIONS } from './rules';
import { Card } from './ui/Card';
import { Switch } from './ui/Switch';

function toValues(brand: Brand): MonitoringInput {
  const { monitoring } = brand;
  return {
    domains: monitoring.domains,
    apps: monitoring.apps,
    trademarks: monitoring.trademarks,
    sensitivity: monitoring.sensitivity,
    emailAlerts: monitoring.emailAlerts,
  };
}

/** What Similo should watch for and how closely. Stored now; used when monitoring starts. */
export function MonitoringTab({ brand, canManage }: { brand: Brand; canManage: boolean }) {
  const save = useSaveMonitoring(brand.id);
  const form = useForm<MonitoringInput>({ values: toValues(brand) });
  const { register, handleSubmit, reset } = form;
  const { isDirty } = form.formState;
  const readOnly = !canManage;
  const { updatedAt } = brand.monitoring;

  return (
    <div className="grid gap-6">
      <div
        role="note"
        className="flex gap-3 rounded-2xl bg-cream px-4 py-3.5 text-[14.5px] ring-1 ring-line"
      >
        <Info aria-hidden className="mt-0.5 size-5 shrink-0 text-ink" />
        <p>
          <strong className="font-semibold">
            Saved settings are used when monitoring starts in Phase 5 — nothing is scanned yet.
          </strong>{' '}
          You can change them whenever you like.
        </p>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit((values) =>
          save.mutate(values, { onSuccess: (updated) => reset(toValues(updated)) }),
        )}
        className="grid gap-6"
      >
        <Card
          title="What to watch"
          description={
            readOnly
              ? 'Only Owners and Admins can change these settings.'
              : 'Choose where Similo should look for copies of this brand.'
          }
        >
          <div className="grid gap-3">
            <Switch
              label="Lookalike websites"
              description="Newly registered website addresses that look like this brand's name or domains."
              disabled={readOnly}
              {...register('domains')}
            />
            <Switch
              label="Copycat apps"
              description="Apps in app stores that copy this brand's name or logo."
              disabled={readOnly}
              {...register('apps')}
            />
            <Switch
              label="Trademark filings"
              description="New trademark applications that are close to the trademarks you entered."
              disabled={readOnly}
              {...register('trademarks')}
            />
          </div>
        </Card>

        <Card title="How closely should it match?">
          <fieldset disabled={readOnly}>
            <legend className="sr-only">Sensitivity</legend>
            <div className="grid gap-2">
              {SENSITIVITY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl p-3.5 ring-1 ring-line transition-colors has-[:checked]:bg-accent/[0.04] has-[:checked]:ring-accent/50 has-[:disabled]:cursor-not-allowed hover:bg-cream has-[:disabled]:hover:bg-transparent"
                >
                  <input
                    type="radio"
                    value={option.value}
                    className="mt-1 size-4 accent-[#c2500a]"
                    {...register('sensitivity')}
                  />
                  <span>
                    <span className="block text-[14.5px] font-medium">{option.label}</span>
                    <span className="block text-[13.5px] text-muted">{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </Card>

        <Card title="Alerts">
          <Switch
            label="Email me when something is found"
            description="Saved for later. Similo does not send alert emails yet."
            disabled={readOnly}
            {...register('emailAlerts')}
          />
        </Card>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {canManage && (
            <SubmitButton pending={save.isPending} pendingLabel="Saving…" variant="dark">
              Save monitoring settings
            </SubmitButton>
          )}
          <p className="text-[13.5px] text-muted">
            {updatedAt
              ? `Last saved ${formatDateTime(updatedAt)}`
              : 'Not saved yet. These are the default settings.'}
          </p>
        </div>
        {save.isSuccess && !isDirty && (
          <FormAlert tone="success">Monitoring settings saved.</FormAlert>
        )}
        {save.isError && <FormAlert>{save.error.message}</FormAlert>}
      </form>
    </div>
  );
}
