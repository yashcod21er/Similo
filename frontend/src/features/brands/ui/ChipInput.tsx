import { X } from 'lucide-react';
import { useId, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';

type Parsed = { value: string } | { error: string };

/** Small pills, read-only. */
export function ChipList({
  items,
  label,
}: {
  items: readonly string[];
  label: (item: string) => string;
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full bg-cream px-3 py-1 text-[13.5px] text-ink ring-1 ring-line"
        >
          {label(item)}
        </li>
      ))}
    </ul>
  );
}

/**
 * A text box that turns what you type into removable chips. Press Enter or type a comma to add
 * one; Backspace on an empty box removes the last chip. Whatever is typed when you leave the box
 * is added too, so nothing is lost on Save. Pasting "a, b, c" adds three chips.
 */
export function ChipInput({
  id,
  items,
  onChange,
  parse,
  noun,
  placeholder,
  splitter = /,/,
  invalid,
  describedBy,
}: {
  id: string;
  items: readonly string[];
  onChange: (items: string[]) => void;
  /** Cleans and checks one chip. */
  parse: (raw: string, existing: readonly string[]) => Parsed;
  /** For screen readers: "keyword" gives "Remove keyword Acme". */
  noun: string;
  placeholder?: string;
  /** Characters that end a chip while typing or pasting (a plain regex, without the g flag). */
  splitter?: RegExp;
  invalid?: boolean;
  describedBy?: string | undefined;
}) {
  const problemId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  /** Adds every valid piece of `text`; the first invalid piece (and what follows) stays typed. */
  function commit(text: string) {
    const pieces = text.split(splitter);
    const next = [...items];
    let leftover = '';
    for (const [index, piece] of pieces.entries()) {
      if (!piece.trim()) continue;
      const parsed = parse(piece, next);
      if ('error' in parsed) {
        setProblem(parsed.error);
        leftover = pieces.slice(index).join(', ').trim();
        break;
      }
      next.push(parsed.value);
    }
    if (!leftover) setProblem(null);
    if (next.length !== items.length) onChange(next);
    setDraft(leftover);
  }

  function onInput(event: ChangeEvent<HTMLInputElement>) {
    const text = event.target.value;
    if (splitter.test(text)) commit(text);
    else setDraft(text);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      // Enter adds the chip. It must not also submit the surrounding form.
      event.preventDefault();
      if (draft.trim()) commit(draft);
    } else if (event.key === 'Backspace' && draft === '' && items.length > 0) {
      onChange(items.slice(0, -1));
    }
  }

  return (
    <div className="mt-2">
      {/* The wrapper only forwards a click to the real input; the input is the control. */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'flex flex-wrap gap-2 rounded-xl border bg-white p-2 shadow-[inset_0_1px_2px_rgb(11_16_32/0.04)] transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15',
          invalid
            ? 'border-accent ring-4 ring-accent/10'
            : 'border-line-strong hover:border-ink/30',
        )}
      >
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex max-w-full items-center gap-1 rounded-full bg-cream py-1 pr-1 pl-3 text-[13.5px] text-ink ring-1 ring-line"
          >
            <span className="min-w-0 break-words">{item}</span>
            <button
              type="button"
              aria-label={`Remove ${noun} ${item}`}
              onClick={() => onChange(items.filter((other) => other !== item))}
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted hover:bg-ink/[0.08] hover:text-ink"
            >
              <X aria-hidden className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          value={draft}
          onChange={onInput}
          onKeyDown={onKeyDown}
          onBlur={() => draft.trim() && commit(draft)}
          placeholder={items.length === 0 ? placeholder : undefined}
          autoComplete="off"
          aria-invalid={invalid || problem ? true : undefined}
          aria-describedby={cn(problem && problemId, describedBy) || undefined}
          className="min-w-32 flex-1 bg-transparent px-2 py-1.5 text-[15px] outline-none placeholder:text-muted/70"
        />
      </div>
      {problem && (
        <p id={problemId} role="alert" className="mt-2 text-[13.5px] text-accent-ink">
          {problem}
        </p>
      )}
    </div>
  );
}
