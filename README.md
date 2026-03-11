# Filmtersect

Filmtersect is a tiny web tool for comparing two film or TV professionals and finding titles they directly worked on together.

## Current Scaffold Scope

This repository currently includes the first-screen MVP scaffold plus live TMDb-backed person search and direct-overlap comparison:

- Next.js app structure with App Router + TypeScript + Tailwind CSS
- immersive placeholder poster-grid landing layout
- centered compare interface embedded in the grid
- two minimal compare inputs with responsive layout
- server-side person search route (`/api/search-person`) backed by TMDb
- debounced autocomplete UI for selecting two people
- server-side direct overlap route (`/api/filmtersects`) using TMDb combined credits
- shared-title results rendered directly on the homepage
- v1 supports only direct shared title overlaps (no filters/sorting/indirect connections)

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- clsx + tailwind-merge

## Run Locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## TMDb Credentials

Set this in your local environment:

- `TMDB_BEARER_TOKEN`

You can copy `.env.example` to `.env.local` and fill the token.

## Deploy On Vercel

1. Push this project to GitHub (or GitLab/Bitbucket).
2. In Vercel, select **Add New... > Project** and import the repository.
3. Keep default framework settings (Vercel will detect Next.js).
4. In **Project Settings > Environment Variables**, add:

	- Name: `TMDB_BEARER_TOKEN`
	- Value: your TMDb **API Read Access Token (v4 auth)**
	- Environments: Production (and Preview if desired)

5. Click **Deploy** for the first production build.
6. After code changes, push to your connected branch to redeploy automatically.

### Verify Deployment

1. Open the Vercel production URL.
2. Run a person search in both compare inputs.
3. Confirm shared titles load from `/api/filmtersects`.
4. Confirm background posters load from `/api/background-posters`.

## Attribution

This product uses the TMDb API but is not endorsed or certified by TMDb.

## Next Milestone

Refine shared-title presentation details and add optional role formatting improvements.
