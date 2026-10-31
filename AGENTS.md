# WhiteSheep Game Studio Website — AGENTS.md

## 1. Mission and authority
- This repository is the **single official public website** for WhiteSheep Game Studio: https://whitesheep-game-studio.github.io/.
- Work as a careful maintainer of a small static website. Preserve existing published links, factual statements, and app-specific legal notices.
- Before modifying files, read `README.md`, `build.py`, `style.css`, `directory.js`, `i18n.js`, `apps.json`, and the affected `content/<slug>/` files.
- Prefer small, reversible, reviewable changes; do not perform unrelated refactors or overwrite concurrent changes.
- Never fabricate launch status, features, store listings, downloads, pricing, reviews, certifications, processing practices, legal approvals, or developer/company details.

## 2. Repository ownership and generated output
- **Source of truth:** `build.py`, `apps.json`, `content/<slug>/*.html`, `assets/`, `style.css`, `directory.js`, `i18n.js`, and this document.
- **Generated deployment artifacts:** `docs/` (GitHub Actions builds and publishes this folder as a Pages artifact). Never edit only `docs/`: generated files are not the source of truth.
- Run `python build.py` and `python check_site.py` locally when possible. CI runs both on each `main` push; commit sources, not regenerated `docs/` output.
- Preserve `docs/.nojekyll`, `robots.txt`, `sitemap.xml`, canonical URLs, and the required `/apps/<slug>/` page structure.
- Keep `main` deployable; check the Pages result after publishing, not only the Git commit.

## 3. Design system and UI quality
- Match the established warm off-white, deep forest green, muted gold, restrained typography, generous whitespace, and minimal decorative style.
- Reuse `style.css` variables (`--ink`, `--paper`, `--line`, `--gold`, `--muted`) and existing components before adding new variants.
- Keep the language selector as a compact globe-style header dropdown (한국어 / 日本語 / English), with clear current selection and a checkmark. Do not imitate external themes at the expense of this website's visual identity.
- Support desktop and mobile widths, touch targets, keyboard focus, Tab, Escape, visible focus, meaningful accessible labels, and `prefers-reduced-motion`. Avoid layout shift and horizontal overflow.
- Semantic HTML, exactly one meaningful `<h1>` per page, informative alt text for content imagery, and a working skip link are mandatory.
- No unnecessary frameworks, external JS/CSS/CDN, web fonts, analytics, trackers, or inline secrets.

## 4. Internationalization (i18n) — mandatory
- Supported locale codes: `ko`, `ja`, `en`. Korean is the authored fallback. Browser language can choose the first locale; explicit user choice wins and persists in `localStorage`.
- The selector must appear on **all** pages and work without navigating away. Set `<html lang>` correctly and keep keyboard/ARIA behavior intact.
- All public UI strings must be translated, including navigation, hero/CTA, descriptions, app cards, search/filter labels, result counts, support pages, privacy pages, titles, meta description, image alt text, placeholders, accessibility labels, and errors.
- **No fake coverage:** if a string lacks a verified translation, retain the Korean source; never silently replace legal or policy text with a generic summary. Treat legal/privacy/source notices as high-risk content requiring faithful translation and manual review.
- Maintain translations in `i18n.js` or an explicitly documented, build-integrated locale resource. Prefer stable translation keys to fragile source-text matching when expanding the site. Never alter proper nouns, email addresses, technical versions, license names, or URLs as a side effect.
- Remember that `directory.js` dynamically updates counts: counts and empty states must be localized too. User search must remain functional in all supported locales and must not send queries to servers.
- Every new feature/app/page must include Korean, Japanese, and English strings **in the same change**. If full translation is not ready, document the gaps prominently and do not claim the page is fully multilingual.
- Store only a non-sensitive language preference in the browser; reflect that behavior in the privacy notice where accurate.

## 5. App registry and app-specific pages
- Add a new app by creating a unique, stable lowercase ASCII `slug` in `apps.json`, then add `content/<slug>/index.html`, `support.html`, `privacy.html`, and `sources.html`, plus `assets/<slug>/` as necessary.
- Use actual supported platforms and honest release stages. Never mark an unlaunched project `출시` or link a nonexistent store listing.
- Do not break established URLs or change a slug without redirect/migration planning.
- Present the studio as the umbrella developer brand while distinguishing operator identity, game/app-specific terms, policies, and app-specific support requirements.
- Do not publish private code, unreleased confidential information, keys, API tokens, personal documents, or third-party artwork without rights.

## 6. Legal, privacy, credits, and safety
- Do not merge the website notice and individual apps' privacy notices; they cover different data flows. Preserve the explicit **draft / pre-release** status where it applies.
- Changes to cookies, localStorage, email contact, SDKs, analytics, advertisements, signup, forms, data retention, or third-party transfers require updating the relevant privacy disclosures and checking applicable requirements before release.
- Preserve attribution, license URLs and credit details for EDRDG/JMdict, Wiktionary, Unicode, and any future third-party assets; don't imply endorsements.
- Never assert legal compliance or final store readiness without confirmation.

## 7. Validation and definition of done
1. Inspect current branch and changes. Avoid accidental unrelated edits.
2. Update source code and full `ko/ja/en` text/metadata as required.
3. Run `python build.py` and `python check_site.py`; address all failures.
4. Check HTML title/meta/lang, canonical URL, one `h1`, links, image loading, keyboard and mobile layout, and language persistence across pages.
5. Exercise all three languages, especially app cards, search/filter/count, and privacy/support/source pages. Do not report partially translated legal pages as complete.
6. Verify generated `docs/` locally when possible; CI will build and deploy it. Commit source changes with a conventional message (`feat(i18n): ...`, `fix(site): ...`, `docs: ...`).
7. Check deployed GitHub Pages URL, and report the commit, files changed, tests run, and any unresolved limitations honestly.

## 8. Preferred maintenance conventions
- Use short descriptive identifiers; keep Python readable (standard library unless a dependency is justified). Favor plain JavaScript and CSS over framework migration.
- Keep content, presentation, and behavior separated. Avoid duplication across individual app pages; use shared templates where possible.
- Leave the email and site origin unchanged unless the site owner requests it.
- When requirements conflict, favor accuracy, accessibility, privacy, URL stability, and preserving existing working behavior over visual novelty.

## 9. Frontend quality gates and CI/CD
- Mandatory tools: Vitest (unit tests), Playwright (desktop/mobile browser tests), axe-core (WCAG accessibility checks), ESLint (JS lint), Prettier (formatting), html-validate (generated HTML), Lighthouse CI (performance/SEO/accessibility audit), and Dependabot (dependency update PRs).
- All PRs into `main` run the same verification job as deployment: build → internal links → lint → formatting → HTML → Vitest → Playwright/axe → Lighthouse. Only a passing `main` workflow deploys GitHub Pages.
- Use `npm ci`, `npm run lint`, `npm run format:check`, `npm run html:check`, `npm test`, `npm run test:e2e`, and `npm run i18n:check`. Run `python build.py` before testing generated HTML.
- Every i18n or layout bug fix must include a regression test that fails without the fix. Test Korean, Japanese and English plus persisted language preference; check mobile overflow and dropdown keyboard behavior.
- Lighthouse score budgets start as warnings while baseline is established; do not claim scores are enforced deployment blockers until thresholds are explicitly raised to errors.
- Dependabot PRs are subject to the same tests and must not auto-merge without successful checks.
- Prefer PR verification before merging; protect `main` with a required passing `verify` check where repository permissions allow it.
- Preserve the common workflow/helper full SHA pair, stable verify gate, and main-only Pages deployment. Publish only the static artifact that passed all checks; do not rebuild after verification.
- `.ci/i18n-known-gaps.json` is an explicit inventory of existing authored Korean fallbacks, not approval or complete localization. Never regenerate it in CI, add new gaps silently, copy Korean into other locales as fake translations, or remove legal notices to satisfy coverage.
- Review security overrides against actual upstream advisories and rerun all affected tools; retain the lockfile and mandatory OSV audit. Report actual CI, coverage gaps and deployment state separately.

## Supported runtime and dependency policy

- Before installing or upgrading a runtime, SDK or package, check its official release, support schedule, security advisories and compatibility with this repository.
- Where LTS exists, prefer the latest supported LTS with current security patches. Otherwise prefer a supported stable release. Do not assume a larger version or an older LTS is automatically safe.
- If an unresolved advisory affects the preferred version, assess actual exposure and use a supported safe alternative; record the reason and conditions for reassessment.
- Verify downloads using TLS and official checksums/signatures. If release, advisory or integrity information cannot be verified, defer the version change and report the blocker.
- Preserve existing pins, lockfiles, user changes and required checks. Authorized upgrades must update SDK/CI/dependency pins and lockfiles together in a reviewable PR and run relevant tests and representative builds.
- Record exact verified versions and lockfiles for new projects. Never install an unverified latest version on every startup or bypass a failed security/build check.
- Report local tests, remote CI, platform builds and unrun checks separately. Do not merge, deploy, publish or release without the user's explicit instruction.
