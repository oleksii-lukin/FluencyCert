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
