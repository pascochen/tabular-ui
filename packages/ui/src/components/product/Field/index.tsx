import { useId } from 'react';

import { cn } from '../../../lib/utils';

export type FieldProps = {
  label: string;
  /** Receives the generated id, so the control and label are wired correctly. */
  children: (props: FieldControlProps) => React.ReactNode;
  /** Guidance shown under the control. Replaced by `error` when one is present. */
  help?: React.ReactNode;
  /** Validation message. Its presence marks the control invalid. */
  error?: React.ReactNode;
  /**
   * Appends a marker to the label, and passes `required` and `aria-required`
   * to the control. The marker is `aria-hidden`; the control's own attributes
   * are what AT announces.
   */
  required?: boolean;
  className?: string;
};

/**
 * What the render prop receives. Spread it onto a native control. A custom
 * control whose root is not a form element (a `SelectTrigger` is a button)
 * takes `aria-required` and drops `required`, which is invalid there.
 */
export type FieldControlProps = {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': boolean | undefined;
  required: boolean | undefined;
  'aria-required': boolean | undefined;
};

/**
 * Field — product.
 *
 * Label, control, and help or error text, wired together. The foundational
 * controls deliberately do not render their own labels — that would put label
 * layout inside every one of them — so this is where the association lives.
 *
 * Children are a render prop rather than a plain node because the wiring is
 * the point: the control must receive the generated `id`, the
 * `aria-describedby` pointing at whichever message is showing, and
 * `aria-invalid`. Passing a bare child would leave that to the call site,
 * which is exactly where it gets forgotten.
 *
 * **Error replaces help rather than stacking.** Two messages under one control
 * is a reading order problem, and the error is always the one that matters.
 */
function Field({ label, children, help, error, required, className }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? help;

  return (
    <div data-slot="field" className={cn('flex flex-col gap-[var(--gap-bonded)]', className)}>
      <label htmlFor={id} className="text-sm font-medium text-text-secondary">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-[var(--gap-icon-label)] text-text-secondary">
            *
          </span>
        ) : null}
      </label>

      {children({
        id,
        'aria-describedby': message ? messageId : undefined,
        'aria-invalid': error ? true : undefined,
        // The asterisk above is aria-hidden, so without these a required
        // field looked required and was never announced as one.
        required: required || undefined,
        'aria-required': required || undefined,
      })}

      {message ? (
        <span id={messageId} className={cn('text-xs', error ? 'text-text-danger' : 'text-text-secondary')}>
          {message}
        </span>
      ) : null}
    </div>
  );
}

export { Field };
