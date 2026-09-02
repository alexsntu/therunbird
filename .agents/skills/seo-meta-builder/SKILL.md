---
name: seo-meta-builder
description: Generate SEO/GEO/AEO-optimized titles, H1s, meta descriptions, page copy, FAQ content, and structured-data proposals for therunbird.com pages, using SERP research, competitor gap analysis, USP demand-filtering, and semantic-core building tuned to this store's real brand facts. Use when asked to write or optimize a title, H1, meta description, category/product page copy, FAQ answers, or schema.org markup for therunbird.com — for one page or a batch.
allowed-tools: WebSearch, WebFetch, Read, Grep, Glob
---

# SEO Meta Builder — RunBird (therunbird.com)

Adapted from a Yandex/Russia-focused sibling skill (GOODMi `seo-meta-builder-v2`). All Yandex/Wordstat/dual-geo/Cyrillic logic has been replaced with Google-only, US-market equivalents. The CS-Cart platform constraints (255-char description hard cap, avoid `@graph`/`FAQPage` unless independently verified against this theme) carry over because the platform is the same.

## Brand constants (fixed — do not re-derive or ask again)

```
Store name:      RunBird  (tagline: "Feel the Drive")
Site:             https://therunbird.com
Since:            2014
Niche:            handmade Corvette C6 accessories — steering wheels, shift knobs,
                  horn pads / airbag covers, handbrakes, door sills, center emblems
Geo:              nationwide US shipping; sourced/shipped from abroad — no domestic-
                  manufacture claim, no state/city to spotlight
Contact:          store@therunbird.com
Order flow:       order placed -> email confirmation -> team confirms build details with
                  customer -> deposit taken -> master hand-crafts the piece (3-14 days,
                  varies by product) -> real photos of the finished piece sent for
                  customer approval BEFORE shipping -> ships with tracking (2-3 weeks
                  transit) -> customer receives
Approved USPs:    handmade / made-to-order (not stock-pulled) / top-tier materials only /
                  real photo approval before shipping / in business since 2014
Prohibited:       NEVER claim "licensed", "OEM", "original", or any Chevrolet/GM
                  affiliation or endorsement — RunBird is an independent aftermarket
                  atelier, not associated with the automaker. NEVER claim domestic
                  ("Made in USA") manufacturing — items ship from abroad. NEVER invent
                  review counts, ratings, or customer numbers not present on the page.
```

If a task needs a fact not listed here (a specific product's material, price, or year-compatibility), pull it from the live product page or the matching `configurator-*.deploy.html` file — do not guess.

## Search engine priority: Google only

One channel matters for this store: **Google** (Bing/Yahoo are noise at US e-commerce scale — don't optimize for them unless asked). Title length target is **50–65 characters**, not because Google truncates ranking value past that point (it doesn't — the full title is indexed) but because that's roughly where the SERP visually clips. Never cut a real keyword short just to fit; let the trailing `| RunBird` be what clips if something has to give.

## Geo strategy: none

No state/city belongs in H1 or title — this is a nationwide, ships-from-abroad business with no facility to spotlight. "Ships nationwide across the US" is a legitimate USP line in a description; a fabricated hometown or "Made in USA" is not.

---

## Workflow

### Step 1 — Parse the request
Identify: page type (category / product-variant page / informational-FAQ), single page or batch, and whether the user supplied keyword data already. If batch, note it now — cannibalization checking happens in Step 4.

No multi-brand blocker needed: RunBird sells only its own handmade output under one brand. (If third-party/partner products ever enter the catalog, add competitor-official-store flagging back in.)

**Batch / product-family reuse**: if the batch is multiple pages of the same product family (e.g. the steering-wheel Year/Shape variants, or the shift-knob classic/ball/drift/cap/boot variants), run Steps 2, 2c, and 2d **once** against the shared parent category and reuse that competitive landscape for every variant page. Only re-run fresh SERP research for a variant that targets a meaningfully different search term (e.g. "F1-shape" vs "D-shape" are distinct enough to deserve their own Step 2 pass; "classic" vs "ball" shift-knob shape usually isn't). This keeps a 5-page batch from doing 5x redundant research.

### Step 2 — SERP research (WebSearch)
Run, in English:
1. `"buy [product] c6 corvette"` — direct commercial intent
2. `"[product] corvette c6 accessories"` — category-level variant
3. `"custom [product] corvette c6"` / `"[product] c6 corvette handmade"` — the handmade angle RunBird actually differentiates on
4. `"how to choose [product] for c6 corvette"` — informational seed for FAQ/AEO

**Exclude from title analysis**: amazon.com, ebay.com, walmart.com, and generic parts marketplaces. **Do not auto-exclude Etsy** — handmade sellers there can be genuinely relevant competitors for this niche; judge case by case.

Build the competitor list from what actually shows up in SERP — there is no fixed starter list for this niche.

**Selection procedure** (pool results from all 3 commercial queries above, then narrow):
1. Pool the organic results across all 3 queries; drop the excluded marketplaces.
2. **Dedupe by domain, weight by repeat appearance** — a domain showing up across 2–3 of the queries is a stronger competitor signal than one appearing once; prioritize repeats.
3. **Relevance filter** — the result must actually sell/cover this specific product for the C6 specifically, not generic Corvette parts, a different generation (C5/C7/C8), or an unrelated accessory category. Drop anything that only nominally matches the query.
4. Take the top 3–5 domains from that ranked, filtered pool forward into Step 2c's gap-analysis table.

### Step 2b — Demand estimate (no Wordstat available)
Google/Yandex-style keyword-volume tools aren't available here, so use these in order:

1. **SERP frequency** — how often a candidate keyword appears in the title/H1 of the real top-10 competitors:

   | Frequency in competitor titles/H1 | Weight |
   |---|---|
   | 3+ mentions | ~50 — title candidate |
   | 1–2 mentions | ~20 — description candidate |
   | 0 mentions | <15 — skip |

2. **Google Trends** (manual, relative only) — compare phrasing variants against each other (e.g. "corvette c6 shift knob" vs "corvette c6 shifter knob"). This is a relative comparison between candidates, never an absolute demand number.

3. **Google Autocomplete / People Also Ask** — the USP demand filter. Type `[term] + [candidate USP]` into Google search; if autocomplete or PAA surfaces the combination, the phrase has real demand and earns a slot in the description. If not, that space goes to a concrete product spec (material, year/trim compatibility) instead of an unproven marketing phrase.

### Step 2c — Competitor gap analysis

**Minimum sample**: analyze at least **3, ideally 3–5**, relevant organic results (after excluding the marketplace/agg list in Step 2, minus any judgment call on Etsy). If the SERP yields fewer than 3 genuinely relevant competitors — real risk in this niche, since C6-specific handmade sellers are thin — say so plainly in the output ("thin competitive field — only N direct competitors found") instead of padding the table with loosely-related big-box results.

**How to actually fill each column** (a search snippet alone is not enough for most of these):
- *H1/title pattern* — the SERP snippet's displayed title is Google's rendering, not necessarily the page's real `<title>` or `<h1>`. WebFetch the page directly for anything going in the gap table, not just "if the snippet is too thin."
- *Schema types seen* — WebFetch converts pages to markdown and **will not reliably surface `<script type="application/ld+json">` content** — don't rely on it for this column. Instead use the visible proxy signals actually present in the SERP itself: a star-rating widget in the snippet implies `Review`/`AggregateRating`; a breadcrumb trail implies `BreadcrumbList`; a price/availability line implies `Product`/`Offer`. If no rich-result signal is visible in the SERP and WebFetch doesn't surface a JSON-LD block in its markdown output, mark the cell `"not detectable via WebFetch"` rather than guessing yes/no. (A rigorous raw-HTML schema audit is out of scope for this skill — that's what `Codex-seo-ai:seo-schema-jsonld` is for, on RunBird's own pages.)
- *FAQ present?* / *USP claimed* / *Concrete numbers used* — these read fine off the WebFetched page content directly.

| Competitor | H1/title pattern | FAQ present? | Schema types seen | USP claimed | Concrete numbers used | Exploitable gap |
|---|---|---|---|---|---|---|

The gap column is the point — what's missing across competitors that RunBird can legitimately claim (handmade craftsmanship detail, photo-approval-before-ship, material specificity) becomes the differentiator in Step 3.

### Step 2d — Informational SERP (for AI Overviews / ChatGPT Search / Perplexity)
Run:
1. `"how to choose [product] for c6 corvette"`
2. `"best [product] for corvette c6 [year]"`
3. `"[product A] vs [product B] corvette c6"`

Goal: find informational queries RunBird could be cited for by AI answer engines. In a niche handmade segment, competition for informational content is thinner than in mass-market accessory categories — the AI-citation opportunity here is real, not aspirational filler.

### Step 3 — Generate the tags

**H1** — natural language, includes the primary keyword and, when relevant, the year/trim split that actually matters for this store's products (e.g. 2007-2011 vs 2012-2013 audio-option split on steering wheels — check the live configurator before asserting a compatibility claim). One H1 per page, matches the page's actual topic.

**Title** — 50–65 chars. Primary keyword first, brand (`| RunBird`) last and expendable if length forces a cut. AEO pattern: front-load the noun phrase a voice assistant or AI Overview would read back verbatim.

**Meta description** — CS-Cart hard limit is **255 characters**; target **180–250**. Lead with the concrete differentiator (handmade / material / lead time), not a generic adjective. Weave in an Autocomplete/PAA-validated USP phrase only if Step 2b confirmed demand for it; otherwise use a real product spec instead.

**E-E-A-T mapping** (fill from the brand constants above, never invent):
- *Experience* — "handcrafted since 2014"
- *Expertise* — "Corvette C6 accessory specialists" / "in-house atelier"
- *Authoritativeness* — only if there's an actual mention in a Corvette forum/club/press piece; otherwise omit the claim rather than pad it
- *Trustworthiness* — "real photos of your build sent for approval before we ship" (this is RunBird's strongest, most differentiated trust signal — it directly maps to the "Recent builds" photo galleries already built into the configurators; use it)

**USP demand-filter table** (apply Step 2b's Autocomplete/PAA test to every candidate USP before it goes in a description):

| USP candidate | Autocomplete/PAA signal? | Verdict |
|---|---|---|
| e.g. "made to order" | yes/no | use in description / drop, use a spec instead |

**AEO answer block** (category and FAQ-type pages — write this directly, don't just defer to another tool):
- Every question-style H2/H3 on the page is immediately followed by a **self-contained 40–60 word direct answer** — the sentence a voice assistant or AI Overview could read back verbatim without needing surrounding context.
- Keep each answer passage **~134–167 words total** including the direct-answer sentence, self-contained (no "as mentioned above," no pronoun that only resolves by reading a different section).
- Source the question itself from Step 2d's informational SERP or Step 2b's PAA results — don't invent a question nobody is actually asking.
- This is the same numeric spec the installed `Codex-seo-ai:seo-geo-answerblocks` skill (module M11) checks for when *auditing* an existing page — writing to it here means a later audit pass should find nothing to fix.

### Step 4 — Pre-output checklist
- [ ] Title 50–65 chars, primary keyword leads, brand tail is what would clip
- [ ] Exactly one H1, matches page topic, no keyword stuffing
- [ ] Meta description 180–250 chars, hard cap 255, no truncated word at the boundary
- [ ] AEO answer-block present on category/FAQ-type pages — 40–60 word direct answer immediately after each question heading, ~134–167 word self-contained passage, question sourced from real Step 2d/2b data
- [ ] Competitor gap analysis covered at least 3 relevant results, or the output honestly flags a thin competitive field instead of padding
- [ ] "Schema types seen" cells are either sourced from a real visible signal (SERP rich result or WebFetched markdown) or marked not-detectable — never guessed
- [ ] No "licensed" / "OEM" / "original" / GM-affiliation language anywhere
- [ ] No "Made in USA" or fabricated domestic-production claim
- [ ] Every USP claim traces back to the Brand constants block or a page-specific fact actually on the page — nothing invented
- [ ] No fabricated review counts, ratings, or customer numbers
- [ ] Batch runs only: no duplicate title/H1 across pages (cannibalization check), no keyword-stuffed synonym spam

### Step 5 — Output format
Output each field in its own fenced code block, ready to copy-paste — do not write these into site files unless separately asked to:

```
H1: ...
```
```
Title: ...
```
```
Meta description: ...
```

If a JSON-LD proposal is in scope, put it in its own fenced `json` block. For `sameAs` on Organization/LocalBusiness schema: use a real verified Google Business Profile or social account if one exists; if none exists yet, omit the field rather than inventing a URL. (Structured-data generation and validation for Tier-1 types is also covered in depth by the installed `Codex-seo-ai:seo-schema-jsonld` skill — prefer delegating full schema audits/generation there and use this skill's JSON-LD output only for the specific block tied to the copy just generated.)

### Step 6 — Semantic core (batch / site-wide runs)
- Lowercase, no punctuation — standard for Google Search Console just as it was for Yandex Webmaster.
- Tier by intent, not by market:
  - 🎯 **Tier 1** — primary target, goes in title/H1: high commercial intent, real coverage gap in Step 2c
  - 👁 **Tier 2** — monitor, goes in description/body copy: moderate frequency in competitor titles
  - **Tier 3** — long tail: sourced from Autocomplete/PAA, goes into body copy, FAQ, and alt text — never into H1/title
- Drop anything modeled on GOODMi's Russian-market terms (рассрочка/трейд-ин and similar) — if RunBird ever offers financing/layaway, add the real equivalent then, don't carry over a placeholder.
- **Tracking**: this project uses Google Search Console only (no Ahrefs/SEMrush/PixelPlus equivalent) — describe the manual GSC check as the tracking step, don't invent an API push.
- **Monitoring AI answers**: check Google AI Overview and ChatGPT Search for citation of RunBird content on the informational queries from Step 2d — same checklist logic as the original, just swap the two engines being watched.
