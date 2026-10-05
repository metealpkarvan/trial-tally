import test from "node:test";
import assert from "node:assert/strict";
import {
  dateNumber,
  shiftDate,
  validateTrial,
  validate,
  decisionDate,
  urgency,
  twelveMonths,
  escapeICS,
  foldLine,
  calendar,
} from "../src/core.js";
const trial = () => ({
  id: "1",
  name: "Test",
  deadline: "2026-11-02",
  buffer: 2,
  price: 15,
  currency: "USD",
  billing: "monthly",
  commitment: "unknown",
  url: "",
  note: "",
  status: "active",
  checks: { terms: false, route: false, proof: false },
});
test("leap day accepted", () => assert.ok(dateNumber("2024-02-29")));
test("invalid leap day rejected", () =>
  assert.throws(() => dateNumber("2025-02-29")));
test("invalid dates rejected", () => {
  for (const s of ["2026-13-01", "2026-02-30", "01/02/2026"])
    assert.throws(() => dateNumber(s));
});
test("buffer crosses month boundary", () =>
  assert.equal(decisionDate(trial()), "2026-10-31"));
test("date shifting independent of DST", () =>
  assert.equal(shiftDate("2026-03-29", 1), "2026-03-30"));
test("deadline day still decision time", () =>
  assert.equal(urgency(trial(), "2026-11-02"), "decide-now"));
test("next day clearly overdue", () =>
  assert.equal(urgency(trial(), "2026-11-03"), "past-deadline"));
test("cancelled record not counted as due", () =>
  assert.equal(
    urgency({ ...trial(), status: "cancelled" }, "2026-11-03"),
    "cancelled",
  ));
test("cancellation needs saved evidence", () =>
  assert.throws(() => validateTrial({ ...trial(), status: "cancelled" })));
test("evidence and note permit user confirmation", () =>
  assert.equal(
    validateTrial({
      ...trial(),
      status: "cancelled",
      note: "Receipt number saved",
      checks: { terms: true, route: true, proof: true },
    }).status,
    "cancelled",
  ));
test("annual projection uses entered price period", () => {
  assert.equal(twelveMonths(trial()), 180);
  assert.equal(
    twelveMonths({ ...trial(), billing: "yearly", price: 120 }),
    120,
  );
});
test("unsafe URL rejected", () =>
  assert.throws(() =>
    validateTrial({ ...trial(), url: "data:text/html,test" }),
  ));
test("duplicate IDs rejected", () =>
  assert.throws(() => validate({ trials: [trial(), trial()] })));
test("calendar has two all-day events", () => {
  const s = calendar([trial()], new Date("2026-10-05T00:00:00Z"));
  assert.equal(s.match(/BEGIN:VEVENT/g).length, 2);
  assert.ok(s.includes("DTSTART;VALUE=DATE:20261031"));
  assert.ok(s.includes("DTEND;VALUE=DATE:20261101"));
});
test("closed trials excluded from calendar", () =>
  assert.ok(
    !calendar([{ ...trial(), status: "kept" }]).includes("BEGIN:VEVENT"),
  ));
test("calendar escaping blocks injected new event", () =>
  assert.equal(escapeICS("A\nBEGIN:VEVENT;X,Y"), "A\\nBEGIN:VEVENT\\;X\\,Y"));
test("UTF8 folding stays within 75 octets", () => {
  for (const line of foldLine("SUMMARY:" + "İ🌱".repeat(50)).split("\r\n"))
    assert.ok(new TextEncoder().encode(line).length <= 75);
});
test("folding roundtrip preserves Unicode", () => {
  const s = "SUMMARY:" + "İ🌱".repeat(50);
  assert.equal(foldLine(s).replace(/\r\n /g, ""), s);
});
test("fractional buffer rejected", () =>
  assert.throws(() => validateTrial({ ...trial(), buffer: 1.5 })));
test("nonfinite price rejected", () =>
  assert.throws(() => validateTrial({ ...trial(), price: Infinity })));

test("lone carriage return is escaped in calendar text", () =>
  assert.equal(escapeICS("A\rBEGIN:VEVENT"), "A\\nBEGIN:VEVENT"));
test("decision buffer works across earliest saved year", () =>
  assert.equal(
    decisionDate({ ...trial(), deadline: "1900-01-01", buffer: 2 }),
    "1899-12-30",
  ));
