# Adalia’s Art

Static portfolio site for Adalia’s artwork. It includes the homepage, four galleries, commissions, testimonials, contact instructions, Etsy links, responsive layouts, and a custom 404 page.

## Preview

Requires Node.js 18 or newer.

```powershell
node preview.mjs
```

Open http://127.0.0.1:4173. Press Ctrl+C in the terminal to stop. To use another port, set `$env:PORT = '4174'` before running the command.

## Edit and rebuild

```powershell
node build.mjs
node check.mjs
```

- `content.json` — email address, links, artwork, and testimonials.
- `build.mjs` — page templates and page copy.
- `public/style.css` — visual styling and responsive layout.
- `public/site.js` — mobile navigation and carousel controls.
- `public/assets/` — optimized images, fonts, and font license.
- `dist/` — generated site; upload this directory after rebuilding.

### Add an artwork

To add artwork, place an optimized image in `public/assets/`, then add a record to the relevant gallery’s `images` array in `content.json`. Array order controls display order.

```json
{
  "src": "assets/new-painting.webp",
  "width": 1200,
  "height": 900,
  "alt": "Watercolor portrait of a couple beneath a flowering tree",
  "href": null
}
```

Use the image’s real `width`, `height`, and a useful `alt` description. Set `href` to an Etsy listing when the artwork should link there; use `null` to open the image itself. Run the build and check commands after editing.

## Contact links

The site uses `mailto:` links instead of forms. Visitors can email `adagirl13@gmail.com` with the artwork type, approximate size, location, timeline, budget, and reference images.

## Publish

The repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`. Push the project to a GitHub repository, then enable Pages in the repository settings:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, choose **GitHub Actions**.
3. Push to `main` or run the **Deploy to GitHub Pages** workflow manually.

The workflow runs the checks, builds `dist/`, and publishes it. You can also upload the contents of `dist/` manually to another static host. For a Git deployment, use:

- Build command: `node build.mjs`
- Publish directory: `dist`

The Pages workflow supplies its configured site URL to the build and checks, so repository paths such as `/AdaliasArtWebsite/` and custom domains both work. Local builds default to `site.origin` in `content.json`.

To build and preview the repository path locally, use the same `SITE_URL` for all three commands:

```powershell
$env:SITE_URL = 'https://david1socha.github.io/AdaliasArtWebsite/'
node build.mjs
node check.mjs
node preview.mjs
```

Open http://127.0.0.1:4173/AdaliasArtWebsite/. To return to the root preview, stop the server, remove the override with `Remove-Item Env:SITE_URL`, then rebuild and restart the preview.

The main routes are `/`, `/commissions-1/`, `/testimonies/`, `/contact/`, `/work/digital-illustration/`, `/work/murals/`, `/work/portraits/`, and `/work/flowercrowns-8fcyp/`.

## Checks

`node check.mjs` verifies page metadata, headings, links, image references, email recipients, gallery content, and generated assets. For syntax checks:

```powershell
node --check build.mjs
node --check public/site.js
node --check preview.mjs
```
