import { ArrowUpIcon, PaperclipIcon, StopIcon, XIcon } from '@phosphor-icons/react';
import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ChangeEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';

import { cn } from '../../../lib/utils';
import { IconButton } from '../../foundational/IconButton';
import { Textarea } from '../../foundational/Textarea';
import { AttachmentRow } from '../AttachmentRow';
import type { RunStatus } from '../StatusBadge/statuses';

/** A file attached to the draft, shown in the box above the message. */
export type ChatAttachment = {
  /** Stable: removal and React keys use it. */
  id: string;
  name: string;
  /** Pre-formatted, e.g. "2.4 MB". */
  size?: string;
  /**
   * Upload state, §5's vocabulary as on `AttachmentRow`. While any file is
   * `queued` or `running`, or has `failed`, nothing sends: a message must not
   * go out referring to a file the agent doesn't have.
   */
  status?: RunStatus;
  /** 0–100 while uploading. */
  progress?: number;
};

/** What the agent reads today (owner, 2026-10-15). */
const defaultAccept = '.md,.csv,.xlsx,.xls,.txt';
const blocking: RunStatus[] = ['queued', 'running', 'failed'];

/** What a `ref` on ChatComposer reaches. */
export type ChatComposerHandle = {
  /**
   * Replaces the draft with `text` and puts the caret at its end, ready to
   * edit. For a suggestion the user picked (`ChatStarter`): it fills the box,
   * it never sends.
   */
  fill: (text: string) => void;
  focus: () => void;
};

export type ChatComposerProps = {
  /**
   * Called with the trimmed message when the user sends. The field then
   * clears. With `attachments`, the text may be empty: the files are the
   * message. The caller owns the attachments, so it clears them here too.
   */
  onSend: (text: string) => void;
  /**
   * A turn is streaming. The user can keep typing, but cannot send until it
   * ends. The Send slot shows Stop; pass `onStop` so it works.
   */
  busy?: boolean;
  /** Stops the streaming turn. Without it, the slot shows a disabled Send while `busy`. */
  onStop?: () => void;
  /** The whole composer is unavailable: no typing, no sending. */
  disabled?: boolean;
  /** Controlled text. Pair with `onValueChange`; omit both to let the composer hold it. */
  value?: string;
  onValueChange?: (value: string) => void;
  /**
   * Leading controls in the bottom row, left of Send: attach, a context
   * picker. `IconButton`s, ghost, default size.
   */
  actions?: ReactNode;
  /**
   * Shows the attach button, first in the bottom row, and is called with the
   * files the user picked. Add them to `attachments`. The browser's picker
   * only suggests `accept`; check each file's type here too.
   */
  onAttach?: (files: File[]) => void;
  /** The file types the picker offers. Default: what the agent reads, `.md,.csv,.xlsx,.xls,.txt`. */
  accept?: string;
  /** Files attached to the draft, listed in the box above the message. */
  attachments?: ChatAttachment[];
  /** Called with a file's `id` when the user removes it. */
  onRemoveAttachment?: (id: string) => void;
  /** The field's accessible name. "Message". */
  label?: string;
  placeholder?: string;
  /** Lines the field grows to before it scrolls. Default 6. */
  maxRows?: number;
  className?: string;
  ref?: Ref<ChatComposerHandle>;
};

/**
 * ChatComposer — product. The message box in the chat panel's footer.
 *
 * One bordered box, two rows: the message on top, and a row of actions along
 * the bottom with Send at the right. Send never moves; the box grows upward
 * from it as the text does, to `maxRows`, then the text scrolls.
 *
 * Enter sends and Shift+Enter starts a new line. Enter during IME composition
 * confirms the composition, never sends.
 */
function ChatComposer({
  onSend,
  busy = false,
  onStop,
  disabled = false,
  value: valueProp,
  onValueChange,
  actions,
  onAttach,
  accept = defaultAccept,
  attachments = [],
  onRemoveAttachment,
  label = 'Message',
  placeholder = 'Ask about models, runs or figures',
  maxRows = 6,
  className,
  ref,
}: ChatComposerProps) {
  const field = useRef<HTMLTextAreaElement>(null);
  const filePicker = useRef<HTMLInputElement>(null);
  // Set by fill(): once the filled text has rendered, focus the field with
  // the caret at the end. A controlled caller's value arrives a render later.
  const caretToEnd = useRef(false);
  const [ownValue, setOwnValue] = useState('');
  const value = valueProp ?? ownValue;
  const setValue = (next: string) => {
    if (valueProp === undefined) setOwnValue(next);
    onValueChange?.(next);
  };

  useLayoutEffect(() => {
    const el = field.current;
    if (!caretToEnd.current || !el) return;
    caretToEnd.current = false;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    // A long suggestion can fill past maxRows; show the end, where the caret is.
    el.scrollTop = el.scrollHeight;
  }, [value]);

  useImperativeHandle(ref, () => ({
    fill: (next) => {
      caretToEnd.current = true;
      if (next === value) {
        // Nothing will re-render, so place the caret now.
        caretToEnd.current = false;
        field.current?.focus();
        field.current?.setSelectionRange(next.length, next.length);
        return;
      }
      setValue(next);
    },
    focus: () => field.current?.focus(),
  }));

  const text = value.trim();
  const filesReady = attachments.every((file) => !file.status || !blocking.includes(file.status));
  const canSend = (text !== '' || attachments.length > 0) && filesReady && !busy && !disabled;

  const send = () => {
    if (!canSend) return;
    onSend(text);
    setValue('');
    // Send disables itself once the field is empty, and a focused button that
    // becomes disabled drops focus to the page. Keep the user in the field.
    field.current?.focus();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Safari fires the Enter that confirms an IME composition after
    // compositionend, with isComposing already false; only its keyCode, 229
    // ("IME is processing"), says so. Without the second check, Japanese,
    // Chinese and Korean typists sent half-written messages.
    if (event.key !== 'Enter' || event.shiftKey) return;
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
    event.preventDefault();
    send();
  };

  // The whole box is the place to type: a press on its padding or on the empty
  // stretch of the bottom row puts the caret in the field. Presses on the
  // field itself and on the buttons keep their own behaviour.
  const focusField = (event: MouseEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget || disabled) return;
    event.preventDefault();
    field.current?.focus();
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Cleared, so picking the same file again (after removing it) still fires.
    event.target.value = '';
    if (files.length > 0) onAttach?.(files);
    field.current?.focus();
  };

  const stopping = busy && onStop !== undefined;

  return (
    <form
      data-slot="chat-composer"
      className={cn(
        'flex cursor-text flex-col gap-[var(--gap-field)]',
        // The box. Borders do the work, as on Input (§0 rule 7); --radius-lg,
        // the container tier (square since 2026-10-16, §7.7).
        'rounded-lg border border-border bg-transparent p-[var(--pad-card)] transition-colors',
        // The field draws no ring of its own (Textarea `borderless`), so the box
        // draws it. Outline, never box-shadow (§4); outline-solid, or the
        // width and colour resolve against outline-style: none.
        'has-[textarea:focus-visible]:outline-solid has-[textarea:focus-visible]:outline-ring',
        'has-[textarea:focus-visible]:outline-[length:var(--ring-width)]',
        'has-[textarea:focus-visible]:outline-offset-[length:var(--ring-offset)]',
        // Disabled recedes as a whole, as controlBase does for a single control.
        // Once: the buttons inside are disabled too, and their own controlBase
        // fade on top of this one took them to 25%. The Textarea cancels its
        // own the same way (disabled:opacity-100).
        disabled && 'cursor-not-allowed opacity-50 [&_button:disabled]:opacity-100',
        className,
      )}
      onSubmit={handleSubmit}
      onMouseDown={focusField}
    >
      {attachments.length > 0 ? (
        // -mx: the rows' own --pad-cell-x inset lands each file glyph on the
        // message's left edge, and their hover fill reaches into the box's
        // padding rather than stopping short of it.
        <ul role="list" aria-label="Attached files" className="-mx-[var(--pad-cell-x)] flex flex-col">
          {attachments.map((file) => (
            <li key={file.id}>
              <AttachmentRow
                name={file.name}
                size={file.size}
                status={file.status}
                progress={file.progress}
                actions={
                  onRemoveAttachment ? (
                    <IconButton
                      aria-label={`Remove ${file.name}`}
                      size="sm"
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        onRemoveAttachment(file.id);
                        field.current?.focus();
                      }}
                    >
                      <XIcon />
                    </IconButton>
                  ) : null
                }
              />
            </li>
          ))}
        </ul>
      ) : null}
      <Textarea
        ref={field}
        variant="borderless"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        minRows={1}
        maxRows={maxRows}
      />
      <div className="flex items-center gap-[var(--gap-inline)]" onMouseDown={focusField}>
        {onAttach ? (
          <>
            <IconButton
              aria-label="Attach file"
              type="button"
              disabled={disabled}
              onClick={() => filePicker.current?.click()}
            >
              <PaperclipIcon />
            </IconButton>
            {/* The browser's picker does the work; the IconButton is the only
                control. aria-hidden + tabIndex -1 together: Chrome exposes a
                bare file input as its own "Choose File" button, so without
                them a screen reader hears two controls and Tab stops on an
                invisible one (failure log, AttachmentRow's UploadTarget). */}
            <input
              ref={filePicker}
              type="file"
              multiple
              accept={accept}
              className="sr-only"
              aria-hidden="true"
              tabIndex={-1}
              onChange={handleFiles}
            />
          </>
        ) : null}
        {actions}
        {stopping ? (
          <IconButton
            aria-label="Stop"
            variant="outline"
            type="button"
            className="ml-auto"
            // Stop unmounts once the turn ends; don't leave focus on nothing.
            onClick={() => {
              onStop?.();
              field.current?.focus();
            }}
            disabled={disabled}
          >
            <StopIcon />
          </IconButton>
        ) : (
          <IconButton aria-label="Send" variant="default" type="submit" className="ml-auto" disabled={!canSend}>
            <ArrowUpIcon />
          </IconButton>
        )}
      </div>
    </form>
  );
}

export { ChatComposer };
