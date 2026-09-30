import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";

const projectRoot = process.cwd();
const globalsCss = readFileSync(path.join(projectRoot, "src/app/globals.css"), "utf8");
const rootLayout = readFileSync(path.join(projectRoot, "src/app/layout.tsx"), "utf8");
const domainTypes = readFileSync(path.join(projectRoot, "src/types/domain.ts"), "utf8");

describe("Cobalt Commons design contract", () => {
  test("keeps every approved color token and value in the Tailwind theme", () => {
    const approvedTokens = [
      "--color-canvas: #FFFDF8",
      "--color-surface: #FFFFFF",
      "--color-surface-subtle: #F5F7FB",
      "--color-primary: #2F5BD3",
      "--color-primary-hover: #2446A8",
      "--color-primary-active: #1D3987",
      "--color-primary-soft: #E9EEFF",
      "--color-community: #F59E42",
      "--color-text-primary: #172033",
      "--color-text-secondary: #596275",
      "--color-text-tertiary: #667085",
      "--color-border: #DDE2EA",
      "--color-border-strong: #B8C0CE",
      "--color-success: #17745A",
      "--color-success-soft: #E8F6F0",
      "--color-warning: #7A4A00",
      "--color-warning-soft: #FFF4D6",
      "--color-danger: #B4233A",
      "--color-danger-soft: #FDECEF",
      "--color-info: #2F5BD3",
      "--color-info-soft: #E9EEFF",
      "--color-neutral: #596275",
      "--color-neutral-soft: #EEF1F5",
    ];

    for (const token of approvedTokens) {
      assert.match(globalsCss, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  });

  test("removes the legacy mint and Inter foundation", () => {
    const foundationSources = `${globalsCss}\n${rootLayout}`;

    assert.doesNotMatch(foundationSources, /#10D9A3/i);
    assert.doesNotMatch(foundationSources, /#05966B/i);
    assert.doesNotMatch(foundationSources, /--font-inter/);
  });

  test("loads Plus Jakarta Sans with Vietnamese support through next font", () => {
    assert.match(rootLayout, /Plus_Jakarta_Sans/);
    assert.match(rootLayout, /subsets:\s*\["latin",\s*"vietnamese"\]/);
    assert.match(rootLayout, /variable:\s*"--font-plus-jakarta"/);
  });

  test("preserves business-critical confirmation phrases", () => {
    const protectedPhrases = [
      "Archive this user",
      "Archive this room",
      "I agree to remove this user",
    ];

    for (const phrase of protectedPhrases) {
      assert.match(domainTypes, new RegExp(phrase));
    }
  });
});
