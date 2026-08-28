import type { NormalizedResult } from "../provider";

/**
 * Minimal, dependency-free JUnit XML parser.
 *
 * Normalizes <testcase> elements into the internal result model. This is an
 * adapter: the same NormalizedResult[] shape is produced by every parser
 * (Playwright JSON, Cypress, ...) so the ingestion pipeline stays uniform.
 *
 * Note: this is a pragmatic regex-based reader suitable for standard JUnit
 * output. For production-grade ingestion of arbitrary XML, swap in a streaming
 * XML parser behind this same function signature.
 */
export function parseJUnitXml(xml: string): NormalizedResult[] {
  const results: NormalizedResult[] = [];
  const caseRegex =
    /<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g;

  let match: RegExpExecArray | null;
  while ((match = caseRegex.exec(xml)) !== null) {
    const attrs = parseAttributes(match[1] ?? "");
    const inner = match[2] ?? "";

    const name = attrs.name ?? attrs.classname ?? "unknown";
    const time = attrs.time ? Number.parseFloat(attrs.time) : undefined;

    let status: NormalizedResult["status"] = "PASSED";
    let errorMessage: string | undefined;

    if (/<failure\b/.test(inner) || /<error\b/.test(inner)) {
      status = "FAILED";
      errorMessage = extractMessage(inner);
    } else if (/<skipped\b/.test(inner)) {
      status = "SKIPPED";
    }

    results.push({
      testRef: name,
      status,
      durationMs:
        time !== undefined && !Number.isNaN(time)
          ? Math.round(time * 1000)
          : undefined,
      errorMessage,
    });
  }

  return results;
}

function parseAttributes(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /(\w[\w:-]*)\s*=\s*"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    attrs[m[1]!.toLowerCase()] = decodeEntities(m[2] ?? "");
  }
  return attrs;
}

function extractMessage(inner: string): string | undefined {
  const m = /<(?:failure|error)\b[^>]*\bmessage\s*=\s*"([^"]*)"/.exec(inner);
  return m ? decodeEntities(m[1] ?? "") : undefined;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}
