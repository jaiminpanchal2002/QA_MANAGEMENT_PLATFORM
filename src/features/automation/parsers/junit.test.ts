import { describe, expect, it } from "vitest";
import { parseJUnitXml } from "./junit";

describe("parseJUnitXml", () => {
  const xml = `<?xml version="1.0"?>
    <testsuite name="checkout" tests="3" failures="1" skipped="1">
      <testcase classname="checkout" name="SHOP-TC-001" time="0.512" />
      <testcase classname="checkout" name="SHOP-TC-002" time="1.2">
        <failure message="Expected total to be 100">Stack trace here</failure>
      </testcase>
      <testcase classname="checkout" name="SHOP-TC-003" time="0">
        <skipped />
      </testcase>
    </testsuite>`;

  it("normalizes passed, failed and skipped cases", () => {
    const results = parseJUnitXml(xml);
    expect(results).toHaveLength(3);

    const byRef = Object.fromEntries(results.map((r) => [r.testRef, r]));
    expect(byRef["SHOP-TC-001"]?.status).toBe("PASSED");
    expect(byRef["SHOP-TC-001"]?.durationMs).toBe(512);

    expect(byRef["SHOP-TC-002"]?.status).toBe("FAILED");
    expect(byRef["SHOP-TC-002"]?.errorMessage).toBe(
      "Expected total to be 100"
    );

    expect(byRef["SHOP-TC-003"]?.status).toBe("SKIPPED");
  });

  it("returns an empty array for input with no test cases", () => {
    expect(parseJUnitXml("<testsuite></testsuite>")).toEqual([]);
  });
});
