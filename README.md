# carolbales.github.io
Portfolio for Carol Bales, UX Researcher and Strategist 


## Site monitor

This repository includes a scheduled Node.js agent at `/home/runner/work/carolbales.github.io/carolbales.github.io/scripts/site-monitor.mjs`.

Setup:
- Copy `/home/runner/work/carolbales.github.io/carolbales.github.io/config/site-monitor.example.json` to `/home/runner/work/carolbales.github.io/carolbales.github.io/config/site-monitor.json`.
- Add your monitored sites, key phrases, and delivery settings.
- Leave HTML sources disabled until you confirm the site's terms, robots policy, and rate limits allow automation.
- Optional: add a `RESEND_API_KEY` GitHub Actions secret and enable `delivery.email.enabled` for email delivery.

Behavior:
- Runs on a morning schedule in GitHub Actions and can also be triggered manually.
- Prefers RSS/Atom feeds, supports HTML page scanning when explicitly allowed.
- Deduplicates matches across runs using a state directory and writes HTML, text, and JSON reports to a report directory.
- In GitHub Actions, runtime state and generated reports are written under `/tmp` and the reports are uploaded as a workflow artifact.
