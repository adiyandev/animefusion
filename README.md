# AnimeFusion

AnimeFusion is a self-hosted anime platform foundation with a separate presentation/template layer.

> **Your server. Your brand. Your community.**

## Storefront

The React + Vite storefront showcases the platform, example templates, feature set and the planned marketplace direction.

### Routes

- `/` — Home
- `/templates` — Example templates
- `/features` — Platform features
- `/signin` — Storefront sign in UI
- `/signup` — Storefront account UI

The authentication screens are currently UI only; backend account functionality is planned.

## Architecture

AnimeFusion is intentionally split into two concepts:

- **Core** — platform logic, API, database, authentication, admin, providers, importing, scheduled jobs and configuration.
- **Templates** — presentation/UI that consumes the core rather than owning the platform's business logic.

Example templates are demonstrations of frontend direction. They are not hosted streaming services, and they do not require provider configuration themselves.

## Development

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Deployment

The repository is configured for GitHub Pages deployment through GitHub Actions. The workflow also publishes `dist/index.html` as `dist/404.html` so SPA routes can be loaded directly on GitHub Pages.

The current public project URL is:

`https://adiyandev.github.io/animefusion/`

If a custom domain is connected later, update the sitemap and robots file to use that canonical domain.

## Project status

The storefront is the presentation layer for the AnimeFusion product direction. Marketplace purchases, downloads, licensing, authentication backend, community submissions and extension delivery are future integration work rather than claims of currently-live functionality.
