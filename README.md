# SAI360 Regulatory Coverage — Interactive Explorer

Visual sales walkthrough for the SAI360 regulatory content offering. Built to share live over video calls: interactive world map, filterable directory, and plain-language search — all powered by one spreadsheet.

## How you update the content

**You only ever edit `coverage.xlsx`.** No code changes required.

1. Open `coverage.xlsx` in Excel / Google Sheets / Numbers.
2. Edit, add, or remove rows. Keep the column headers exactly as they are.
3. Save and commit the file to GitHub (drag-and-drop in the GitHub web UI works fine).
4. Vercel automatically rebuilds the site in ~1 minute. Refresh to see changes.

That's it.

### What each sheet becomes in the app

| Sheet | Becomes the tier |
|---|---|
| `Regulatory Coverage - Other` | **Regulators** tab |
| `Consolidated rulebook regulator` | **Rulebooks** tab |
| `Exchanges` | **Exchanges** tab |

### Required columns (don't rename these)

- **Regulatory Coverage - Other**: `Region`, `Jurisdicition` (sic — match the existing header), `Regulator Name`
- **Consolidated rulebook regulator**: `publisher_names`, `Jurisdiction`, `Region 1`, `Region 2`
- **Exchanges**: `Exchange`, `Country`, `Size`, `Permissions Requirement Category`, `Stock exchange`

### Adding a new country the world map doesn't recognize

If you add a jurisdiction name the site hasn't seen, it will show up in the directory but **not shade its country** on the world map. After your first deploy, visit the site and click the small "Data last built" text at the bottom — if countries are missing, email whoever maintains this site with the unmapped name, and they'll add it to `lib/countryMapping.mjs`.

## First-time deployment to Vercel

1. Create a new GitHub repo (private is fine).
2. Upload all files in this folder, including `coverage.xlsx`.
3. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
4. Vercel auto-detects Next.js. Click **Deploy**. No config needed.
5. After ~2 minutes, you'll get a URL like `sai360-coverage.vercel.app`. Share it in your calls.

## Running locally (optional — for developers)

```bash
npm install
npm run dev
# opens http://localhost:3000
```

The `predev` hook runs the xlsx → JSON build automatically.

## How it works (for the curious)

- **Next.js 14 App Router** for a static, fast-loading site ideal for screen share.
- `scripts/build-data.mjs` runs before every build, parses `coverage.xlsx` via SheetJS, cleans the data (typos like "Belguim"→"Belgium", trailing spaces, truncations, jurisdiction aliases, US states rolled up to country), and emits `lib/data/coverage.json`.
- The app reads that JSON at build time — no database, no runtime API calls.
- World map uses `react-simple-maps` with the world-atlas 110m TopoJSON. Countries are shaded by how many entries the current tier has there.
- Search is fuzzy (via `fuse.js`) and strips filler words, so "agencies we cover in Switzerland" resolves to "switzerland" and matches.
- Styling is Tailwind with SAI360 brand colors extracted from sai360.com.

## Tech stack

- Next.js 14 · React 18 · TypeScript
- Tailwind CSS
- react-simple-maps · d3-scale
- fuse.js
- SheetJS (xlsx)
