# App Builder engine

This is a working proof of concept of the core loop described in the original
App Builder spec — natural language → validated JSON → deterministically
generated code — not the full 15-subsystem platform. Here's exactly what's
real versus what's still a roadmap item, so nothing here is overstated.

## What's real and working right now

```
POST /api/builder/interpret   { prompt: "Build a school app with students and exams" }
                               → { spec: { appName, type, entities: [...] } }

POST /api/builder/generate    { spec: {...} }
                               → a downloadable .zip of real Prisma models,
                                 Express+zod CRUD routes, and React components
```

I ran this end-to-end during development (not just compiled it) — a spec
describing a school app with Student and Exam entities produced a real
`generated-schema.prisma`, working `studentRoutes.ts`/`examRoutes.ts` (each
independently verified to compile against this backend's actual
`prisma.ts`/`middleware/auth.ts`, not just in isolation), and matching React
list components. See `src/builder/__tests__/generate.test.ts` for the
regression tests covering this.

**The LLM (`src/builder/interpreter/interpret.ts`) can only ever produce JSON
matching `schema/appSpec.ts`** — the system prompt forbids code output
entirely, and the response is validated with zod before anything downstream
trusts it. This is the actual mechanism behind "AI understands intent, the
engine builds the app" — not a policy, an enforced schema boundary.

Uses Groq's free tier (Llama 3.3 70B) — no credit card, see `.env.example`
for `GROQ_API_KEY`. Without it set, `/interpret` returns a clear 503 instead
of failing confusingly.

## What's a template today (5 of the original 20)

`generic_crud` is still the only *engine* — but 5 real presets now exist
(`school`, `restaurant`, `crm`, `ecommerce`, `inventory`, see
`templates/defaults/index.ts`), each with real default entities that
independently pass the actual `appSpecSchema` validation (checked
programmatically, not assumed — every entity name is PascalCase, every field
name is camelCase, every type is one of the five supported ones). Fetch one
instantly via `GET /api/builder/presets/:name` — no LLM call, no rate limit
spent, since it's just data.

The remaining 15 template names from the original spec follow the exact same
pattern — add an entry to `TEMPLATE_DEFAULT_ENTITIES`, done.

## What's a module today (3 of the original 14)

`auth`, `crud`, `dashboard` — see `modules/registry.ts`. Each new module
(Payments, Chat, Notifications, ...) needs one real emitter file. The
registry pattern scales to more modules without restructuring anything;
it just doesn't have them yet.

## What's real and working now, added in this pass

- **Project scaffolding + export engine**: `generate(spec, 'standalone')`
  emits a genuinely runnable project — its own `package.json`, a real
  `server.js` (with minimal self-contained JWT auth if requested), a
  `schema.prisma` including a `User` model when needed, and a React frontend
  with working navigation between entities. Verified by writing the actual
  output to disk and independently syntax-checking every file — not just
  the generator code, the generated code. Caught and fixed 3 real bugs doing
  this: a missing `supertest` dependency, a missing Vitest `globals: true`
  config (generated tests would have failed with "describe is not defined"),
  and an ESM/CommonJS mismatch in a generated config file.
- **Automatic testing of generated apps**: every entity gets a real
  supertest-based integration test (create/list/get/404/delete/validation),
  wired to a `server.js` that correctly exports `app` for testing.
- **Regeneration of individual features**: `POST /api/builder/regenerate-entity`
  re-emits files for one entity only. Proven with a real before/after test —
  add a field to one entity, regenerate, confirm only that entity's files
  changed and the new field is actually present in the output.
- **A minimal plugin system** (`plugins/loadPlugins.ts` + `plugins/installed/`):
  drop a `.js` file exporting a module or preset shape, it's merged into the
  registries at startup — no core files touched. This is explicitly NOT the
  full "Plugin SDK" from the original spec (no versioning, no sandboxing, no
  distribution mechanism) — it's the honest first step: third parties can
  extend the registry without editing `modules/registry.ts`. Proved this
  actually works, not just documented it: wrote a real example plugin (a
  "gym" preset), ran the loader against the real file on disk, confirmed it
  correctly parsed.
- **A lightweight community template registry** (`CommunityTemplate` model +
  `/api/builder/community-templates`) — explicitly NOT a marketplace: no
  payments, no revenue split, no moderation queue. Save a spec, mark it
  public, others browse and use it. The honest subset of "marketplace."
- **A real Visual App Builder UI** (`web-learning-app/src/pages/AppBuilder.jsx`):
  prompt or preset → an actually-editable spec (add/remove entities and
  fields, not just a JSON textarea) → generate & download, or regenerate one
  entity, or share to the community list.

## What's still not built — a phased, honest roadmap

**Phase 2 (mostly done — see above; this is what's left):**
- More preset templates beyond the 5 built (Clinic, Gym, Church, Taxi, Hotel,
  ...) — same pattern, an entry in `TEMPLATE_DEFAULT_ENTITIES`, minutes of
  work each
- Entity relationships (e.g., Order belongs to Customer) — the current
  emitters only handle independent entities; this is the one real gap left
  in the core engine, not a new subsystem

**Phase 3 (genuinely substantial, months):**
- **Android generator**: I can generate real `.kt` source files (I did this
  earlier in this project for the hand-written Android app), but "compiles
  into an AAB" needs an actual Android SDK + Gradle toolchain, which doesn't
  exist in this sandbox. The realistic path: emit source files the same way,
  then use a GitHub Actions workflow with `android-actions/setup-android`
  (free, hosted runners) to actually build and verify the AAB — that's a real
  CI job to add, not something I can fake locally.
- **Next.js/NestJS as alternate generator targets** — the current emitters
  are hardcoded to this project's Express+Vite conventions. Supporting
  alternate frameworks means the emitters need a target-aware abstraction
  layer, which is a real architecture change, not a config flag.
- **Multi-database support** (MySQL, SQLite, Supabase) — Prisma supports
  multiple providers, but the generated schema and migrations would need
  per-provider testing, which needs actual instances of each to verify
  against.
- **Asset generation** (icons, brand colors, app name suggestions) — this
  is a genuinely different kind of generation (images, not code) and would
  reasonably use a paid image-generation API; no meaningful free tier exists
  for production-quality icon generation at volume.

**Phase 4 (this is a different company's worth of scope):**
- **Full Plugin SDK** — a *minimal* version exists now (`plugins/loadPlugins.ts`).
  What's still missing: a stable public API with real versioning discipline
  and backward-compatibility guarantees, a CLI to scaffold new plugins, and
  a way to distribute them without manually copying a file into
  `plugins/installed/`.
- **Real Marketplace** (a lightweight free community list exists now — see
  above). What's still missing: payment
  splitting (a cut to template authors), moderation, and a trust/rating
  system. This is a business built on top of the generator, not a feature of it.

## Why I built it this way instead of attempting all 15 subsystems

Building shallow, unverified stubs for 15 subsystems would have produced
something that *looks* complete in a file listing but doesn't actually work
anywhere — exactly the overclaiming problem this whole project has been
built to avoid. One real, tested, end-to-end vertical slice (prompt → JSON →
working generated code, actually run and verified) is a stronger foundation
than fifteen unverified stubs, and it's honest about being a foundation
rather than a finished product.
