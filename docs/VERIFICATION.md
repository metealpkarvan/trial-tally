# Verification record

Date: 2026-10-05 · release: 1.0.0

## Automated rules

**30 tests passed** locally with Node.js 25.3.0 using npm test. npm run build completed and produced the static dist directory. GitHub Actions is configured to repeat the checks on Node.js 22 and 24; the repository Actions tab shows the actual run results.

Date validation, leap years, decision buffers across month/year boundaries, constant-price arithmetic, cancellation evidence, unsafe links, ICS escaping, all-day event ends and UTF-8 line folding.

Eight shared helper checks cover HTML escaping, URL schemes and credentials, import file size, backup identity/version and full-schema validation. Veil Paste includes these helper checks although the app intentionally has no workspace backup/import controls.

## Browser acceptance

Chromium driven with the Playwright CLI, served over local HTTP. Full workflows were exercised at a 1280 × 900 viewport, with a 390 × 844 mobile viewport checked for horizontal overflow. Screenshots show explicitly fictional sample content.

Loaded a fictional subscription, blocked cancellation confirmation without evidence, downloaded two calendar events, saved a receipt note and proof checkbox, confirmed cancellation, reloaded and reopened the record. This records a user decision; it does not contact a provider or cancel a subscription.

Turkish/English switching, reload persistence where applicable, service-worker readiness, offline reopening after an online load and the absence of uncaught page errors were checked. Offline checks ran after the worker had taken control; they do not claim first-ever offline installation.

[Desktop screenshot](preview.png) · [Mobile screenshot](mobile.png)

## Limits of this record

Safari, Firefox, real phones and assistive technologies were not exercised. No representative user study, productivity measurement, adoption metric or security audit was performed. Browser storage and clipboard permissions depend on user settings. Shared GitHub Pages origins do not isolate applications from each other; see DECISIONS.md.

Calendar contents were checked against date, escaping and line-folding rules; an import and alarm in Apple Calendar, Google Calendar or Outlook was not verified. Calendar alarms depend on the calendar client.
