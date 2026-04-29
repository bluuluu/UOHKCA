# UOHKCA Wix Mirror

This repo contains a mirrored static copy of `https://www.uohkca.com/`.

## What is included

- Mirrored HTML routes (English, French, Chinese pages and subpages)
- Downloaded CSS/JS/image assets discovered from page markup and Wix resource attributes
- Preserved Wix runtime scripts and animation-related front-end code

Main mirrored site entry:

- `site/www.uohkca.com/index.html`
- Language entries:
  - `site/www.uohkca.com/fr/index.html`
  - `site/www.uohkca.com/zh/index.html`

GitHub Pages helpers:

- `index.html` redirects to `/site/www.uohkca.com/`
- `404.html` routes unknown paths into `/site/www.uohkca.com/...`
- `fr/index.html` redirects to `/site/www.uohkca.com/fr/`
- `zh/index.html` redirects to `/site/www.uohkca.com/zh/`

## Test URLs (local server root)

- `/site/www.uohkca.com/`
- `/site/www.uohkca.com/events/`
- `/fr/`
- `/zh/`

## Refresh the mirror

```bash
npm install
npm run mirror
```

This re-downloads the site into `site/`.

## Important limitation

Wix dynamic/backend features (for example forms, authenticated/member data, and any Wix APIs requiring live Wix services) may not function identically outside Wix hosting, even though the front-end files are mirrored.
