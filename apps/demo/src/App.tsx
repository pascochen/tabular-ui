import { useEffect, useRef, useState } from 'react';
import { AppBar, Spinner } from 'tabular-ui';

import { DemoBanner } from './components/DemoBanner';
import {
  classify,
  csvLacksHeader,
  estimateRunMinutes,
  formatBytes,
  loadKasanePack,
  toJourneyFile,
  MAX_FILE_BYTES,
  type JourneyFile,
  type RejectedFile,
} from './lib/files';
import { findingsIn } from './lib/findings';
import { DiscoverySummaryScreen } from './screens/DiscoverySummaryScreen';
import { PreflightDialog } from './screens/PreflightDialog';
import { ReadingScreen, type RunOutcome } from './screens/ReadingScreen';
import { RecapScreen, type RecapCounts } from './screens/RecapScreen';
import { UploadScreen } from './screens/UploadScreen';

type Phase = 'upload' | 'reading' | 'recap' | 'modeling';

/**
 * Deep links for the portfolio: `?step=preflight` opens the journey at that
 * point with Kasane's files already loaded. The URL follows the journey, so
 * any screen a visitor reaches can be shared.
 */
const STEPS = ['files', 'preflight', 'reading', 'recap', 'discovery'] as const;
type Step = (typeof STEPS)[number];

function stepFromUrl(): Step | null {
  const step = new URLSearchParams(window.location.search).get('step');
  return (STEPS as readonly string[]).includes(step ?? '') ? (step as Step) : null;
}

/**
 * What the recap shows: findings whose sources were all read, and one
 * evidence sheet per file read. A flagged file still gets its sheet, marked
 * for review, as the pre-flight dialog says; until 2026-10-21 it was left out
 * of the count, so 20 files read showed 19 sheets.
 */
function countsFor(read: JourneyFile[]): RecapCounts {
  const found = findingsIn(read);
  return {
    gaps: found.gaps.length,
    followUps: found.followUps.length,
    contradictions: found.contradictions.length,
    evidenceSheets: read.length,
    flaggedSheets: read.filter((f) => f.status === 'needs-review').length,
  };
}

/**
 * One route, a step state machine, no router. Steps 1–2 share the `upload`
 * phase (the dropzone becomes the file list in place); step 3 is the
 * pre-flight dialog over it; 4 and 5 are phases of their own.
 */
export function App() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [files, setFiles] = useState<JourneyFile[]>([]);
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const [preflightOpen, setPreflightOpen] = useState(false);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [counts, setCounts] = useState<RecapCounts | null>(null);
  const [packLoading, setPackLoading] = useState(false);

  // The deep link, read once, before any effect can rewrite the URL. Read
  // inside the effect, it was gone in development: React runs effects twice
  // there, and the URL effect below had already replaced ?step with / by the
  // second run, so every shared link opened the empty dropzone.
  const [linkedStep] = useState(stepFromUrl);
  const [opening, setOpening] = useState(linkedStep !== null);
  // Set by Start over: a link still loading must not land on top of it.
  const linkAbandoned = useRef(false);

  // Pending validation, cancellable. The timers must not outlive what they
  // validate: a status flip landing after the pre-flight dialog has reported
  // its counts makes the recap disagree with what the user was shown, and a
  // timer firing after restart() does file reads for a list that no longer
  // exists. The epoch guards the async window between a timer firing and its
  // file read resolving — clearTimeout alone cannot stop a callback that has
  // already started awaiting.
  const validationTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const validationEpoch = useRef(0);

  const cancelPendingValidation = () => {
    validationEpoch.current += 1;
    for (const timer of validationTimers.current.values()) clearTimeout(timer);
    validationTimers.current.clear();
  };

  const addFiles = (incoming: File[]) => {
    const accepted: JourneyFile[] = [];
    const rejections: RejectedFile[] = [];
    for (const f of incoming) {
      const kind = classify(f.name);
      if (!kind) {
        rejections.push({ name: f.name, reason: 'isn’t a supported type. Use .txt, .md, .csv, .jpg or .png.' });
        continue;
      }
      if (f.size > MAX_FILE_BYTES) {
        rejections.push({ name: f.name, reason: `over the 5 MB limit (${formatBytes(f.size)})` });
        continue;
      }
      accepted.push(toJourneyFile(f, kind));
    }
    // Rejections describe the latest add only — stale ones about files from a
    // previous batch would read as if they applied to the current list.
    setRejected(rejections);
    if (accepted.length === 0) return;
    setFiles((prev) => [...prev, ...accepted]);

    // Validation runs per file, staggered so the queued → passed/needs-review
    // transition is visible as work rather than a flash. The CSV header check
    // reads the actual file.
    const epoch = validationEpoch.current;
    accepted.forEach((jf, i) => {
      const timer = setTimeout(
        async () => {
          validationTimers.current.delete(jf.id);
          const lacksHeader = jf.kind === 'spreadsheet' && (await csvLacksHeader(jf.file));
          // The run may have been committed (or restarted) while the read was
          // in flight; its statuses are frozen as the dialog reported them.
          if (validationEpoch.current !== epoch) return;
          setFiles((prev) =>
            prev.map((p) =>
              p.id === jf.id
                ? lacksHeader
                  ? { ...p, status: 'needs-review', flag: 'no header row detected' }
                  : { ...p, status: 'passed' }
                : p,
            ),
          );
        },
        350 + i * 120,
      );
      validationTimers.current.set(jf.id, timer);
    });
  };

  const removeFile = (id: string) => {
    const timer = validationTimers.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      validationTimers.current.delete(id);
    }
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const finishRun = (result: RunOutcome) => {
    setOutcome(result);
    setCounts(countsFor(files.slice(0, result.filesRead)));
    setPhase('recap');
  };

  const loadKasaneFiles = async () => {
    setPackLoading(true);
    try {
      addFiles(await loadKasanePack());
    } catch {
      setRejected([{ name: 'Kasane’s files', reason: 'could not be loaded. Check the connection and try again' }]);
    } finally {
      setPackLoading(false);
    }
  };

  // Open a deep link once, on load. The files are validated in full before any
  // step past the dropzone, so the pre-flight dialog and the recap report what
  // a visitor who clicked through would have seen. Until they are, the page
  // says it is opening the link (on a slow connection that took seconds, over
  // an empty dropzone a visitor could click into).
  useEffect(() => {
    const step = linkedStep;
    if (!step) return;
    let cancelled = false;
    const stale = () => cancelled || linkAbandoned.current;
    (async () => {
      const pack = await loadKasanePack();
      const seeded = await Promise.all(
        pack.map(async (file) => {
          const jf = toJourneyFile(file, classify(file.name)!);
          const lacksHeader = jf.kind === 'spreadsheet' && (await csvLacksHeader(file));
          return lacksHeader
            ? { ...jf, status: 'needs-review' as const, flag: 'no header row detected' }
            : { ...jf, status: 'passed' as const };
        }),
      );
      if (stale()) return;
      setFiles(seeded);
      if (step === 'preflight') setPreflightOpen(true);
      if (step === 'reading') setPhase('reading');
      if (step === 'recap' || step === 'discovery') {
        setOutcome({
          filesRead: seeded.length,
          totalFiles: seeded.length,
          elapsedMinutes: estimateRunMinutes(seeded),
          cancelled: false,
        });
        setCounts(countsFor(seeded));
        setPhase(step === 'recap' ? 'recap' : 'modeling');
      }
      setOpening(false);
    })().catch(() => {
      if (stale()) return;
      setRejected([
        { name: 'Kasane’s files', reason: 'couldn’t load from this link. Use Kasane’s files to try again.' },
      ]);
      setOpening(false);
    });
    return () => {
      cancelled = true;
    };
  }, [linkedStep]);

  // The URL follows the journey (replaceState: no history entries to step back
  // through), once a deep link has opened: until then it keeps ?step, so a
  // reload while loading still lands where the link pointed.
  useEffect(() => {
    if (opening) return;
    const step: Step | null =
      phase === 'modeling'
        ? 'discovery'
        : phase === 'recap'
          ? 'recap'
          : phase === 'reading'
            ? 'reading'
            : preflightOpen
              ? 'preflight'
              : files.length > 0
                ? 'files'
                : null;
    const url = step ? `?step=${step}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [opening, phase, preflightOpen, files.length]);

  const restart = () => {
    linkAbandoned.current = true;
    setOpening(false);
    cancelPendingValidation();
    setPhase('upload');
    setFiles([]);
    setRejected([]);
    setOutcome(null);
    setCounts(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas font-sans text-base text-text-body">
      <AppBar
        brand={
          // The brand wordmark, a file used unchanged: brand assets are outside
          // the colour rules (docs/design-system.md §1, "Brand assets"). Its
          // own size; the demo is light-mode only, so the light version.
          <img src="/tabular-wordmark-small.svg" alt="Tabular" width={132} height={20} className="block" />
        }
      >
        <span className="flex items-center gap-[var(--gap-inline)] text-sm text-text-secondary">
          <span aria-hidden="true" className="h-4 w-px bg-border-strong" />
          New model
        </span>
      </AppBar>
      <DemoBanner onStartOver={restart} />

      {/*
        This app's shell, so it may use the frame tier (§7.3). Top only: the
        720px reading column already has air either side on any desktop
        window, and a 48px gutter inside it would cut the measure to 624px.
        The bottom is --pad-page-y, as AppShell's main: a gap token used as
        padding grew silently when --gap-section rose to 32px.
      */}
      <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-[var(--gap-section)] px-[var(--pad-page-x)] pt-[var(--pad-frame-top)] pb-[var(--pad-page-y)]">
        {opening ? (
          <p role="status" className="flex items-center gap-[var(--gap-control-icon)] text-sm text-text-secondary">
            <Spinner />
            Opening the shared link…
          </p>
        ) : phase === 'upload' ? (
          <UploadScreen
            files={files}
            rejected={rejected}
            onAddFiles={addFiles}
            onUseKasaneFiles={loadKasaneFiles}
            kasaneLoading={packLoading}
            onRemove={removeFile}
            onStart={() => setPreflightOpen(true)}
          />
        ) : phase === 'reading' ? (
          <ReadingScreen files={files} onFinished={finishRun} />
        ) : phase === 'recap' && outcome && counts ? (
          <RecapScreen
            outcome={outcome}
            counts={counts}
            // Real navigation now — the modeling surface exists. It must
            // never be wired to `restart`: the primary action would then
            // silently destroy the run the user just waited for, under a
            // label that promises the opposite.
            onOpenModeling={() => setPhase('modeling')}
            onRestart={restart}
          />
        ) : phase === 'modeling' && outcome && counts ? (
          <DiscoverySummaryScreen
            files={files}
            outcome={outcome}
            counts={counts}
            // Same material, fresh run. Statuses were frozen at commit, so
            // the reading phase re-derives per-file display state by index.
            onRestartAnalysis={() => setPhase('reading')}
          />
        ) : null}
      </main>

      <PreflightDialog
        open={preflightOpen}
        onOpenChange={setPreflightOpen}
        files={files}
        onConfirm={() => {
          // Committing freezes validation: from here the recap must agree
          // with the counts this dialog just showed.
          cancelPendingValidation();
          setPreflightOpen(false);
          setPhase('reading');
        }}
      />
    </div>
  );
}
