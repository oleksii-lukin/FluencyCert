# Seed File Upload — Workflow Guide

This document describes how to seed uploaded files (PDF templates and custom fonts)
into the local database for development.

## Why This Exists

The existing `supabase/seed.sql` is pure PL/pgSQL and cannot interact with
Uploadthing. This workflow bridges the gap:

1. A TypeScript script uploads local files to Uploadthing via the server SDK.
2. It generates a `seed-files.sql` file with the returned URLs and keys.
3. `supabase db reset` runs both seed files, so the database starts with
   real uploaded file references.

## Directory Structure

```
supabase/seed-files/
├── manifest.json          # Config: what to upload + field metadata
├── seed-files.sql         # Generated SQL (committed to git)
├── pdfs/                  # Place .pdf files here (gitignored)
│   └── .gitkeep
└── fonts/                 # Place font files here (gitignored)
    └── .gitkeep
```

## Prerequisites

- `UPLOADTHING_TOKEN` in `.env.local`
- `dotenv-cli` (dev dependency, already installed)

## Workflow

### 1. Prepare files

Place your PDF templates in `supabase/seed-files/pdfs/` and font files in
`supabase/seed-files/fonts/`.

### 2. Configure manifest

Edit `supabase/seed-files/manifest.json`:

```json
{
  "pdfTemplates": [
    {
      "name": "Standard Certificate",
      "description": "Default certificate template",
      "fileName": "pdfs/standard-certificate.pdf",
      "fields": [
        {
          "pdfFieldName": "FullName",
          "sourceType": "database",
          "sourceKey": "first_name",
          "displayLabel": "Full Name",
          "fontFamily": "Inter",
          "fontSize": 24,
          "sortOrder": 0
        }
      ]
    }
  ],
  "fonts": [
    {
      "ref": "MyCustomFont-Regular",
      "fileName": "fonts/MyCustomFont-Regular.ttf"
    }
  ]
}
```

Each PDF template has a `fields` array that maps AcroForm fields in the PDF
to database columns or custom values. Font references (`uploadedFontRef`)
are resolved against the `ref` keys in the `fonts` array.

### 3. Run the upload script

```bash
dotenv -e .env.local -- npx tsx scripts/seed-upload-files.ts
```

This will:

- Upload each PDF to Uploadthing
- Upload each font to Uploadthing
- Generate `supabase/seed-files/seed-files.sql` with:
  - `INSERT INTO pdf_templates` statements (deterministic UUIDs)
  - `INSERT INTO pdf_template_fields` statements (field mappings)
  - Font reference comments with Uploadthing keys

### 4. Reset the database

```bash
supabase db reset
```

This runs:

1. All migrations (in order)
2. `supabase/seed.sql` — creates profiles, clubs, claims, feedback
3. `supabase/seed-files/seed-files.sql` — inserts PDF templates and fields

### 5. Commit

```bash
git add supabase/seed-files/manifest.json supabase/seed-files/seed-files.sql
git add src/docs/SEED_FILE_UPLOAD.md
git commit -m "add seed file upload workflow"
```

**Only `manifest.json` and `seed-files.sql` are committed** — the binary
files (PDFs, fonts) are gitignored.

## CI / Reproducibility

The generated `seed-files.sql` is committed to git, so CI environments and
other developers get the same seed data without needing the Uploadthing token.
If the files need to be updated, re-run the script on a machine with the token
and recommit the SQL.

## Deterministic UUIDs

Each template and field gets a stable UUID derived from its name via SHA-256.
The same manifest always produces the same UUIDs, so re-running produces
consistent results.

## Script reference

| Aspect | Detail |
|--------|--------|
| Script | `scripts/seed-upload-files.ts` |
| SDK | `UTApi` from `uploadthing/server` |
| Token | `UPLOADTHING_TOKEN` (from env or `.env.local`) |
| Output | `supabase/seed-files/seed-files.sql` |
| Config | `supabase/config.toml` — `sql_paths` references the output |
