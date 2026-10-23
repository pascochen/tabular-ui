import { useRef, useState } from 'react';
import { PlusIcon, TrashIcon, UploadSimpleIcon, WarningIcon } from '@phosphor-icons/react';
import { AttachmentRow, Button, EmptyState, IconButton, cn } from 'tabular-ui';

import { ACCEPTED_EXTENSIONS, formatBytes, type JourneyFile, type RejectedFile } from '../lib/files';
import { kasanePack } from '../lib/kasane';

export type UploadScreenProps = {
  files: JourneyFile[];
  rejected: RejectedFile[];
  onAddFiles: (incoming: File[]) => void;
  /** Loads the Kasane demo pack, the files a visitor without their own material starts from. */
  onUseKasaneFiles: () => void;
  /** True while the pack is being fetched. */
  kasaneLoading?: boolean;
  onRemove: (id: string) => void;
  onStart: () => void;
};

/**
 * Steps 1–2: the dropzone, then the selected-file list in the same frame.
 *
 * The dropzone is the `AttachmentRow` UploadTarget composition: `EmptyState`
 * inside a dashed `--color-border` frame, the native input hidden from AT and
 * the tab order, a real `Button` as the only control. §7.8's border grammar
 * decides the frame: dashed while it is a placeholder awaiting content, solid
 * once files land. Drag-over takes the interactive tint — the user's focus,
 * which is one of the three things §0 rule 1 lets a hue mean.
 */
export function UploadScreen({
  files,
  rejected,
  onAddFiles,
  onUseKasaneFiles,
  kasaneLoading = false,
  onRemove,
  onStart,
}: UploadScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const hasFiles = files.length > 0;
  const totalBytes = files.reduce((sum, f) => sum + f.bytes, 0);
  const needsReview = files.filter((f) => f.status === 'needs-review').length;

  const browse = () => inputRef.current?.click();

  return (
    <section className="flex flex-col gap-[var(--gap-group)]">
      <header className="flex flex-col gap-[var(--gap-bonded)]">
        <h1 className="text-lg font-semibold text-text-primary">Upload your documents</h1>
        <p className="text-sm text-text-secondary">
          Reads transcripts, documents, spreadsheets and images, then builds the first model from what they contain.
        </p>
      </header>

      {/* Chrome exposes a visible file input as a second control named
          "Choose file" unless it is hidden from the tree AND the tab order. */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_EXTENSIONS.join(',')}
        aria-hidden="true"
        tabIndex={-1}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onAddFiles(Array.from(e.target.files));
          e.target.value = '';
        }}
      />

      <div
        data-dragging={dragging || undefined}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) onAddFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          'flex flex-col rounded-md border transition-colors',
          // §7.8 — dashed means a placeholder awaiting content; solid means
          // content. The border flips the moment files land.
          hasFiles ? 'border-solid border-border' : 'border-dashed border-border',
          // Reached through `cn`, so the drag-over border-style and colour
          // genuinely replace the resting ones. Joined as plain strings they
          // both survived into the class list and the winner was decided by
          // stylesheet order.
          dragging && 'border-solid border-border-interactive bg-bg-interactive',
        )}
      >
        {hasFiles ? (
          <>
            <div className="flex h-[var(--h-row-sm)] shrink-0 items-center gap-[var(--gap-inline)] border-b border-border px-[var(--pad-cell-x)]">
              <span className="text-sm tabular-nums text-text-secondary">
                {files.length} {files.length === 1 ? 'file' : 'files'} · {formatBytes(totalBytes)}
              </span>
              <span className="flex-1" />
              <Button size="sm" variant="ghost" onClick={browse}>
                <PlusIcon aria-hidden="true" />
                Add files
              </Button>
            </div>
            {/* py-1 is ring clearance, not rhythm: a focused 24px IconButton in
                a 28px row paints its ring 1px past the row, and the scroll
                container would clip it at the first and last rows (§4). */}
            <ul className="max-h-[336px] overflow-y-auto py-1">
              {files.map((item) => (
                <li key={item.id}>
                  <AttachmentRow
                    name={item.name}
                    size={formatBytes(item.bytes)}
                    status={item.status}
                    actions={
                      <IconButton aria-label={`Remove ${item.name}`} size="sm" onClick={() => onRemove(item.id)}>
                        <TrashIcon />
                      </IconButton>
                    }
                  />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyState
            icon={UploadSimpleIcon}
            title="Drop files here"
            description={`Transcripts (.txt), documents (.md), spreadsheets (.csv) and images (.jpg, .png). Up to 5 MB per file. No files of your own? Kasane’s finance team handed over ${kasanePack.length}.`}
            className="min-h-[220px] justify-center"
            action={
              <>
                {/* Outline, like Browse files: the screen's one ink button is
                    Start modeling. Loading the demo files is an equal way in,
                    not a second primary action. */}
                <Button variant="outline" onClick={onUseKasaneFiles} disabled={kasaneLoading}>
                  {kasaneLoading ? 'Loading Kasane’s files…' : 'Use Kasane’s files'}
                </Button>
                <Button variant="outline" onClick={browse}>
                  Browse files
                </Button>
              </>
            }
          />
        )}
      </div>

      {rejected.length > 0 ? (
        <ul role="status" className="flex flex-col gap-[var(--gap-bonded)]">
          {rejected.map((r) => (
            <li key={r.name} className="flex items-center gap-[var(--gap-control-icon)] text-xs text-text-danger">
              <WarningIcon weight="bold" aria-hidden="true" className="size-[var(--size-icon-xs)] shrink-0" />
              <span className="min-w-0 truncate font-mono">{r.name}</span>
              <span className="shrink-0">— {r.reason}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <footer className="flex items-center gap-[var(--gap-inline)]">
        {needsReview > 0 ? (
          <span className="flex items-center gap-[var(--gap-control-icon)] text-xs text-text-warning">
            <WarningIcon weight="bold" aria-hidden="true" className="size-[var(--size-icon-xs)] shrink-0" />
            {needsReview} {needsReview === 1 ? 'file needs' : 'files need'} review before the run
          </span>
        ) : null}
        <span className="flex-1" />
        <Button size="lg" disabled={!hasFiles} onClick={onStart}>
          Start modeling
        </Button>
      </footer>
    </section>
  );
}
