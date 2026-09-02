# TheRunBird — project overview

RunBird sells handmade Corvette C6 interior accessories (steering wheels, shift knobs, handbrakes, horn pads, emblems, door sills) through a CS-Cart storefront at therunbird.com. This repo is a **local working copy of hand-authored HTML/CSS/JS content blocks** — there is no build pipeline and no CI. Every file here gets pasted manually into CS-Cart's admin UI (Design > Layouts > Html+Smarty blocks, or Design > Themes > Editor > Custom CSS) by the site owner after Claude edits it locally. **Editing a local file never changes the live site by itself** — always tell the user which file changed so they know what to paste, and never assume a fix is live until they confirm.

For full working context (decisions, bugs found, in-progress status), see the persistent memory system at `~/.claude/projects/-Users-a0000-----------Cursor-therunbird/memory/` (index: `MEMORY.md` there) — this file is a static map of the repo, not a log of what's been done.

## Two parallel visual tracks

- **`Рабочий проект/`** — the live, dark-default site with a light/dark **toggle** (`data-rb-theme` attribute on `<html>`, persisted in `localStorage`). Two-gold-token palette (`--rb-accent` deepened for text, `--rb-accent-fill` = brand gold `#C8A84C` for filled surfaces). Shared CSS lives in `rb-work.css` (header/footer/native CS-Cart chrome) and `Калькулятор/Wizard/rb-assets/rb-cfg-theme.css`+`.js` (configurators).
- **`Рабочий проект светлый/`** — a **separate, permanently-light rebuild** (no toggle at all) requested 2026-08-31, meant to eventually replace the toggle system on the live site. White background, `#D1382A` red for every accent/button (same red for both text and filled surfaces — no two-token trick needed, unlike the gold system), white text on red-filled buttons, `#121212`/`#6E6A63` text tokens, `#FAF9F7` "elevated panel" off-white for section rhythm. **Scope**: only `.deploy.html` files get rebuilt for this track (not the per-block `*-v.1.html` source files that sit alongside them, except Homepage which was done block-by-block before that scope was clarified). Status and full palette/convention rules: see the `therunbird-light-variant-project` memory file.

Mirror the folder structure between the two tracks (`Хедер/`, `Футер/`, `Главная/`, `Страницы/<name>/`, `Калькулятор/Wizard/`) so a file's counterpart is easy to find by path alone.

## Repo layout

- `Рабочий проект/Хедер/`, `Футер/` — site header/footer. **CSS and HTML deploy to two separate CS-Cart locations**: the `*-nocss.html` (or `*-light.html`) file → the Html+Smarty content block; ALL of that section's CSS → the site-wide Custom CSS admin field (`rb-work.css` / `rb-work-light.css`), never inline in the content block. The `.deploy.html` files that combine both are a legacy/reference artifact, not what's actually live.
- `Рабочий проект/Главная/`, `Страницы/<Page Name>/` — homepage and static pages, each as one or more numbered `N-block-v.1.html` files plus a combined `*.deploy.html`.
- `Рабочий проект/Калькулятор/` — the 11 real product configurators (steering wheel, center emblem, airbag cover, door sills, 3 handbrake variants, 5 shift-knob variants) plus their photo galleries (`*-gallery.deploy.html`), SEO copy (`*-static-text.deploy.html`), and JSON-LD (`*-jsonld.deploy.html`). `Wizard/` holds the current step-by-step UX rewrite of each configurator (`configurator-*.wizard.html`) with shared theme CSS/JS in `Wizard/rb-assets/`. See `therunbird-wizard-pattern` and `therunbird-wizard-rollout` memory files for the UX spec and per-product conversion status.
- Files/folders explicitly **not** real option-configurators (skip when converting): `configurator-handbrake.deploy.html`, `configurator-shiftknob.deploy.html` (category hub pages), `configurator-preview.deploy.html`/`.html` (superseded steering-wheel drafts), `configurator-preview-gallery.deploy.html` (confirmed unused).
- `Рабочий проект/Custom Order/` — single-file `/custom-order/` landing page (category grid linking into every configurator, same tile design as the homepage's own category grid). `Рабочий проект/Track Order/` exists too (order-status lookup page) but has not been touched by either theme track yet.

## Critical, non-obvious gotchas

- **CS-Cart's CSS bundler mis-inlines `rgba(var(--x-rgb), Y)` / `rgb(var(--x-rgb))`.** When a custom property is declared in exactly one place, the bundler appears to attempt constant-folding and corrupts the result into near-black garbage at *build* time (not visible in a normal browser devtools check — `getComputedStyle` looks correct, but the compiled rule in `document.styleSheets` is wrong). Never write that pattern in any file that goes through CS-Cart's Custom CSS field or a content block — always bake the literal RGB value into the `rgba()` call instead. Grep any new/edited CSS for `rgba(var(` before calling it done.
- **A site-wide legacy rule** (`body, p, div, li, h1-h6 { color: #F0F0F0 }`, predating both theme tracks, likely from CS-Cart's own base theme) beats ordinary `color: inherit` on any element that doesn't declare its own `color` — because a direct match always wins over inheritance regardless of specificity. Any themed scope needs its own `color: inherit` reset for `div/p/li/h1-h6` to avoid invisible or wrong-colored text, especially on the light track where `#F0F0F0` (near-white) is illegible on a white page.
- **Mobile two-button CTA rows routinely don't fit** at naive sizing once button text is more than ~15 characters each — confirmed broken in several dark-track source files too, not just introduced by recoloring. Verify with `canvas.measureText` at the real font before shipping, don't eyeball it.
- Smarty blocks (`{if}`, `{nocache}`, `{literal}`) need the whole file (including comments) grepped for a bare `{word}` pattern before deploying — Smarty will try to parse it as a tag.

## Workflow expectations

- Work one item at a time; get local verification (or the owner's live-device check) before moving to the next, per the `therunbird-one-item-at-a-time` memory file — batching is only safe once a reference implementation for that *kind* of change has already stabilized.
- Ask the owner for the exact CS-Cart admin panel location before clicking around in admin — they know the panel well.
- SSH (`ssh therunbird`, pre-configured) is available for static files outside the CS-Cart admin workflow (e.g. `rb-assets/*.css`/`.js`, `llms.txt`, `robots.txt`). Cloudflare cache purge is available via a scoped API token — purge after editing an origin static file.
