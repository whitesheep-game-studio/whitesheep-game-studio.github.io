# Node.js 26.13.1 security verification — 2026-11-13

Node 26.13.0 -> 26.13.1 LTS in .nvmrc, package engines, root lockfile metadata and README.
Resolved npm package versions are unchanged. The reusable workflow and automation-ref both
point to `ca73ec9d2b603fbde13cb9c55688c6ea0ede12da`. Existing verification gates, action SHAs and Pages deployment rules are preserved.
Official security release: https://nodejs.org/en/blog/release/v26.13.1
Windows x64 ZIP SHA-256 verified against the official SHASUMS256.txt:
`e2edda75bfb089654705cf65a13b58933bfd5f57148e8ebda916f58a2474f1f7`.

Local evidence, verified Node v26.13.1 / npm 11.20.0, Python 3.13.17, Windows:
- PASS: npm ci --no-audit --no-fund.
- PASS: python build.py; python check_site.py; Python unittest discovery (2 tests).
- PASS: ESLint, Prettier, html-validate, Vitest (10 tests).
  Prettier initially rejected CRLF Windows checkout files; local LF normalization passes
  without unrelated tracked content changes.
- PASS: npm run i18n:check; common i18n structure validation (272 keys, ko/ja/en).
  Existing Korean fallback inventory remains; this is not translation approval.
- PASS: live OSV audit of 473 resolved npm packages, no advisories at scan time.
- PASS: Playwright 1.64.1 / axe, 18/18 desktop + mobile tests with two workers.
  Initial local Python HTTP server runs intermittently refused JS resource connections
  (net::ERR_CONNECTION_REFUSED). A local-only ThreadingHTTPServer with backlog 128,
  bound to 127.0.0.1:8765, passes the unchanged suite; no test assertions or retries changed.
- PASS: Lighthouse collect/assert for two URLs; existing warning thresholds retained.
  The configured public upload was not run.
- PASS: actionlint on the caller workflow; common workflow policy validation, Ruff and
  actionlint. ShellCheck NOT RUN.
- FAIL/ENVIRONMENT ERROR: common helper unittest suite, 48/51 passed and 3 symlink
  creation errors (Windows WinError 1314). No tests or security controls were disabled.
- NOT RUN: actual GitHub Actions/Linux integration, independent Claude review, deployment.

Commit uses [skip ci] to avoid starting automatic Pages deployment. Generated docs/ output
is excluded from this security commit. Full common evidence: docs/security-node-20261113.md
in whitesheep-game-studio-public at the paired SHA above.
