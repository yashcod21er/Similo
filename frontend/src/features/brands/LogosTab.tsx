import { ImageOff, UploadCloud } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/form';
import { validationDetails } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { useRemoveLogo, useUploadLogo, type Brand, type Logo } from './api';
import { checkLogoFile, formatBytes, LOGO_LIMIT_ERROR, LOGO_MAX_BYTES, MAX_LOGOS } from './rules';
import { Card, EmptyNote } from './ui/Card';
import { ConfirmDialog } from './ui/ConfirmDialog';

const TYPE_LABELS: Record<Logo['contentType'], string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/webp': 'WebP',
};

interface Problem {
  fileName: string;
  message: string;
}

function LogoPicture({ logo }: { logo: Logo }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-line">
      {broken ? (
        <span className="flex flex-col items-center gap-1 px-3 text-center text-[12.5px] text-muted">
          <ImageOff aria-hidden className="size-5" />
          Preview unavailable
        </span>
      ) : (
        <img
          src={logo.url}
          alt={`Logo file ${logo.fileName}`}
          loading="lazy"
          onError={() => setBroken(true)}
          className="size-full object-contain p-3"
        />
      )}
    </div>
  );
}

/** Upload (choose or drag and drop) and manage up to five logos. */
export function LogosTab({ brand, canManage }: { brand: Brand; canManage: boolean }) {
  const upload = useUploadLogo(brand.id);
  const remove = useRemoveLogo(brand.id);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [removing, setRemoving] = useState<Logo | null>(null);
  const full = brand.logos.length >= MAX_LOGOS;

  /** One file at a time. Our check is quick; the API checks the real file contents again. */
  async function addFiles(files: File[]) {
    const found: Problem[] = [];
    let uploaded = 0;
    let free = MAX_LOGOS - brand.logos.length;
    for (const file of files) {
      if (free <= 0) {
        found.push({ fileName: file.name, message: LOGO_LIMIT_ERROR });
        continue;
      }
      const message = checkLogoFile(file);
      if (message) {
        found.push({ fileName: file.name, message });
        continue;
      }
      try {
        await upload.mutateAsync(file);
        uploaded += 1;
        free -= 1;
      } catch (error) {
        found.push({
          fileName: file.name,
          message:
            validationDetails(error)[0]?.message ??
            (error instanceof Error ? error.message : 'Upload failed.'),
        });
      }
    }
    setProblems(found);
    setUploadedCount(uploaded);
  }

  function onChoose(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = ''; // so choosing the same file again still counts
    if (files.length > 0) void addFiles(files);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (!canManage || full || upload.isPending) return;
    const files = [...event.dataTransfer.files];
    if (files.length > 0) void addFiles(files);
  }

  return (
    <div className="grid gap-6">
      {canManage && (
        <Card
          title="Upload a logo"
          description="Similo will compare your logo with images used by other websites and apps. Image comparison starts in a later phase."
        >
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'flex flex-col items-center rounded-3xl border-2 border-dashed px-5 py-8 text-center transition-colors',
              dragging ? 'border-crimson bg-crimson/[0.04]' : 'border-line-strong bg-paper',
            )}
          >
            <UploadCloud aria-hidden className="size-8 text-muted" />
            <p className="mt-3 text-[15px] font-medium">
              {full ? 'This brand has all 5 logos' : 'Drag a logo file here, or'}
            </p>
            <input
              ref={inputRef}
              type="file"
              hidden
              multiple
              accept="image/png,image/jpeg,image/webp"
              aria-label="Choose logo files"
              onChange={onChoose}
            />
            <Button
              variant="dark"
              className="mt-3"
              disabled={upload.isPending || full}
              onClick={() => inputRef.current?.click()}
            >
              {upload.isPending ? 'Uploading…' : 'Choose file'}
            </Button>
            <p className="mt-4 max-w-md text-[13.5px] text-muted">
              PNG, JPEG or WebP, up to {formatBytes(LOGO_MAX_BYTES)} each, and up to {MAX_LOGOS}{' '}
              logos per brand. SVG files are not accepted, because they can contain code.
            </p>
          </div>

          <div aria-live="polite" className="mt-4 space-y-3">
            {uploadedCount > 0 && (
              <FormAlert tone="success">
                {uploadedCount === 1 ? 'Logo uploaded.' : `${uploadedCount} logos uploaded.`}
              </FormAlert>
            )}
            {problems.length > 0 && (
              <FormAlert>
                <ul className="space-y-1">
                  {problems.map((problem, index) => (
                    <li key={`${problem.fileName}-${index}`}>
                      <strong className="font-medium break-all">{problem.fileName}</strong>
                      {': '}
                      <span>{problem.message}</span>
                    </li>
                  ))}
                </ul>
              </FormAlert>
            )}
          </div>
        </Card>
      )}

      <Card
        title={`Logos (${brand.logos.length} of ${MAX_LOGOS})`}
        description={
          canManage
            ? 'The first logo is also shown on the brand card.'
            : 'Only Owners and Admins can add or remove logos.'
        }
      >
        {remove.isError && removing === null && (
          <FormAlert className="mb-4">{remove.error.message}</FormAlert>
        )}
        {brand.logos.length === 0 ? (
          <EmptyNote>No logos yet.{canManage ? ' Upload one above.' : ''}</EmptyNote>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brand.logos.map((logo) => (
              <li key={logo.id} className="flex flex-col rounded-3xl p-3 ring-1 ring-line">
                <LogoPicture logo={logo} />
                <div className="mt-3 min-w-0 px-1">
                  <p className="truncate text-[14px] font-medium" title={logo.fileName}>
                    {logo.fileName}
                  </p>
                  <p className="text-[12.5px] text-muted">
                    {TYPE_LABELS[logo.contentType]} · {formatBytes(logo.size)} · Added{' '}
                    {formatDate(logo.uploadedAt)}
                  </p>
                </div>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 self-start"
                    aria-label={`Remove logo ${logo.fileName}`}
                    onClick={() => setRemoving(logo)}
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={removing !== null}
        title="Remove this logo?"
        description={`${removing?.fileName ?? 'The logo'} will be deleted from this brand. You can upload it again later.`}
        confirmLabel="Remove logo"
        pendingLabel="Removing…"
        pending={remove.isPending}
        error={remove.isError ? remove.error.message : null}
        onClose={() => {
          setRemoving(null);
          remove.reset();
        }}
        onConfirm={() => {
          if (!removing) return;
          remove.mutate(removing.id, { onSuccess: () => setRemoving(null) });
        }}
      />
    </div>
  );
}
