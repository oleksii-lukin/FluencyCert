<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:supabase-rules -->
# Supabase Migrations

Always use the Supabase CLI to create migrations:

```sh
pnpm supabase migration new <descriptive_name>
```

This generates a properly timestamped file in `supabase/migrations/`. Then write the SQL into that file. Never manually name migration files.
<!-- END:supabase-rules -->

<!-- BEGIN:verification-rules -->
# Verification — MANDATORY. Run BEFORE every commit and after every task.

## Process (do NOT skip any step)

1. **HARD REQUIREMENT**: All three must pass BEFORE you run `git commit`. Do not commit first and check after — that defeats the purpose.

2. Run these three commands in order:

```sh
pnpm run lint
pnpm run typecheck
pnpm run doctor
```

3. If any command fails:
   - If the errors are ONLY in files you did NOT touch → pre-existing, OK to proceed
   - If ANY error is in a file you touched → FIX IT before committing

4. **Check your staged files**: Before committing, run `git diff --cached` to see what's staged. If you modified any `.ts` / `.tsx` / `.js` / `.jsx` file, steps 2–3 are mandatory.

5. Only after all three pass (or only pre-existing errors remain), run `git commit`.

## When to skip

Never. These checks are mandatory before every commit and after completing any task.
<!-- END:verification-rules -->
