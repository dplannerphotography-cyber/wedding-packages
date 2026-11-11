# DPlanner Photography website (dplanner.com.ng)

Static site built with [Eleventy](https://www.11ty.dev/) and published to GitHub Pages by
`.github/workflows/deploy.yml` whenever `main` is updated.

## Working on it

```
npm install        # once
npm start          # local preview at http://localhost:8812
npm run build      # writes the finished site to _site/
npm run og         # regenerate share images after changing a package name or price
```

## Where things live

| What | File |
|---|---|
| Business facts (phone, address, hours, promo end date) | `src/_data/site.json` |
| Wedding packages, prices, features, FAQs | `src/_data/packages.json` |
| Header and footer (shared by every page) | `src/_includes/partials/` |
| Home page | `src/index.njk` |
| Wedding comparison page | `src/weddings/index.njk` |
| The four package pages (one template) | `src/weddings/package.njk` |
| Studio page (not yet moved to the shared layout) | `src/photography/` |
| Styles and script | `src/assets/css/site.css`, `src/assets/js/site.js` |

Search the project for `TODO (Samuel)` to find content that still needs filling in.
