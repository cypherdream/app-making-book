# Contributing

Thanks for looking at this project. Since it's currently proprietary (see
`LICENSE`), this guide assumes internal/invited contributors — adjust the
"how to submit changes" section if you later open this up publicly.

## Project structure

```
android-app/         Kotlin, MVVM, Hilt, Room, Retrofit
backend/              Node/TypeScript, Express, Prisma, Socket.io
web-learning-app/     React/Vite learning app with its own backend calls
```

Each folder has its own README with setup instructions. Start with
`backend/README.md` — both other projects depend on it running.

## Before you start

1. Read the relevant folder's README.
2. Check `MONITORING.md` and `DEPLOY_FREE.md` if your change touches
   deployment, backups, or monitoring.
3. For backend changes touching the database, you'll be editing
   `backend/prisma/schema.prisma` — run `npx prisma migrate dev --name
   your_change_name` after editing it, don't hand-write migration SQL.

## Code style

- Backend and frontend both use ESLint + Prettier (see `.eslintrc` /
  `.prettierrc` in each project). Run `npm run lint` before committing.
- Commit hooks (husky) run linting automatically — see `.husky/pre-commit`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`. This is enforced
  by commitlint on commit, not just a suggestion.

## Testing

- Backend: `npm run test` (Vitest unit tests), `npm run worker:dev` to test
  the job queue locally.
- Frontend: `npm run test` (Vitest unit tests), `npm run test:e2e`
  (Playwright, needs the dev server running), which includes automated
  accessibility checks via axe-core.
- Both: CI runs `npm audit --audit-level=high` — a dependency with a known
  high/critical vulnerability will fail the build. Don't just silence this;
  update or replace the dependency.

## Security

- Never commit `.env` files or real secrets — `.gitignore` excludes them,
  but double check before pushing.
- Found a real vulnerability? See `legal/README.md`'s contact info, or open
  a private security advisory rather than a public issue if this repo is
  ever made public.

## Submitting changes

1. Branch from `main`.
2. Open a PR — CI must pass (lint, tests, `npm audit`) before merge.
3. For anything touching `backend/prisma/schema.prisma`, `security.ts`, or
   auth routes, get a second pair of eyes regardless of how small the change
   looks — auth bugs are exactly the kind of thing that looks fine in a diff
   and isn't.
