/**
 * Automation provider abstraction.
 *
 * Test runs are executed asynchronously by an external provider (Playwright,
 * Cypress, a CI pipeline, ...). The app never blocks an HTTP request on test
 * execution: it creates a run, hands it to a provider to queue, and later
 * polls status / collects results (via webhook or provider API).
 *
 * `SimulatedProvider` (./providers/simulated.ts) implements this locally for
 * the demo. A real provider (e.g. a GitHub Actions dispatcher) implements the
 * same interface and is swapped in via the registry — no call-site changes.
 */
export type ProviderRunStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface NormalizedResult {
  /** Test case reference (e.g. SHOP-TC-001) or external test id. */
  testRef: string;
  status: "PASSED" | "FAILED" | "BLOCKED" | "SKIPPED";
  durationMs?: number;
  errorMessage?: string;
  logs?: string;
}

export interface ProviderRunHandle {
  externalJobId: string;
  status: ProviderRunStatus;
}

export interface CreateRunRequest {
  runId: string;
  provider: string;
  environment?: string;
  testRefs: string[];
}

export interface AutomationProvider {
  readonly name: string;
  /** Register a run with the provider (does not start execution). */
  createRun(request: CreateRunRequest): Promise<ProviderRunHandle>;
  /** Trigger execution of a previously created run. */
  startRun(externalJobId: string): Promise<ProviderRunHandle>;
  /** Poll current status. */
  getRunStatus(externalJobId: string): Promise<ProviderRunStatus>;
  /** Request cancellation. */
  cancelRun(externalJobId: string): Promise<ProviderRunHandle>;
  /** Collect normalized results once a run has completed. */
  collectResults(externalJobId: string): Promise<NormalizedResult[]>;
}

const registry = new Map<string, AutomationProvider>();

export function registerProvider(provider: AutomationProvider): void {
  registry.set(provider.name, provider);
}

export function getProvider(name: string): AutomationProvider | null {
  return registry.get(name) ?? null;
}

export function listProviders(): string[] {
  return [...registry.keys()];
}
