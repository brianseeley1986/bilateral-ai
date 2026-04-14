# Deploying Bilateral

Read this before running any `vercel` command. Earlier sessions burned hours on every one of these traps.

## The Vercel project name is `bilater-ai` — not `bilateral-ai`

The real project is spelled without the second `l`. `bilateral.news` is aliased to it. If you run `vercel link` and see a project called `bilateral-ai`, that's a ghost from a past session that created a duplicate. Do NOT deploy to it — nothing points there.

Verify before every deploy:

```bash
cat .vercel/project.json
# Should show: "projectName":"bilater-ai"
# and: "projectId":"prj_ntj3kwLVhqO3uNELmAHvatwbxmkf"
```

If it's wrong: `vercel link --project bilater-ai --yes`

## Commit before you deploy

`vercel --prod` deploys the working tree, not git. If you deploy with uncommitted changes, those changes are LIVE on `bilateral.news` but are not in git history. Any other Claude session doing `git stash` or `git restore` will silently wipe them.

Rule: always `git add && git commit && git push` BEFORE `vercel --prod`.

## Module-level DB/API clients break the build

Next.js collects page data at build time. If a module has `const sql = neon(...)` or `const resend = new Resend(...)` at the top level, the build crashes when the env vars aren't injected at that phase. Always instantiate inside the function body.

```ts
// BAD — breaks build
const sql = neon(process.env.DATABASE_URL!)
export async function GET() { ... }

// GOOD
export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)
  ...
}
```

## Setting env vars via CLI: use `printf`, not `echo`

`echo` appends a newline. That extra `\n` silently breaks string comparisons (this is how `ADMIN_SECRET` was broken for hours — stored as 65 chars, compared against 64).

```bash
vercel env rm VAR_NAME production --yes
printf 'my-value' | vercel env add VAR_NAME production
```

## Changing env vars does NOT auto-redeploy

Vercel keeps old env values baked into existing deployments. After any env change, you must `vercel --prod` again for it to take effect.

## Standard deploy flow

```bash
# 1. Verify project
cat .vercel/project.json  # must say bilater-ai

# 2. Commit
git status
git add <specific files>
git commit -m "..."
git push

# 3. Deploy
vercel --prod

# 4. Confirm
# Output should include: Aliased: https://bilateral.news
# If it says anything else, you're on the wrong project
```

## When the build fails

Run locally first: `npm run build`. Vercel truncates error output. Local shows the full stack and exact line numbers.

## The domain

`bilateral.news` is aliased to whatever the latest prod deployment of `bilater-ai` is. The `*.vercel.app` URLs in the deploy output are just Vercel's own addressing — only `Aliased: https://bilateral.news` in the deploy output confirms you actually shipped to the real site.
