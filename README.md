# Carb Maxxing

A client-side calculator for carbohydrate loading, hydration, and race-day fueling.

Live site: https://gayatri1205.github.io/carbmaxxing/

The app supports 5K, 10K, half-marathon, marathon, and custom race distances. It can also export a themed race plan as a PDF.

## Local development

```bash
pnpm install
pnpm run dev
```

## Production build

```bash
pnpm run build
```

The static site is written to `dist/client`.

## Deployment

GitHub Actions deploys the site to GitHub Pages after each push to `main`.
