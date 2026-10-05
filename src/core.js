import { text, array, safeUrl } from "./ui.js";
export const empty = () => ({ trials: [] });
export function dateNumber(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Use YYYY-MM-DD");
  const n = Date.parse(value + "T00:00:00Z");
  if (!Number.isFinite(n) || new Date(n).toISOString().slice(0, 10) !== value)
    throw new Error("Invalid calendar date");
  return n;
}
export const shiftDate = (value, days) =>
  new Date(dateNumber(value) + days * 86400000).toISOString().slice(0, 10);
export const localToday = (date = new Date()) =>
  date.getFullYear() +
  "-" +
  String(date.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(date.getDate()).padStart(2, "0");
export function validateTrial(c) {
  if (
    !c ||
    !["active", "cancelled", "kept"].includes(c.status) ||
    !["monthly", "yearly"].includes(c.billing) ||
    !["unknown", "monthly", "annual-monthly", "annual"].includes(
      c.commitment,
    ) ||
    !["TRY", "USD", "EUR", "GBP"].includes(c.currency)
  )
    throw new Error("Invalid trial fields");
  const result = {
    id: text(c.id, 100),
    name: text(c.name, 120),
    deadline: text(c.deadline, 10),
    buffer: c.buffer,
    price: c.price,
    currency: c.currency,
    billing: c.billing,
    commitment: c.commitment,
    url: text(c.url, 2000),
    note: text(c.note, 3000),
    status: c.status,
    checks: c.checks,
  };
  dateNumber(result.deadline);
  if (result.deadline < "1900-01-01" || result.deadline > "2200-12-31")
    throw new Error("Use a date between 1900 and 2200");
  if (
    !result.name.trim() ||
    !Number.isInteger(c.buffer) ||
    c.buffer < 0 ||
    c.buffer > 30 ||
    !Number.isFinite(c.price) ||
    c.price < 0 ||
    c.price > 1000000
  )
    throw new Error("Invalid name, buffer or price");
  if (c.url && !safeUrl(c.url))
    throw new Error("Use a valid http/https URL without credentials");
  if (
    !c.checks ||
    ["terms", "route", "proof"].some(
      (key) => typeof c.checks[key] !== "boolean",
    )
  )
    throw new Error("Invalid checklist");
  result.checks = {
    terms: c.checks.terms,
    route: c.checks.route,
    proof: c.checks.proof,
  };
  if (c.status === "cancelled" && (!c.checks.proof || !c.note.trim()))
    throw new Error(
      "Record confirmation evidence before marking cancellation verified",
    );
  return result;
}
export function validate(data) {
  if (!data) throw new Error("Invalid trial file");
  const trials = array(data.trials, 100).map(validateTrial);
  if (new Set(trials.map((c) => c.id)).size !== trials.length)
    throw new Error("Duplicate trial IDs");
  return { trials };
}
export function decisionDate(c) {
  return shiftDate(c.deadline, -c.buffer);
}
export function urgency(c, today) {
  const now = dateNumber(today),
    deadline = dateNumber(c.deadline),
    decision = dateNumber(decisionDate(c));
  if (c.status !== "active") return c.status;
  if (now > deadline) return "past-deadline";
  if (now >= decision) return "decide-now";
  return "upcoming";
}
export const twelveMonths = (c) =>
  Math.round(c.price * (c.billing === "monthly" ? 12 : 1) * 100) / 100;
export function escapeICS(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}
export function foldLine(line) {
  const encode = new TextEncoder();
  let result = "",
    current = "",
    bytes = 0;
  for (const c of line) {
    const size = encode.encode(c).length;
    if (bytes + size > 75) {
      result += current + "\r\n";
      current = " ";
      bytes = 1;
    }
    current += c;
    bytes += size;
  }
  return result + current;
}
export function calendar(trials, now = new Date()) {
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mete Alp Karvan//Trial Tally//EN",
    "CALSCALE:GREGORIAN",
  ];
  for (const c of trials.filter((c) => c.status === "active"))
    for (const [type, day] of [
      ["review", decisionDate(c)],
      ["deadline", c.deadline],
    ]) {
      const description =
        "Verify the provider deadline and time zone. This calendar does not cancel the subscription. " +
        c.note;
      lines.push(
        "BEGIN:VEVENT",
        "UID:" + escapeICS(c.id + "-" + type + "@trial-tally.local"),
        "DTSTAMP:" + stamp,
        "DTSTART;VALUE=DATE:" + day.replace(/-/g, ""),
        "DTEND;VALUE=DATE:" + shiftDate(day, 1).replace(/-/g, ""),
        "SUMMARY:" +
          escapeICS(
            (type === "review" ? "Review trial: " : "Decision deadline: ") +
              c.name,
          ),
        "DESCRIPTION:" + escapeICS(description),
        "STATUS:TENTATIVE",
        "TRANSP:TRANSPARENT",
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        "DESCRIPTION:" + escapeICS("Review " + c.name),
        "END:VALARM",
        "END:VEVENT",
      );
    }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
