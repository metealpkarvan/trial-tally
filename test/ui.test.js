import test from "node:test";
import assert from "node:assert/strict";
import { esc, safeUrl, readBackup } from "../src/ui.js";
test("HTML and attribute delimiters escaped", () =>
  assert.equal(
    esc("<img src=\"x\" onerror='x'>&"),
    "&lt;img src=&quot;x&quot; onerror=&#39;x&#39;&gt;&amp;",
  ));
test("safe URL allows https with normalized path", () =>
  assert.equal(safeUrl("https://example.org"), "https://example.org/"));
test("executable and local schemes rejected", () => {
  for (const u of ["javascript:alert(1)", "data:text/html,x", "file:///tmp/x"])
    assert.equal(safeUrl(u), "");
});
test("URL credentials rejected", () =>
  assert.equal(safeUrl("https://user:pass@example.org"), ""));
test("foreign backup rejected before schema validation", async () => {
  let called = false;
  await assert.rejects(
    readBackup(
      {
        size: 50,
        text: async () =>
          JSON.stringify({ kind: "wrong", version: 1, data: [] }),
      },
      "app",
      () => (called = true),
    ),
  );
  assert.equal(called, false);
});
test("oversized backup rejected before reading", async () => {
  let read = false;
  await assert.rejects(
    readBackup(
      {
        size: 1000001,
        text: async () => {
          read = true;
        },
      },
      "app",
      (x) => x,
    ),
  );
  assert.equal(read, false);
});
test("backup schema failure rejects all records", async () =>
  await assert.rejects(
    readBackup(
      {
        size: 50,
        text: async () =>
          JSON.stringify({ kind: "app", version: 1, data: [1] }),
      },
      "app",
      () => {
        throw new Error("Bad record");
      },
    ),
  ));
test("valid backup data returned through validator", async () =>
  assert.deepEqual(
    await readBackup(
      {
        size: 50,
        text: async () =>
          JSON.stringify({ kind: "app", version: 1, data: ["ok"] }),
      },
      "app",
      (x) => x,
    ),
    ["ok"],
  ));
