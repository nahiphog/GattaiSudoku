# Gattai Sudoku Studio

A dependency-free static site for the overlapping 9×9 Gattai Sudoku format. The homepage generates uniquely solvable puzzles using digging or build methods, with tools for solution verification and difficulty evaluation.

Live site: https://nahiphog.github.io/GattaiSudoku/

GitHub Pages publishes automatically on pushes to `main` through `.github/workflows/pages.yml`. The workflow installs Node.js 24, validates and stages the public assets, uploads the Pages artifact, and deploys it using the built-in GitHub token. No npm packages, custom secrets, YAML plugins, or Jekyll configuration are required. Pages uses **GitHub Actions** as its publishing source.

Run `node scripts/build-pages.mjs` locally to validate and prepare `_site`, then serve that directory with a static web server. Navigation uses relative paths so it works under the GitHub Pages repository subfolder. Canonical URLs and the sitemap point to the GitHub Pages address.

Daily puzzles are paused. `generate.html` redirects to the homepage, and the custom `404.html` redirects old daily paths within the Pages site. GitHub Pages does not support Vercel's server redirects or `/api` functions. The active generator and verifier are entirely browser-based; dormant Stripe/Supabase server handlers remain in the repository but are excluded from the published artifact.

`vercel.json` disables future automatic Vercel Git deployments. The old hosted project is shut down separately in Vercel; this file alone does not stop an existing deployment.

The solution walkthrough includes Remote Pairs: even-length chains of at least four cells with the same two candidates. It highlights the chain and eliminations, supports chains crossing the overlapping grids, and tries the technique before trial and error. Remote Pairs contributes 200 points at the Hard technique level to the existing difficulty calculation. Run `node --test scripts/remote-pairs.test.mjs` for its regression tests (also run by the Pages workflow).

Generated puzzles automatically show their rating, walkthrough, and technique tally below the result. The generator and verifier share `walkthrough.js`. Run `node --test scripts/remote-pairs.test.mjs scripts/walkthrough.test.mjs` to check techniques and both page flows.

Phistomefel Ring compares digit-count bounds in the 16-cell ring and four 2×2 corners independently for both grids. It scores 200 points per elimination step in the Hard technique band. Its candidate-only deductions are tested with `node --test scripts/phistomefel-ring.test.mjs`.
