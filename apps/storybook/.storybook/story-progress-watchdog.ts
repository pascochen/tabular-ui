import path from 'node:path';
import type { Reporter, TestCase, TestModule, Vitest } from 'vitest/node';

/**
 * Fails the story-test run when it stops making progress, and says where.
 *
 * Vitest times out a test or a hook from inside the page. A story that locks
 * the page's main thread stops those timers too, and a file whose import
 * never settles is never timed at all. Either way the run waits forever: on
 * #37 and #40 CI's Story tests step sat for 28 minutes, until the job's
 * 30-minute limit cancelled it, with nothing in the log saying why. Throwing
 * from a setup file inside the page doesn't help: Vitest logs it as an
 * unhandled error and keeps waiting.
 *
 * So this runs on Vitest's side, as a reporter, and watches for silence.
 * Every file queued, loaded and finished, and every story started and
 * finished, counts as progress. If none arrives within the limit, it prints
 * each unfinished file, whether it loaded, and the last story it reported,
 * and fails the run. A page that locks up cannot report the story that
 * locked it, so the freeze is in the story after the last one reported.
 *
 * Silence, not a per-file clock, because the first freeze stopped a story
 * after its file had loaded (#40), which #39's load-time watchdog missed.
 * The limit must cover the longest quiet stretch of a healthy run: CI's
 * start, while dependencies are pre-bundled on a cold cache, was about 70s.
 */
export class StoryProgressWatchdog implements Reporter {
  private vitest?: Vitest;
  private readonly limitMs: number;
  private interval?: ReturnType<typeof setInterval>;
  private lastProgress = 0;
  /** Queued and not yet finished, with what each has reported so far. */
  private readonly unfinished = new Map<string, { file: string; loaded: boolean; lastStory?: string }>();

  constructor(limitMs: number) {
    this.limitMs = limitMs;
  }

  onInit(vitest: Vitest) {
    this.vitest = vitest;
  }

  onTestRunStart() {
    this.unfinished.clear();
    this.progress();
    clearInterval(this.interval);
    this.interval = setInterval(() => this.check(), 5_000);
    this.interval.unref();
  }

  onTestModuleQueued(module: TestModule) {
    this.unfinished.set(key(module), {
      file: `${module.project.name}: ${this.relative(module.moduleId)}`,
      loaded: false,
    });
    this.progress();
  }

  onTestModuleCollected(module: TestModule) {
    const entry = this.unfinished.get(key(module));
    if (entry) entry.loaded = true;
    this.progress();
  }

  onTestCaseReady(test: TestCase) {
    const entry = this.unfinished.get(key(test.module));
    if (entry) entry.lastStory = test.fullName;
    this.progress();
  }

  onTestCaseResult() {
    this.progress();
  }

  onTestModuleEnd(module: TestModule) {
    this.unfinished.delete(key(module));
    this.progress();
  }

  onTestRunEnd() {
    clearInterval(this.interval);
    this.interval = undefined;
  }

  private progress() {
    this.lastProgress = Date.now();
  }

  private relative(file: string) {
    return path.relative(this.vitest?.config.root ?? process.cwd(), file);
  }

  private check() {
    if (Date.now() - this.lastProgress < this.limitMs) return;
    clearInterval(this.interval);
    this.interval = undefined;
    const files =
      [...this.unfinished.values()]
        .map(({ file, loaded, lastStory }) => {
          const state = !loaded
            ? 'still loading'
            : lastStory
              ? `loaded; last story reported: "${lastStory}"`
              : 'loaded; no story reported yet';
          return `  ${file} (${state})`;
        })
        .join('\n') || '  (none queued)';
    console.error(
      `\n[story-progress-watchdog] No story test reported progress for ${this.limitMs / 1000}s. ` +
        'Failing the run instead of waiting for it.\n' +
        `Files still unfinished:\n${files}\n` +
        'A frozen page cannot report the story that froze it: suspect the story after the last one reported.\n' +
        'See tools.md, "Story tests that stop making progress".\n',
    );
    process.exitCode = 1;
    // Cancelling waits for files in flight, and a frozen one never settles,
    // so a single run exits outright if the cancel hasn't ended it in a few
    // seconds. Watch mode keeps the watcher alive and only cancels.
    if (!this.vitest?.config.watch) setTimeout(() => process.exit(1), 10_000).unref();
    void this.vitest?.cancelCurrentRun('test-failure');
  }
}

const key = (module: TestModule) => `${module.project.name}\0${module.moduleId}`;
