# SAI360 Regulatory & Legislative Content — Claude.ai Context Pack

> **How to use this file:** Upload this file to a Claude.ai Project. Every
> conversation in that project will then have the context to help you write
> sales collateral, emails, battle cards, objection handlers, talk tracks,
> pitch-deck copy, and so on.
>
> **Before using this for real customer-facing collateral, fill in the
> sections marked `[FILL IN: ...]` — those are things only SAI360 internal
> teams can confirm.** Nothing in this pack is a substitute for product
> marketing / legal review of final collateral.

---

## 1. Product summary (30-second version)

**SAI360 Regulatory & Legislative Content** is a continuously-updated
content subscription for compliance and risk teams at regulated firms. We
track what regulators do (enforcement actions, rule changes, guidance,
consultations), what the rules currently say (consolidated rulebooks), and
what trading venues require (exchange rules) — across 107 countries.

Customers consume it via API into their own GRC platform, or via the
SAI360 GRC platform itself.

**The three things we actually sell:**
1. **Regulatory Content** — regulator-notice stream (enforcement, rule
   proposals, guidance, no-action letters, speeches, bulletins). Priced
   per regulator tracked.
2. **Legislative Content** — bills, statutes, legislative tracking.
   Priced per jurisdiction tracked.
3. **Bundle add-ons** — Consolidated Rulebooks and Exchange Rules, flat
   annual fee each.

---

## 2. Coverage universe (as of latest build)

| Tier | Count | What it is |
|---|---|---|
| Regulators | **1,291** | Regulatory agencies whose publications we track |
| Consolidated rulebooks | **312** | Publishers whose full rulebook text we ingest |
| Legislative bodies | **51** | Federal and state legislatures we cover |
| Exchanges | **39** | Stock, clearing, and derivatives exchanges |
| **Jurisdictions (countries/territories)** | **111** | |

**Regulators by region:**

| Region | Regulators |
|---|---|
| Americas | 824 |
| EMEA | 296 |
| APAC | 170 |
| Global / International | 13 |

**Top 10 jurisdictions by regulator count:**

1. United States — 733 (federal + 50 states + territories incl. DC, Puerto Rico, USVI, Guam, American Samoa, CNMI)
2. Canada — 43
3. Switzerland — 21
4. Australia — 20
5. New Zealand — 17
6. United Kingdom — 17
7. European Union — 14
8. Hong Kong — 14
9. International / supranational — 13
10. Singapore — 13

US coverage is especially deep — banking, securities, insurance, healthcare
(HHS, CMS, FDA, NIH, OCR), energy (EPA), data privacy, and consumer
protection at both federal and state level, plus all 50 state legislatures.

Numbers rebuild automatically each deploy from a master spreadsheet, so
they may drift slightly upward over time.

---

## 3. Pricing model

### Regulatory Content (priced per regulator)

| Tier | Price (annual, USD) | SKU |
|---|---|---|
| up to 10 Regulators | $8,000 | SUBS_PL_RC_10R |
| up to 30 Regulators | $20,000 | SUBS_PL_RC_30R |
| up to 60 Regulators | $40,000 | SUBS_PL_RC_60R |
| \>60 Regulators | Custom | SUBS_PL_RC_60R |

### Legislative Content (priced per jurisdiction)

| Tier | Price (annual, USD) | SKU |
|---|---|---|
| up to 10 Jurisdictions | $1,000 | SUBS_PL_LC_10J |
| up to 25 Jurisdictions | $5,000 | SUBS_PL_LC_25J |
| up to 50 Jurisdictions | $10,000 | SUBS_PL_LC_50J |
| \>50 / International | Custom | SUBS_PL_LC_IJ |

### Flat bundle add-ons

| Bundle | Price (annual, USD) | SKU |
|---|---|---|
| Consolidated Rulebooks | $5,000 | SUBS_PL_RB_ADD |
| Exchange Rules | $5,000 | SUBS_PL_EX_ADD |

**All prices are list, annual subscription, USD.** Custom-tier engagements
are scoped by the account team.

---

## 4. The three tiers explained (for positioning / objection-handling)

These three are often confused — here's how to talk about them:

- **Regulators = the news feed.** The regulator tells you "here's a new
  rule" or "we fined Goldman $40M". It's where *urgency* lives. High
  volume, time-sensitive. This is our primary value driver.
- **Rulebooks = the textbook.** The static body of rules, searchable and
  versioned. "What does Rule 3.4.1 say right now?" Reference content that
  makes regulator alerts actionable — you can't interpret "enforcement
  under Rule 3.4.1" without the rulebook.
- **Exchanges = the house rules.** Trading venues (NYSE, CME, LSE) aren't
  regulators but have binding rules for participants. Critical for
  broker-dealers and capital-markets firms.

**Pricing rationale:** Regulators are per-item because the volume of
alerts scales with coverage. Rulebooks and exchanges are flat bundles
because they're reference material — you either want the library or you
don't.

---

## 5. Buyer personas

Three patterns we see repeatedly in the pipeline:

### 5a. Regional US bank
- **Buyer titles:** CCO, Compliance Officer, Head of Regulatory Affairs
- **Coverage footprint:** ~15 regulators (Fed Board, CFPB, FDIC, OCC,
  NCUA, FFIEC + 8-12 state banking departments), ~5 jurisdictions for
  legislation
- **Bundles:** Rulebooks yes, Exchanges no
- **Typical annual price:** ~$25K ($20K regulatory + $1K legislative + $5K rulebooks)
- **Pain:** 50-state compliance is brutal, CFPB and state enforcement
  changes weekly, no time to manually track

### 5b. Global asset manager
- **Buyer titles:** Global Head of Compliance, CCO, Head of Regulatory Change
- **Coverage footprint:** ~75 securities + banking regulators across
  US/UK/EU/APAC hubs, ~40 jurisdictions for legislation
- **Bundles:** Rulebooks yes, Exchanges yes
- **Typical annual price:** ~$60K-$80K (often custom tier for regulators)
- **Pain:** Running a single compliance team across 12 regulatory
  regimes; cross-border coordination; consolidated-rulebook lookup

### 5c. EMEA insurer
- **Buyer titles:** Chief Risk Officer, Head of Regulatory Affairs
- **Coverage footprint:** ~25 European insurance + prudential
  regulators, ~15 jurisdictions for legislation
- **Bundles:** Rulebooks yes, Exchanges no
- **Typical annual price:** ~$25-30K
- **Pain:** Solvency II changes, EIOPA guidelines, fragmented national
  supervisors

Other common patterns: **broker-dealers** (all three tiers), **crypto
exchanges** (regulators + exchange rules), **energy traders** (CFTC/FERC
+ CME/ICE exchange rules).

---

## 6. Key differentiators / "why SAI360"

*[FILL IN: Product marketing to confirm/refine — what's been most
resonant in the pipeline lately? Below are reasonable defaults drawn from
the product shape.]*

- **Scope**: 766 regulators across 107 countries is among the broadest
  coverage in the market
- **Integrated delivery**: API into your own GRC, OR consumed inside the
  SAI360 GRC platform (no separate tool to buy)
- **Rulebooks are consolidated**: 312 publishers with full text, versioned,
  mapped to regulator alerts — so enforcement notices link directly to the
  rule cited
- **Expanding continuously**: we add 20-30 new regulators per quarter
  based on customer requests (typical 4-6 week scoping)
- **Legislative tracking included**: most competitors treat legislation
  as a separate product; we offer it at low entry tiers ($1K for 10
  jurisdictions)

*[FILL IN: Competitor positioning — we believe we're differentiated vs.
RegAlytics / Thomson Reuters Regulatory Intelligence / Compliance.ai on
(a) ..., (b) ..., (c) ...]*

---

## 7. Common objections + answers

**"What if you don't cover the regulator we need?"**
> We add 20-30 regulators per quarter by customer request. Scoping is
> typically 4-6 weeks from request to live coverage. The coverage map at
> [YOUR SITE URL] shows everything live today, and a "Request coverage"
> button sends it directly to the account team.

**"How fast does content update?"**
> *[FILL IN: real SLA number — typically something like "median 4 hours
> from publication to platform"]*

**"How does API delivery work?"**
> *[FILL IN: brief description of API — webhooks? pull endpoints?
> JSON schema? SAML/OAuth auth?]*

**"Can we add regulators mid-contract?"**
> *[FILL IN: Is this allowed? At what pricing — pro-rata? Custom-quoted?]*

**"We already use [Thomson Reuters / RegAlytics / Ascent / Compliance.ai]
— why switch?"**
> *[FILL IN: Specific competitive positioning]*

**"Is the data feed something we can evaluate before committing?"**
> *[FILL IN: Trial / POC offer details — length, scope, conditions]*

**"What about data residency / GDPR?"**
> *[FILL IN: where the service is hosted, data processing agreements,
> certifications like SOC 2 / ISO 27001]*

---

## 8. Discovery questions (for first calls)

Use these to pick which persona / tier to pitch:

1. "How many regulators does your compliance team actively track today?"
2. "Which jurisdictions do you operate in, and which are the most painful
   from a regulatory-change standpoint?"
3. "How do you currently learn that a regulator has published something
   new? Manually? Email alerts? A vendor feed?"
4. "Do you need the rule text itself, or just notifications that
   something changed?"
5. "Are you a trading firm? If so, which exchanges do you need rule
   coverage on?"
6. "Do you have an API / GRC platform you'd want to feed this into, or
   would you use our UI?"
7. "Rough team size on compliance? Who'd be the primary consumer of the
   feed?"
8. "What's driving the evaluation right now — new regulation, audit
   finding, vendor consolidation, something else?"

---

## 9. Live demo asset

There is a live interactive coverage + pricing site at:

> **[FILL IN: the deployed URL, e.g. https://sai360-coverage.vercel.app]**

It supports:
- Coverage map (click any country to see full tier breakdown)
- Plain-language search ("banking regulators in canada", "securities
  regulators in APAC") — handles multilingual topic terms
- Tier / region filters
- "Add to cart" selection on any regulator
- Interactive pricing calculator with auto-tier-matching + bundle toggles
- Persona presets (Regional US bank / Global asset manager / EMEA insurer)
- Copy-quote-to-clipboard feature that outputs a plain-text summary with
  SKUs + the full list of selected regulators
- "Request coverage" CTA that opens an email to the account team

**Demo flow (20 minutes):**
1. Open Coverage page, show the world map, click a country to show the drawer
2. Demonstrate plain-language search (e.g. "banking regulators in
   canada")
3. Click "+ Add all N regulators" on 2-3 countries relevant to the
   prospect
4. Click Content Pricing tab — the cart flows through automatically
5. Toggle on Rulebooks and Exchanges bundles
6. Hit Copy Quote, paste into email sent live on the call
7. Demonstrate the "Request coverage" CTA as an objection handler

---

## 10. Writing / tone guidance

When drafting collateral, default to:

- **Short, declarative sentences.** Compliance buyers are busy and skim.
- **Specific numbers.** "766 regulators across 107 countries" beats "broad coverage".
- **Buyer's words over vendor's words.** Call regulators "regulators," not
  "regulatory sources." Call rulebooks "rulebooks," not "consolidated
  reference repositories."
- **Avoid verbs like "empower" / "unlock" / "streamline."** Use
  "cover", "track", "deliver", "ingest", "alert".
- **Quantify the time saved.** *[FILL IN: real benchmark if you have
  one — e.g. "reps tell us they save 8 hours/week vs. manual monitoring"]*

---

## Appendix: Source of truth

Everything in this pack is rebuilt from a single master spreadsheet
(`coverage.xlsx`) on each site deploy. If numbers drift, the spreadsheet
is authoritative. Regulators sheet is "Regulatory Coverage - Other",
rulebooks is "Consolidated rulebook regulator", and pricing is "Pricing
SKUs".
