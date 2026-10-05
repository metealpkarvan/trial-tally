# Trial Tally

Turn a free trial into a clear deadline and a practical exit kit.

**[Open the app](https://metealpkarvan.github.io/trial-tally/)** · [Türkçe](README.tr.md) · [Download runnable ZIP](https://github.com/metealpkarvan/trial-tally/releases/latest)

![Trial Tally screenshot](docs/preview.png)

## Problem and idea

Saving a trial-end date is not enough when the cancellation route, commitment and confirmation receipt are still unclear. Waiting until the last day leaves no room to investigate.

A practical exit kit: an earlier decision date, separately recorded billing and commitment, a cancellation route, evidence checklist and calendar export. The originating X/Twitter observation, access limitations and product inferences are documented in [research notes](docs/RESEARCH.md). This is an independent project, not an endorsed integration.

## Use it

1. Check provider terms and enter a day-based deadline and a 0–30 day decision buffer.
2. Record price period and commitment separately; add account/cancellation URL and time-zone notes.
3. Use the checklist to check terms, locate cancellation and save confirmation evidence.
4. Import the .ics file into your calendar: a review event and deadline event for each active trial.
5. Mark cancellation verified after saving evidence and a note, or choose to keep the subscription. The app never cancels it for you.

Switch between Turkish and English. The sample button loads explicitly fictional data. After one successful online load, the service worker caches the app shell for offline reopening in the same browser. Browser support and storage settings vary; export important records.

## Download and run locally

The public demo needs no account or installation. Download **trial-tally-v1.0.0.zip** from Releases, extract it and serve the extracted directory:

    python3 -m http.server 8080 --bind 127.0.0.1

Open http://127.0.0.1:8080. Use a local HTTP server rather than double-clicking index.html; browsers restrict ES modules on file URLs. Release ZIPs contain no credentials or private user records. Verify with the release checksum file:

    shasum -a 256 -c SHA256SUMS.txt

## Privacy and limits

All logic runs in the browser. No AI API, account, analytics, third-party font or remote database. Text is not uploaded. External links open only on user action. Records use a namespaced localStorage key. JSON backups are unencrypted personal files. Import checks app identity, version, size and schema before asking to replace records.

No automatic cancellation or background reminder. Dates are all-day values, not provider cutoff times. Calendar clients may handle alarms differently. Arithmetic excludes taxes, changes and cancellation fees; currencies are never added together.

## Development

    git clone https://github.com/metealpkarvan/trial-tally.git
    cd trial-tally
    npm test
    npm run build
    npm start

Node.js 22+ is needed for tests/build; the app has **zero runtime packages**. Python 3 serves the app. The dist directory is a complete static deployment. GitHub Actions tests Node 22 and 24 and validates before publishing to Pages.

Core checks: Leap years, invalid dates, month/DST boundaries, cancellation evidence, urgency, ICS escaping and UTF-8 75-octet folding. Browser acceptance and limitations are recorded in [verification](docs/VERIFICATION.md).

See [architecture](docs/DECISIONS.md), [contributing](CONTRIBUTING.md), [roadmap](docs/ROADMAP.md) and [changelog](CHANGELOG.md).

MIT © 2026 Mete Alp Karvan
