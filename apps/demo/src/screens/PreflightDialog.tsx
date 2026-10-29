import { ChatTextIcon, ClockIcon, FileCsvIcon, FileImageIcon, FileTextIcon, WarningIcon } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import {
  Button,
  CountBadge,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  StatusBadge,
} from 'tabular-ui';

import { estimateRunMinutes, fileKinds, formatMinutes, type FileKind, type JourneyFile } from '../lib/files';

const kindIcons: Record<FileKind, Icon> = {
  transcript: ChatTextIcon,
  document: FileTextIcon,
  spreadsheet: FileCsvIcon,
  image: FileImageIcon,
};

const kindOrder: FileKind[] = ['transcript', 'document', 'spreadsheet', 'image'];

export type PreflightDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: JourneyFile[];
  onConfirm: () => void;
};

/**
 * Step 3: the pre-flight check. Four static summary rows — deliberately not
 * a DataTable; nothing here sorts, filters or virtualizes.
 *
 * The rows and the flagged file are computed from the actual selection, not
 * canned: the CSV called out below really lacks a header row, because the
 * sniffer read it.
 *
 * A file whose check has not finished is shown as queued, never as passed,
 * and the run cannot start until every check has a result. Until 2026-10-28
 * an unchecked file read "passed" here, and confirming cancelled its check,
 * so a CSV without a header could reach the run unflagged.
 */
export function PreflightDialog({ open, onOpenChange, files, onConfirm }: PreflightDialogProps) {
  const flagged = files.filter((f) => f.status === 'needs-review');
  const unchecked = files.filter((f) => f.status === 'queued').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Check your files before the run</DialogTitle>
          <DialogDescription>
            {files.length} {files.length === 1 ? 'file' : 'files'}, by type. The run reads every file and drafts the
            first evidence sheets.
          </DialogDescription>
        </DialogHeader>

        {/* Dialog redefines the border token for its subtree, so these
            dividers stay visible on the raised surface. */}
        <ul className="flex flex-col divide-y divide-border">
          {kindOrder.map((kind) => {
            const ofKind = files.filter((f) => f.kind === kind);
            if (ofKind.length === 0) return null;
            const kindStatus = ofKind.some((f) => f.status === 'needs-review')
              ? 'needs-review'
              : ofKind.some((f) => f.status === 'queued')
                ? 'queued'
                : 'passed';
            const KindIcon = kindIcons[kind];
            return (
              <li key={kind} className="flex h-[var(--h-row-sm)] items-center gap-[var(--gap-inline)]">
                <KindIcon
                  weight="bold"
                  aria-hidden="true"
                  className="size-[var(--size-icon-sm)] shrink-0 text-text-secondary"
                />
                {/* Category + figure in one static marker — CountBadge's
                    documented use. Neutral: a count is a quantity, not state;
                    the StatusBadge beside it carries the state. */}
                <CountBadge label={fileKinds[kind].plural} count={ofKind.length} />
                <span className="flex-1" />
                <StatusBadge status={kindStatus} />
              </li>
            );
          })}
        </ul>

        {flagged.map((f) => (
          <div
            key={f.id}
            className="flex items-start gap-[var(--gap-control-icon)] rounded-sm border border-border-warning bg-bg-warning p-[var(--pad-popover)]"
          >
            <WarningIcon
              weight="bold"
              aria-hidden="true"
              className="mt-px size-[var(--size-icon-sm)] shrink-0 text-text-warning"
            />
            <p className="min-w-0 text-sm text-text-body">
              <span className="font-mono text-xs" style={{ fontFeatureSettings: 'var(--font-mono-features)' }}>
                {f.name}
              </span>{' '}
              — {f.flag ?? 'needs review'}. It will still be read, and its evidence sheet is flagged for your review.
            </p>
          </div>
        ))}

        <p className="flex items-start gap-[var(--gap-control-icon)] text-sm text-text-secondary">
          <ClockIcon weight="bold" aria-hidden="true" className="mt-px size-[var(--size-icon-sm)] shrink-0" />A run this
          size takes about {formatMinutes(estimateRunMinutes(files))}, shortened to under a minute in this demo. You can
          cancel early — everything already read is kept.
        </p>

        {/* Says why Start modeling is disabled; it goes when the last check lands. */}
        {unchecked > 0 ? (
          <p className="text-sm text-text-secondary tabular-nums">
            Checking {unchecked} {unchecked === 1 ? 'file' : 'files'}. The run can start when every file is checked.
          </p>
        ) : null}

        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Go back</Button>} />
          <Button disabled={unchecked > 0} onClick={onConfirm}>
            Start modeling
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
