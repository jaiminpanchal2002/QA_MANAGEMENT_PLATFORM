import type {
  AutomationProvider,
  CreateRunRequest,
  NormalizedResult,
  ProviderRunHandle,
  ProviderRunStatus,
} from "../provider";

/**
 * In-memory simulated automation provider for local demos and tests.
 *
 * It models an async lifecycle (QUEUED → RUNNING → COMPLETED) using
 * wall-clock timers and produces deterministic-ish results so the UI shows a
 * realistic mix of pass/fail without any external infrastructure.
 *
 * Deterministic on `testRef` hashing so seeds/tests are reproducible.
 */
interface SimRun {
  request: CreateRunRequest;
  status: ProviderRunStatus;
  startedAt?: number;
}

function hashRef(ref: string): number {
  let h = 0;
  for (let i = 0; i < ref.length; i++) h = (h * 31 + ref.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export class SimulatedProvider implements AutomationProvider {
  readonly name = "SIMULATED";
  private runs = new Map<string, SimRun>();

  async createRun(request: CreateRunRequest): Promise<ProviderRunHandle> {
    const externalJobId = `sim_${request.runId}_${Date.now()}`;
    this.runs.set(externalJobId, { request, status: "QUEUED" });
    return { externalJobId, status: "QUEUED" };
  }

  async startRun(externalJobId: string): Promise<ProviderRunHandle> {
    const run = this.expect(externalJobId);
    run.status = "RUNNING";
    run.startedAt = Date.now();
    return { externalJobId, status: run.status };
  }

  async getRunStatus(externalJobId: string): Promise<ProviderRunStatus> {
    const run = this.expect(externalJobId);
    if (run.status === "RUNNING" && run.startedAt) {
      // Simulate ~2s of execution time before completion.
      if (Date.now() - run.startedAt > 2000) run.status = "COMPLETED";
    }
    return run.status;
  }

  async cancelRun(externalJobId: string): Promise<ProviderRunHandle> {
    const run = this.expect(externalJobId);
    run.status = "CANCELLED";
    return { externalJobId, status: run.status };
  }

  async collectResults(externalJobId: string): Promise<NormalizedResult[]> {
    const run = this.expect(externalJobId);
    return run.request.testRefs.map((testRef) => {
      const h = hashRef(testRef);
      // ~80% pass, 15% fail, 5% skipped — deterministic per ref.
      const bucket = h % 100;
      const status =
        bucket < 80 ? "PASSED" : bucket < 95 ? "FAILED" : "SKIPPED";
      return {
        testRef,
        status,
        durationMs: 200 + (h % 1800),
        errorMessage:
          status === "FAILED"
            ? `Assertion failed in ${testRef}: expected value did not match.`
            : undefined,
      };
    });
  }

  private expect(externalJobId: string): SimRun {
    const run = this.runs.get(externalJobId);
    if (!run) throw new Error(`Unknown simulated run: ${externalJobId}`);
    return run;
  }
}
