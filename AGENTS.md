# R.O.S.T. website conventions

This checkout is the Astro site at `D:/WWW/R.O.S.T/ai/Web`.

For changes to UI, read `docs/UI_SYSTEM.md` first. The longer-term content/template plan is `docs/SITE_SYSTEM.md`; its proposed and implemented parts are explicitly distinguished.

Latest user feedback and overrides: `docs/UI_FEEDBACK_2026-10-20.md`. These remarks were implemented and deployed on 2026-10-20; photo placeholders were subsequently replaced with user-provided event photographs. They take precedence over older UI proposals: no added breadcrumbs; use the existing eyebrow role and a middle dot as a label separator. Display prices as `€29` (project convention), and do not use em dashes in user-facing project copy. Do not mechanically alter program syntax, URLs or stored payment amounts to enforce editorial rules.

- Reuse `src/components/ui/Heading.astro`, `Button.astro`, `PageIntro.astro` and `CtaSection.astro` for their documented roles. Keep appearance in shared components and `src/styles/ui.css`; page classes control placement, not new copies of typography/button styles.
- Preserve existing RU/DE copy, public routes, form IDs/names, native inputs, client handlers, provider flows and consent behavior unless the task explicitly changes them.
- Keep mobile/tablet page headings centered and body/forms left aligned. Use the shared container once per section.
- New exceptions require a named purpose/variant and a documentation update. Do not create a per-event font size or hard-coded positional adjustment.
- Penpot snapshots in the audit are historical evidence, not automatically current content or an instruction to restore old prices/layouts.
- Verify proportional to the change. UI behavior and responsive conventions are covered by `tests/browser/ui-system.spec.ts` and the existing browser suite. Local validation, publication and real provider transactions are different outcomes.

Release requirement: before a separately authorized deployment, follow `docs/RELEASE_CHECK_2026-10-20.md`. Verify the live D1 binding and payment modes, preserve existing records, and do not reset/seed the database. Local tests do not prove a real provider transaction.
